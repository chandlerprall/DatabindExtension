const Hooks = require('./Hooks');

class ContextProxyHandler {
  constructor(owner) {
    Hooks.setup();
    this.owner = owner;
  }

  set(obj, prop, value) {
    obj[prop] = value;

    //Reflect.set(obj, prop, value);
    this.owner.updateBindings(true);

    return true;
  }
}

module.exports = ContextProxyHandler;