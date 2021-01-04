class ContextProxyHandler {
  constructor(owner) {
    this.owner = owner;
  }

  set(obj, prop, value) {
    if (obj[prop] === value) {
      return true;
    }

    obj[prop] = value;
    this.owner.updateBindings(true);

    return true;
  }
}

module.exports = ContextProxyHandler;