module.exports = function extendPrototype(proto, ext) {
    proto._originalProperties = {};
    const properties = Object.getOwnPropertyNames(ext.prototype);
    for (const prop of properties) {
        if (prop === 'constructor') {
            continue;
        }

        if (proto.hasOwnProperty(prop)) {
            proto._originalProperties[prop] = proto[prop];
        }

        proto[prop] = ext.prototype[prop];
    }
};