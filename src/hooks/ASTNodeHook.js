const transformer = require('nunjucks/src/transformer');
const extendPrototype = require('../utils/extendPrototype');
const seriesToString = require('../utils/seriesToString');

class ASTNodeHook {
    _renderCache = null;
    _parent = null;

    _compileToHTML(context, cb) {
        const name = 'rendernode';
        const c = new window['nunjucks']['compiler']['Compiler'](name);

        const frame = new window['nunjucks']['runtime'].Frame();
        c._emitFuncBegin(this, 'renderNode');
        c.compile(transformer.transform(
            this,
            [],
            name
        ), frame);
        c._emitFuncEnd();
        c._emitLine('return {');
        c._emitLine('renderNode\n};');

        const func = new Function(c.getCode());
        func()['renderNode'](context.env, context, frame, window['nunjucks']['runtime'], cb);
    }

    invalidateRenderCache() {
        this._renderCache = null;

        if (!!this._parent) {
            this._parent.invalidateRenderCache();
        }
    }

    render(context, cb) {
        if (!!this._renderCache) {
            return cb(null, this._renderCache);
        }

        if (!this['children'] || this['children'].length === 0 || this['typename'] === 'Output') {
            return this._compileToHTML(context, (err, output) => {
                this._renderCache = output;
                cb(err, output);
            });
        }

        const renderMethods = [];
        for (let i = 0; i < this['children'].length; i++) {
            renderMethods.push(this['children'][i].render.bind(this['children'][i], context));
        }

        seriesToString(renderMethods, (err, output) => {
            this._renderCache = output;
            cb(err, output);
        });
    }

    static extendNodePrototype(nodePrototype) {
        extendPrototype(nodePrototype, ASTNodeHook);
    }
}

module.exports = ASTNodeHook;