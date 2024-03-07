const extendPrototype = require('../utils/extendPrototype');
const {deferredTemplateMap} = require("../DatabindTemplate");

class EnvironmentHook {
    _parseDeferredTemplate(name, parentName, tmpl) {
        if (!!parentName && parentName === 'rendernode') {
            // getTemplate was used to fetch a partial of our main template (e.g. through include or extend)
            // AST of that template must be parsed and the node causing this method call must be replaced
            if (deferredTemplateMap.hasOwnProperty(name)) {
                for (let i = 0; i < deferredTemplateMap[name].length; i++) {
                    const {databindTemplate, deferredTemplateNode} = deferredTemplateMap[name][i];
                    const ast = window['nunjucks']['parser']['parse'](tmpl['tmplStr'], tmpl['env']['extensionsList'], tmpl['env']['opts']);

                    const childIndex = deferredTemplateNode._parent.children.indexOf(deferredTemplateNode);
                    deferredTemplateNode._parent.children[childIndex] = ast;

                    databindTemplate._parseAST(ast, deferredTemplateNode._parent);
                }

                delete deferredTemplateMap[name];
            }
        }
    }

    getTemplate(name, eagerCompile, parentName, ignoreMissing, cb) {
        if (window['nunjucks']['lib'].isFunction(parentName)) {
            cb = parentName;
            parentName = null;
            eagerCompile = eagerCompile || false;
        }

        if (window['nunjucks']['lib'].isFunction(eagerCompile)) {
            cb = eagerCompile;
            eagerCompile = false;
        }

        if (!!cb) {
            this['_originalProperties']['getTemplate'].call(this, name, eagerCompile, parentName, ignoreMissing, (err, tmpl) => {
                this._parseDeferredTemplate(name, parentName, tmpl);
                cb(err, tmpl);
            });
        } else {
            const tmpl = this['_originalProperties']['getTemplate'].call(this, name, eagerCompile, parentName, ignoreMissing);
            this._parseDeferredTemplate(name, parentName, tmpl);
            return tmpl;
        }
    }

    renderToDom(name, ctx, node, cb) {
        this['getTemplate'](name, (err, tmpl) => {
            if (!!err) {
                cb(err);
                return;
            }

            tmpl.renderToDom(ctx, node, cb);
        });
    }

    static extendEnvironmentPrototype(environmentPrototype) {
        extendPrototype(environmentPrototype, EnvironmentHook);
    }
}

module.exports = EnvironmentHook;