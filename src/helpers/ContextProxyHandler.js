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

    static createContextProxy(obj, root) {
        if (obj.hasOwnProperty('__nunjucks_databind_ctx')) {
            return obj;
        }

        for (const property in obj) {
            if (obj.hasOwnProperty(property) === false) {
                continue;
            }

            if (Array.isArray(obj[property]) || typeof (obj[property]) === 'object') {
                obj[property] = new Proxy(obj[property], new ContextProxyHandler(root, Array.isArray(obj[property]) ? property : null));

                if (typeof (obj[property]) === 'object') {
                    ContextProxyHandler.createContextProxy(obj[property], root);
                }
            }
        }

        obj['__nunjucks_databind_ctx'] = true;
        return new Proxy(obj, new ContextProxyHandler(root));
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