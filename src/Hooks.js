class Hooks {
    static setup(ext) {
        if (Hooks.isSetup === true) {
            return;
        }

        Hooks.ext = ext;

        if (!!window['nunjucks']) {
            if (!!window['nunjucks']['Template']) {
                window['nunjucks']['Template'].prototype.renderToDom = Hooks.ext.templateRenderToDom;
            }

            if (!!window['nunjucks']['Environment']) {
                window['nunjucks']['Environment'].prototype.renderToDom = Hooks.ext.environmentRenderToDom;
            }

            window['nunjucks'].renderToDom = Hooks.ext.renderToDom;
        }

        Hooks.isSetup = true;
    }
}

module.exports = Hooks;