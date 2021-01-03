(function() {
  const Binding = function(elementId, context, contextParameter, renderTemplate) {
    this.elementId = elementId;
    this.context = context;
    this.contextIdentifier = contextParameter === null ? [] : contextParameter.split('.');
    this.renderTemplate = renderTemplate;

    this._hash = this.serializeContext();
  };

  Binding.prototype.serializeContext = function() {
    // Get the parameter
    let identified = this.context;

    for (let i = 0; i < this.contextIdentifier.length && identified != null; i++) {
      const part = this.contextIdentifier[i];
      identified = identified[part];
    }

    return JSON.stringify(identified);
  };

  Binding.prototype.isDirty = function() {
    const hash = this.serializeContext();
    return hash !== this._hash;
  };

  Binding.prototype.htmlToDummy = function(html) {
    const dummyElement = document.createElement('body');
    dummyElement.innerHTML = html;

    for (let i = 0; i < dummyElement.childNodes.length; i++) {
      let childNode = dummyElement.childNodes[i];

      if (childNode.nodeType === 1) {
        if (childNode.childNodes.length === 0) {
          continue;
        }
      } else if (childNode.nodeType === 3) {
        if (/^\s+$/.test(childNode.nodeValue)) {
          continue;
        }

        const wrapperElement = document.createElement('span');
        dummyElement.insertBefore(wrapperElement, childNode);
        wrapperElement.appendChild(childNode);

        childNode = wrapperElement;
      }

      childNode.setAttribute('data-nunjucks-databinding', this.elementId);
    }

    return dummyElement;
  };

  Binding.prototype.render = function() {
    const elements = document.querySelectorAll('[data-nunjucks-databinding="' + this.elementId + '"]');
    if (!!elements) {
      const dummyElement = this.htmlToDummy(this.renderTemplate());

      // TODO: What if amount of children is not the same anymore?
      // TODO: What if other scripts have played with the DOM, changed children or such?
      for (let i = 0; i < elements.length; i++) {
        elements[i].parentNode.replaceChild(dummyElement.children[i], elements[i]);
      }
    }

    this._hash = this.serializeContext();
  };

  const DatabindExtension = function(options) {
    options = options || {};

    this.tags = ['bind'];
    this.updateMode = options.updateMode || 'auto';
    if (this.updateMode === 'auto') {
      this.updateMode = DatabindExtension.determineUpdateMode();
    }

    this.bindings = [];
    this.currentId = 0;

    this.updateBindings();
  };

  DatabindExtension.determineUpdateMode = function() {
    if (DatabindExtension.detectProxyFeature()) {
      return 'proxy';
    } else if (DatabindExtension.detectSetTimeoutFeature()) {
      return 'poll';
    }

    return 'manual';
  };

  DatabindExtension.detectProxyFeature = function() {
    return typeof (window['Proxy']) === 'function';
  };

  DatabindExtension.detectSetTimeoutFeature = function() {
    return typeof (window['setTimeout']) === 'function';
  };

  DatabindExtension.prototype.createContext = function(context) {
    if (this.updateMode !== 'proxy') {
      return context;
    }

    const self = this;

    function replaceByProxy(obj) {
      for (const property in obj) {
        if (obj.hasOwnProperty(property) === false) {
          continue;
        }

        if (Array.isArray(obj[property]) || typeof (obj[property]) === 'object') {
          obj[property] = new Proxy(obj[property], self);

          if (typeof (obj[property]) === 'object') {
            replaceByProxy(obj[property]);
          }
        }
      }

      return new Proxy(obj, self);
    }

    return Object.seal(replaceByProxy(context));
  };

  DatabindExtension.prototype.set = function(obj, prop, value) {
    obj[prop] = value;
    this.updateBindings(true);

    return true;
  };

  DatabindExtension.prototype.getId = function() {
    return this.currentId++;
  };

  DatabindExtension.prototype.parse = function(parser, nodes) {
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
  };

  DatabindExtension.prototype.run = function(context, contextParameter, body) {
    if (body === null) {
      body = contextParameter;
      contextParameter = null;
    }

    const id = this.getId();
    const binding = new Binding(id, context.ctx, contextParameter, body);
    const dummyElement = binding.htmlToDummy(body());
    this.bindings.push(binding);

    return new nunjucks.runtime.SafeString(dummyElement.innerHTML);
  };

  DatabindExtension.prototype.unbind = function(context) {
    for (let i = 0; i < this.bindings.length; i++) {
      if (this.bindings[i].context === context) {
        this.bindings.splice(i, 1);
        i--;
      }
    }
  };

  DatabindExtension.prototype.updateBinding = function(binding, force = false) {
    if (force === true || binding.isDirty()) {
      binding.render();
    }
  };

  DatabindExtension.prototype.updateBindings = function(force = false) {
    for (let i = 0; i < this.bindings.length; i++) {
      this.updateBinding(this.bindings[i], force);
    }

    if (this.updateMode === 'poll') {
      this.scheduleUpdate();
    }
  };

  DatabindExtension.prototype.scheduleUpdate = function() {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(this.updateBindings.bind(this));
    } else {
      setTimeout(this.updateBindings.bind(this), 1 / 60);
    }
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = DatabindExtension;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return DatabindExtension;
      });
    } else {
      window.DatabindExtension = DatabindExtension;
    }
  }
})();