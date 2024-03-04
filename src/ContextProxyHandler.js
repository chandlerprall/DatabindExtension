class ContextProxyHandler {
    static listeners = {};

    static addListener(rootContext, templateRenderer) {
        if (Array.isArray(ContextProxyHandler.listeners[rootContext]) === false) {
            ContextProxyHandler.listeners[rootContext] = [];
        }

        ContextProxyHandler.listeners[rootContext].push(templateRenderer);
    }

    static emit(rootContext, prop, value) {
        if (Array.isArray(ContextProxyHandler.listeners[rootContext])) {
            for (let i = 0; i < ContextProxyHandler.listeners[rootContext].length; i++) {
                ContextProxyHandler.listeners[rootContext][i](prop, value);
            }
        }
    }

    constructor(root, arrayName = null) {
        this.root = root;
        this.arrayName = arrayName;
    }

    set(obj, prop, value) {
        if (obj[prop] === value) {
            return true;
        }

        obj[prop] = value;
        ContextProxyHandler.emit(this.root, this.arrayName || prop, value);

        return true;
    }
}

module.exports = ContextProxyHandler;