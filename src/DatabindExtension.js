const ContextProxyHandler = require('./helpers/ContextProxyHandler');
const {extendEnvironmentPrototype} = require('./hooks/EnvironmentHook');
const {extendTemplatePrototype} = require("./hooks/TemplateHook");
const {extendNodePrototype} = require("./hooks/ASTNodeHook");

class DatabindExtension {
    constructor(options) {
        options = options || {};

        this.updateMode = options.updateMode || 'auto';
        if (this.updateMode === 'auto') {
            this.updateMode = 'proxy';
        }

        this._extendNunjucks(window['nunjucks']);
        extendEnvironmentPrototype(window['nunjucks']['Environment'].prototype);
        extendTemplatePrototype(window['nunjucks']['Template'].prototype);
        extendNodePrototype(window['nunjucks']['nodes']['Node'].prototype);
    }

    _extendNunjucks(inst) {
        inst.renderToDom = this.renderToDom;
    }

    createContext(ctx) {
        if (this.updateMode !== 'proxy') {
            return ctx;
        }

        return ContextProxyHandler.createContextProxy(ctx, ctx);
    }


    renderToDom(name, ctx, node, cb) {
        window['nunjucks']['environment'].renderToDom(name, ctx, node, cb);
    }

}

module.exports = DatabindExtension;