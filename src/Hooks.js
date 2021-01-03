class Hooks {
  static setup() {
    if (Hooks.isSetup === true) {
      return;
    }

    if (!!window.nunjucks && !!window.nunjucks.lib) {
      Hooks.oldLibExtend = window.nunjucks.lib.extend;
      window.nunjucks.lib.extend = Hooks.libExtend.bind(this);
    }

    Hooks.isSetup = true;
  }

  static libExtend(obj1, obj2) {
    if (obj2.hasOwnProperty('__nunjucks_databind_proxy')) {
      return obj2;
    }

    return Hooks.oldLibExtend(obj1, obj2);
  }
}

module.exports = Hooks;