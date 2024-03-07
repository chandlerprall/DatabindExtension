/*
This class is needed because the Context class from nunjucks is not exposed through the global instance of nunjucks.
We could import/require it of course, but unfortunately the original Context class makes a copy of the ctx object where we actually want to use a reference
 */
class ContextHolder {
    constructor(ctx, blocks, env) {
        this.env = env;
        this.ctx = ctx; // This is the only changed line compared to Nunjucks original Context class

        this.blocks = {};
        this.exported = [];

        for (const blockKey in blocks) {
            this.addBlock(blockKey, blocks[blockKey]);
        }
    }

    lookup(name) {
        // This is one of the most called functions, so optimize for
        // the typical case where the name isn't in the globals
        if (name in this.env.globals && !(name in this.ctx)) {
            return this.env.globals[name];
        } else {
            return this.ctx[name];
        }
    }

    setVariable(name, val) {
        this.ctx[name] = val;
    }

    getVariables() {
        return this.ctx;
    }

    addBlock(name, block) {
        this.blocks[name] = this.blocks[name] || [];
        this.blocks[name].push(block);

        return this;
    }

    getBlock(name) {
        if (!this.blocks[name]) {
            throw new Error('unknown block "' + name + '"');
        }

        return this.blocks[name][0];
    }

    getSuper(env, name, block, frame, runtime, cb) {
        const idx = this.blocks[name].indexOf(block);
        const blk = this.blocks[name][idx + 1];
        const context = this;

        if (idx === -1 || !blk) {
            throw new Error('no super block available for "' + name + '"');
        }

        blk(env, context, frame, runtime, cb);
    }

    addExport(name) {
        this.exported.push(name);
    }

    getExported() {
        const exported = {};
        this.exported.forEach((name) => {
            exported[name] = this.ctx[name];
        });

        return exported;
    }
}

module.exports = ContextHolder;