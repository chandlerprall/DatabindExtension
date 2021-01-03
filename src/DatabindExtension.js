const Binding = require('./Binding');
const ContextProxyHandler = require('./ContextProxyHandler');
const Hooks = require('./Hooks');

class DatabindExtension {
  constructor(options) {
    options = options || {};

    this.tags = ['bind'];
    this.updateMode = options.updateMode || 'auto';
    if (this.updateMode === 'auto') {
      this.updateMode = DatabindExtension.determineUpdateMode();
    }

    this.bindings = [];
    this.currentId = 0;

    this.updateBindings();
    Hooks.setup();
  }

  deepProxify(obj) {
    for (const property in obj) {
      if (obj.hasOwnProperty(property) === false) {
        continue;
      }

      if (Array.isArray(obj[property]) || typeof (obj[property]) === 'object') {
        obj[property] = new Proxy(obj[property], new ContextProxyHandler(this));

        if (typeof (obj[property]) === 'object') {
          this.deepProxify(obj[property]);
        }
      }
    }

    return new Proxy(obj, new ContextProxyHandler(this));
  }

  createContext(ctx) {
    ctx['__nunjucks_databind_ctx'] = true;
    if (this.updateMode !== 'proxy') {
      return ctx;
    }

    return this.deepProxify(ctx);
  }

  getId() {
    return this.currentId++;
  }

  parse(parser, nodes) {
    // get the tag token
    const tok = parser.nextToken();

    // parse the args and move after the block end. passing true as the second arg is required if there are no parentheses
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // parse the body and possibly the error block, which is optional
    const body = parser.parseUntilBlocks('endbind');

    parser.advanceAfterBlockEnd();

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body, null]);
  }

  run(context, contextParameter, body) {
    if (body === null) {
      body = contextParameter;
      contextParameter = null;
    }

    const id = this.getId();
    const binding = new Binding(id, context.ctx, contextParameter, body);
    const dummyElement = binding.htmlToDummy(body());
    this.bindings.push(binding);

    return new nunjucks.runtime.SafeString(dummyElement.innerHTML);
  }

  unbind(context) {
    for (let i = 0; i < this.bindings.length; i++) {
      if (this.bindings[i].context === context) {
        this.bindings.splice(i, 1);
        i--;
      }
    }
  }

  updateBinding(binding, force = false) {
    if (force === true || binding.isDirty()) {
      binding.render();
    }
  }

  updateBindings(force = false) {
    for (let i = 0; i < this.bindings.length; i++) {
      this.updateBinding(this.bindings[i], force);
    }

    if (this.updateMode === 'poll') {
      this.scheduleUpdate();
    }
  }

  scheduleUpdate() {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(this.updateBindings.bind(this));
    } else {
      setTimeout(this.updateBindings.bind(this), 1 / 60);
    }
  }

  static determineUpdateMode() {
    if (DatabindExtension.detectProxyFeature()) {
      return 'proxy';
    } else if (DatabindExtension.detectSetTimeoutFeature()) {
      return 'poll';
    }

    return 'manual';
  }

  static detectProxyFeature() {
    return typeof (window['Proxy']) === 'function';
  }

  static detectSetTimeoutFeature() {
    return typeof (window['setTimeout']) === 'function';
  }
}

module.exports = DatabindExtension;