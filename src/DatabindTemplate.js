const ContextHolder = require('./helpers/ContextHolder');
const ContextProxyHandler = require('./helpers/ContextProxyHandler');
const morphdom = require('morphdom');

class DatabindTemplate {
    static deferredTemplateMap = {};

    constructor(template, targetNode, context) {
        this.template = template;
        this.targetNode = targetNode;
        this.context = context;

        this.ast = null;
        this.contextHolder = null;
        this.contextMap = {};
    }

    _parseAST(node, parent = null) {
        if (!(node instanceof window['nunjucks']['nodes']['Node'])) {
            return;
        }

        // Assign a parent, needed to invalidate cache recursively in case context changes
        node._parent = parent;

        // Fetch references
        if (node['typename'] === 'Symbol') {
            if (Array.isArray(this.contextMap[node.value]) === false) {
                this.contextMap[node.value] = [];
            }

            this.contextMap[node.value].push(node);
            return;
        } else if (node['typename'] === 'Include' || node['typename'] === 'Extends') {
            const deferredTemplateName = node['template'].value;
            if (Array.isArray(DatabindTemplate.deferredTemplateMap[deferredTemplateName]) === false) {
                DatabindTemplate.deferredTemplateMap[deferredTemplateName] = [];
            }

            DatabindTemplate.deferredTemplateMap[deferredTemplateName].push({
                databindTemplate: this,
                deferredTemplateNode: node
            });
            return;
        } else if (node['typename'] === 'If') {
            if (!!node['cond'] && !node['cond']['expr']) {
                if (Array.isArray(this.contextMap[node['cond'].value]) === false) {
                    this.contextMap[node['cond'].value] = [];
                }

                this.contextMap[node['cond'].value].push(node);
            }
            // Do not return, we want to explore the other fields too!
        }

        for (let i = 0; i < node['fields'].length; i++) {
            const field = node['fields'][i];

            if (!!node[field]) {
                if (field === 'children') {
                    for (let j = 0; j < node[field].length; j++) {
                        const childNode = node[field][j];

                        if (typeof (childNode['typename']) === 'undefined') {
                            continue;
                        }

                        this._parseAST(childNode, node);
                    }
                } else if (typeof (node[field]) === 'object') {
                    this._parseAST(node[field], node);
                }
            }
        }
    }

    render(cb) {
        this.ast = window['nunjucks']['parser']['parse'](this.template['tmplStr'], this.template['env']['extensionsList'], this.template['env']['opts']);
        this._parseAST(this.ast);

        this.contextHolder = new ContextHolder(this.context, this.template['blocks'], this.template['env']);
        this.ast.render(this.contextHolder, (err, html) => {
            if (!!err) {
                return cb(err);
            }

            this.targetNode.innerHTML = html;
            ContextProxyHandler.addListener(this.context, this.onContextChange.bind(this));

            cb(null);
        });
    }

    onContextChange(prop) {
        if (this.contextMap.hasOwnProperty(prop)) {
            for (let i = 0; i < this.contextMap[prop].length; i++) {
                this.contextMap[prop][i].invalidateRenderCache();
            }
        }

        this.ast.render(this.contextHolder, (err, updatedHtml) => {
            if (!!err) {
                return;
            }

            // TODO: morphdom has to create a temp DOM to parse the updatedHTML which is not ideal
            //  Implementation of vdom would greatly improve performance,
            //  but requires a major overhaul of how the RenderNodes are implemented
            morphdom(this.targetNode, `<div>${updatedHtml}</div>`, {childrenOnly: true});
        });
    }
}

module.exports = DatabindTemplate;