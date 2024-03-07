const extendPrototype = require('../utils/extendPrototype');
const DatabindTemplate = require("../DatabindTemplate");

class TemplateHook {
    renderToDom(ctx, node, cb) {
        if (ctx.hasOwnProperty('__nunjucks_databind_ctx') === false) {
            throw new Error('renderToDom can only be used with a context coming from createContext().');
        }

        const databindTemplate = new DatabindTemplate(this, node, ctx);
        databindTemplate.render(cb);
    }

    static extendTemplatePrototype(templatePrototype) {
        extendPrototype(templatePrototype, TemplateHook);
    }
}

module.exports = TemplateHook;