(function(){

  var bindings = [];

  function Binding(elementId, context, contextParameter, renderTemplate) {
    this.elementId = elementId;
    this.context = context;
    this.contextIdentifier = contextParameter == null ? [] : contextParameter.split('.');
    this.renderTemplate = renderTemplate;

    this._hash = this.serializeContext();

    bindings.push(this);
  }

  Binding.getId = (function(){
    var currentId = 0;
    return function()
    {
      return currentId++;
    }
  })();

  Binding.updateBindings = function() {
    for (var i = 0; i < bindings.length; i++) {
      var binding = bindings[i];

      if (binding.isDirty()) {
        binding.render();
      }
    }

    Binding.scheduleUpdate();
  };

  Binding.scheduleUpdate = function() {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(Binding.updateBindings);
    } else {
      setTimeout(Binding.updateBindings, 1/60);
    }
  };

  Binding.prototype.serializeContext = function() {
    // Get the parameter
    var identified = this.context;
    var parts = this.contextIdentifier;

    for (var i = 0; i < this.contextIdentifier.length && identified != null; i++) {
      var part = parts[i];
      identified = identified[part];
    }

    if (typeof identified === 'string') {
      return identified;
    } else {
      return JSON.stringify(identified);
    }
   };

  Binding.prototype.isDirty = function() {
    var hash = this.serializeContext();
    return hash !== this._hash;
  };

  Binding.prototype.render = function() {
    document.getElementById(this.elementId).innerHTML = this.renderTemplate(this.context);
    this._hash = this.serializeContext();
  };

  Binding.scheduleUpdate();

  Handlebars.registerHelper('bind', function(context, options) {
    var id = 'boundelement-' + Binding.getId();
    new Binding(id, this, context, options.fn);
    return '<div id="' + id + '">' + options.fn(this) + '</div>';
  });

})();
