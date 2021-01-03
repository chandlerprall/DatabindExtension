(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DatabindExtension = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Binding = /*#__PURE__*/function () {
  function Binding(elementId, context, contextParameter, renderTemplate) {
    _classCallCheck(this, Binding);

    this.elementId = elementId;
    this.context = context;
    this.contextIdentifier = contextParameter === null ? [] : contextParameter.split('.');
    this.renderTemplate = renderTemplate;
    this._hash = this.serializeContext();
  }

  _createClass(Binding, [{
    key: "serializeContext",
    value: function serializeContext() {
      // Get the parameter
      var identified = this.context;

      for (var i = 0; i < this.contextIdentifier.length && identified != null; i++) {
        var part = this.contextIdentifier[i];
        identified = identified[part];
      }

      return JSON.stringify(identified);
    }
  }, {
    key: "isDirty",
    value: function isDirty() {
      var hash = this.serializeContext();
      return hash !== this._hash;
    }
  }, {
    key: "htmlToDummy",
    value: function htmlToDummy(html) {
      var dummyElement = document.createElement('body');
      dummyElement.innerHTML = html;

      for (var i = 0; i < dummyElement.childNodes.length; i++) {
        var childNode = dummyElement.childNodes[i];

        if (childNode.nodeType === 1) {
          if (childNode.childNodes.length === 0) {
            continue;
          }
        } else if (childNode.nodeType === 3) {
          if (/^\s+$/.test(childNode.nodeValue)) {
            continue;
          }

          var wrapperElement = document.createElement('span');
          dummyElement.insertBefore(wrapperElement, childNode);
          wrapperElement.appendChild(childNode);
          childNode = wrapperElement;
        }

        childNode.setAttribute('data-nunjucks-databinding', this.elementId);
      }

      return dummyElement;
    }
  }, {
    key: "render",
    value: function render() {
      var elements = document.querySelectorAll('[data-nunjucks-databinding="' + this.elementId + '"]');

      if (!!elements) {
        var dummyElement = this.htmlToDummy(this.renderTemplate()); // TODO: What if amount of children is not the same anymore?
        // TODO: What if other scripts have played with the DOM, changed children or such?

        for (var i = 0; i < elements.length; i++) {
          elements[i].parentNode.replaceChild(dummyElement.children[i], elements[i]);
        }
      }

      this._hash = this.serializeContext();
    }
  }]);

  return Binding;
}();

module.exports = Binding;

},{}],2:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ContextProxyHandler = /*#__PURE__*/function () {
  function ContextProxyHandler(owner) {
    _classCallCheck(this, ContextProxyHandler);

    this.owner = owner;
  }

  _createClass(ContextProxyHandler, [{
    key: "set",
    value: function set(obj, prop, value) {
      if (obj[prop] === value) {
        return;
      }

      obj[prop] = value;
      this.owner.updateBindings(true);
      return true;
    }
  }]);

  return ContextProxyHandler;
}();

module.exports = ContextProxyHandler;

},{}],3:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Binding = require('./Binding');

var ContextProxyHandler = require('./ContextProxyHandler');

var Hooks = require('./Hooks');

var DatabindExtension = /*#__PURE__*/function () {
  function DatabindExtension(options) {
    _classCallCheck(this, DatabindExtension);

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

  _createClass(DatabindExtension, [{
    key: "deepProxify",
    value: function deepProxify(obj) {
      for (var property in obj) {
        if (obj.hasOwnProperty(property) === false) {
          continue;
        }

        if (Array.isArray(obj[property]) || _typeof(obj[property]) === 'object') {
          obj[property] = new Proxy(obj[property], new ContextProxyHandler(this));

          if (_typeof(obj[property]) === 'object') {
            this.deepProxify(obj[property]);
          }
        }
      }

      return new Proxy(obj, new ContextProxyHandler(this));
    }
  }, {
    key: "createContext",
    value: function createContext(ctx) {
      ctx['__nunjucks_databind_ctx'] = true;

      if (this.updateMode !== 'proxy') {
        return ctx;
      }

      return this.deepProxify(ctx);
    }
  }, {
    key: "getId",
    value: function getId() {
      return this.currentId++;
    }
  }, {
    key: "parse",
    value: function parse(parser, nodes) {
      // get the tag token
      var tok = parser.nextToken(); // parse the args and move after the block end. passing true as the second arg is required if there are no parentheses

      var args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(tok.value); // parse the body and possibly the error block, which is optional

      var body = parser.parseUntilBlocks('endbind');
      parser.advanceAfterBlockEnd(); // See above for notes about CallExtension

      return new nodes.CallExtension(this, 'run', args, [body, null]);
    }
  }, {
    key: "run",
    value: function run(context, contextParameter, body) {
      if (body === null) {
        body = contextParameter;
        contextParameter = null;
      }

      var id = this.getId();
      var binding = new Binding(id, context.ctx, contextParameter, body);
      var dummyElement = binding.htmlToDummy(body());
      this.bindings.push(binding);
      return new nunjucks.runtime.SafeString(dummyElement.innerHTML);
    }
  }, {
    key: "unbind",
    value: function unbind(context) {
      for (var i = 0; i < this.bindings.length; i++) {
        if (this.bindings[i].context === context) {
          this.bindings.splice(i, 1);
          i--;
        }
      }
    }
  }, {
    key: "updateBinding",
    value: function updateBinding(binding) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (force === true || binding.isDirty()) {
        binding.render();
      }
    }
  }, {
    key: "updateBindings",
    value: function updateBindings() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      for (var i = 0; i < this.bindings.length; i++) {
        this.updateBinding(this.bindings[i], force);
      }

      if (this.updateMode === 'poll') {
        this.scheduleUpdate();
      }
    }
  }, {
    key: "scheduleUpdate",
    value: function scheduleUpdate() {
      if (window.requestAnimationFrame) {
        requestAnimationFrame(this.updateBindings.bind(this));
      } else {
        setTimeout(this.updateBindings.bind(this), 1 / 60);
      }
    }
  }], [{
    key: "determineUpdateMode",
    value: function determineUpdateMode() {
      if (DatabindExtension.detectProxyFeature()) {
        return 'proxy';
      } else if (DatabindExtension.detectSetTimeoutFeature()) {
        return 'poll';
      }

      return 'manual';
    }
  }, {
    key: "detectProxyFeature",
    value: function detectProxyFeature() {
      return typeof window['Proxy'] === 'function';
    }
  }, {
    key: "detectSetTimeoutFeature",
    value: function detectSetTimeoutFeature() {
      return typeof window['setTimeout'] === 'function';
    }
  }]);

  return DatabindExtension;
}();

module.exports = DatabindExtension;

},{"./Binding":1,"./ContextProxyHandler":2,"./Hooks":4}],4:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Hooks = /*#__PURE__*/function () {
  function Hooks() {
    _classCallCheck(this, Hooks);
  }

  _createClass(Hooks, null, [{
    key: "setup",
    value: function setup() {
      if (Hooks.isSetup === true) {
        return;
      }

      if (!!window['nunjucks'] && !!window['nunjucks']['lib']) {
        Hooks.oldLibExtend = window['nunjucks']['lib']['extend'];
        window['nunjucks']['lib']['extend'] = Hooks.libExtend.bind(this);
      }

      Hooks.isSetup = true;
    }
  }, {
    key: "libExtend",
    value: function libExtend(obj1, obj2) {
      if (obj2.hasOwnProperty('__nunjucks_databind_ctx')) {
        return obj2;
      }

      return Hooks.oldLibExtend(obj1, obj2);
    }
  }]);

  return Hooks;
}();

module.exports = Hooks;

},{}]},{},[3])(3)
});
