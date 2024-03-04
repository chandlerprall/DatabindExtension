const morphdom = require('morphdom');

const transformer = require('nunjucks/src/transformer'); // TODO: Try to get rid of this require!

const Hooks = require('./Hooks');
const ContextProxyHandler = require('./ContextProxyHandler');
const ContextHolder = require('./ContextHolder');

class DatabindExtension {
    static determineUpdateMode() {
        if (DatabindExtension.detectProxyFeature()) {
            return 'proxy';
        }

        return 'manual';
    }

    static detectProxyFeature() {
        return typeof (window['Proxy']) === 'function';
    }

    renderToDom(name, ctx, node, cb) {
        this.environmentRenderToDom(name, ctx, node, cb);
    }

    environmentRenderToDom(name, ctx, node, cb) {
        if (typeof (ctx) === 'function') {
            cb = ctx;
            ctx = null;
        }

        window['nunjucks']['Environment'].getTemplate(name, (err, tmpl) => {
            if (!!err) {
                cb(err);
                return;
            }

            tmpl.templateRenderToDom(ctx, node, cb).then(r => {
            });
        });
    }

    static createContextUsageMap(map, context, node) {
        console.log(node['typename'], node);
        node.typename2 = node.typename;

        if (node['typename'] === 'Symbol') {
            if (Array.isArray(map[node.value]) === false) {
                map[node.value] = [];
            }

            map[node.value].push(node);
        } else if (node['typename'] === 'For') {
            if (Array.isArray(map[node.arr.value]) === false) {
                map[node.arr.value] = [];
            }

            map[node.arr.value].push(node);
        }

        // For If Nodes
        if (!!node['cond'] && !!node['cond']['expr'] && !!node['cond']['expr']['args']) {
            for (let i = 0; i < node.cond.expr.args.children.length; i++) {
                const child = node.cond.expr.args.children[i];
                child.parent = node; // TODO: It's necessary to assign the parent node, but is this the best place to do so?
                DatabindExtension.createContextUsageMap(map, context, child);
            }
        }

        // For any node with "regular" children
        if (!!node['children']) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                child.parent = node; // TODO: It's necessary to assign the parent node, but is this the best place to do so?
                DatabindExtension.createContextUsageMap(map, context, child);
            }
        }
    }

    async templateRenderToDom(ctx, node, cb) {
        if (ctx.hasOwnProperty('__nunjucks_databind_ctx') === false) {
            throw new Error('renderToDom can only be used with a context coming from createContext().');
        }

        const rootNode = window['nunjucks']['parser']['parse'](this['tmplStr'], this['env']['extensionsList'], this['env']['opts']);

        const contextUsageMap = {};
        DatabindExtension.createContextUsageMap(contextUsageMap, ctx, rootNode);

        const context = new ContextHolder(ctx, this['blocks'], this['env']);

        for (let i = 0; i < rootNode.children.length; i++) {
            DatabindExtension.addRenderMethodsToNode(rootNode.children[i], this, context);
        }

        node.innerHTML = await DatabindExtension.renderNodes(rootNode);


        ContextProxyHandler.addListener(ctx, async (prop, value) => {
            if (contextUsageMap.hasOwnProperty(prop)) {
                for (let i = 0; i < contextUsageMap[prop].length; i++) {
                    if (contextUsageMap[prop][i].hasOwnProperty('invalidateRenderCache')) {
                        contextUsageMap[prop][i].invalidateRenderCache();
                    } else {
                        contextUsageMap[prop][i].parent.invalidateRenderCache();
                    }
                }
            }

            const updatedHtml = await DatabindExtension.renderNodes(rootNode);
            morphdom(node, `<div>${updatedHtml}</div>`, {childrenOnly: true});
        });

        cb(null);
    }

    static addRenderMethodsToNode(node, self, context) {
        node.render = async function () {
            if (!!this._renderCache) {
                return this._renderCache;
            }

            const c = new window['nunjucks']['compiler']['Compiler']('noop');

            const frame = new window['nunjucks']['runtime'].Frame();
            c._emitFuncBegin(this, 'renderNode');
            c.compile(transformer.transform(
                this,
                [],
                'noop'
            ), frame);
            c._emitFuncEnd();
            c._emitLine('return {');
            c._emitLine('renderNode\n};');

            const func = new Function(c.getCode());
            const result = await new Promise((res, rej) => {
                func()['renderNode'](self['env'], context, frame, window['nunjucks']['runtime'], (err, output) => {
                    if (!!err) rej(err);
                    res(output);
                });
            });

            this._renderCache = result;
            return result;
        };

        node.invalidateRenderCache = async function () {
            this._renderCache = null;
        }
    }

    static async renderNodes(parsedNodes) {
        let html = '';
        for (let i = 0; i < parsedNodes.children.length; i++) {
            try {
                html += await parsedNodes.children[i].render();
            } catch (ex) {
                console.error(ex);
            }
        }

        return html;
    }

    constructor(options) {
        options = options || {};

        this.updateMode = options.updateMode || 'auto';
        if (this.updateMode === 'auto') {
            this.updateMode = DatabindExtension.determineUpdateMode();
        }

        Hooks.setup(this);
    }

    deepProxify(obj, root) {
        if (obj.hasOwnProperty('__nunjucks_databind_ctx')) {
            return obj;
        }

        for (const property in obj) {
            if (obj.hasOwnProperty(property) === false) {
                continue;
            }

            if (Array.isArray(obj[property]) || typeof (obj[property]) === 'object') {
                obj[property]['__nunjucks_databind_ctx'] = true;
                obj[property] = new Proxy(obj[property], new ContextProxyHandler(root, Array.isArray(obj[property]) ? property : null));

                if (typeof (obj[property]) === 'object') {
                    this.deepProxify(obj[property], root);
                }
            }
        }

        obj['__nunjucks_databind_ctx'] = true;
        return new Proxy(obj, new ContextProxyHandler(root));
    }

    createContext(ctx) {
        return this.deepProxify(ctx, ctx);
    }
}

module.exports = DatabindExtension;