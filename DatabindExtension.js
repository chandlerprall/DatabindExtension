var Binding = function (elementId, context, contextParameter, renderTemplate) {
    this.elementId = elementId;
    this.context = context;
    this.contextIdentifier = contextParameter === null ? [] : contextParameter.split('.');
    this.renderTemplate = renderTemplate;

    this._hash = this.serializeContext();
};

Binding.prototype.serializeContext = function () {
    // Get the parameter
    var identified = this.context;

    for (var i = 0; i < this.contextIdentifier.length && identified != null; i++) {
        var part = this.contextIdentifier[i];
        identified = identified[part];
    }

    return JSON.stringify(identified);
};

Binding.prototype.isDirty = function () {
    var hash = this.serializeContext();
    return hash !== this._hash;
};

Binding.prototype.render = function () {
    document.getElementById(this.elementId).innerHTML = this.renderTemplate();
    this._hash = this.serializeContext();
};

var DatabindExtension = function (options) {
    options = options || {};

    this.tags = ['bind'];
    this.bindElementPrefix = options.bindElementPrefix || 'boundelement-';
    this.updateMode = options.updateMode || 'auto';
    if (this.updateMode === 'auto') {
        this.updateMode = DatabindExtension.determineUpdateMode();
    }

    this.bindings = [];
    this.currentId = 0;

    this.updateBindings();
};

DatabindExtension.determineUpdateMode = function () {
    if (DatabindExtension.detectProxyFeature()) {
        return 'proxy';
    } else if (DatabindExtension.detectSetTimeoutFeature()) {
        return 'poll';
    }

    return 'manual';
};

DatabindExtension.detectProxyFeature = function () {
    return typeof (window['Proxy']) === 'function';
};

DatabindExtension.detectSetTimeoutFeature = function () {
    return typeof (window['setTimeout']) === 'function';
};

DatabindExtension.prototype.createContext = function (context) {
    if (this.updateMode !== 'proxy') {
        return context;
    }

    var self = this;

    function replaceByProxy(obj) {
        for (var property in obj) {
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

    return replaceByProxy(context);
};

DatabindExtension.prototype.set = function (obj, prop, value) {
    obj[prop] = value;
    this.updateBindings(true);
};

DatabindExtension.prototype.getId = function () {
    return this.currentId++;
};

DatabindExtension.prototype.parse = function (parser, nodes) {
    // get the tag token
    var tok = parser.nextToken();

    // parse the args and move after the block end. passing true as the second arg is required if there are no parentheses
    var args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // parse the body and possibly the error block, which is optional
    var body = parser.parseUntilBlocks('endbind');

    parser.advanceAfterBlockEnd();

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body, null]);
};

DatabindExtension.prototype.run = function (context, contextParameter, body) {
    if (body === null) {
        body = contextParameter;
        contextParameter = null;
    }

    var id = this.bindElementPrefix + this.getId();
    var ret = new nunjucks.runtime.SafeString('<div id="' + id + '">' + body() + '</div>');

    this.bindings.push(new Binding(id, context.ctx, contextParameter, body));

    return ret;
};

DatabindExtension.prototype.unbind = function (context) {
    for (var i = 0; i < this.bindings.length; i++) {
        if (this.bindings[i].context === context) {
            this.bindings.splice(i, 1);
            i--;
        }
    }
};

DatabindExtension.prototype.updateBinding = function (binding, force = false) {
    if (force === true || binding.isDirty()) {
        binding.render();
    }
};

DatabindExtension.prototype.updateBindings = function (force = false) {
    for (var i = 0; i < this.bindings.length; i++) {
        this.updateBinding(this.bindings[i], force);
    }

    if (this.updateMode === 'poll') {
        this.scheduleUpdate();
    }
};

DatabindExtension.prototype.scheduleUpdate = function () {
    if (window.requestAnimationFrame) {
        requestAnimationFrame(this.updateBindings.bind(this));
    } else {
        setTimeout(this.updateBindings.bind(this), 1 / 60);
    }
};