class Binding {
  constructor(elementId, context, contextParameter, renderTemplate) {
    this.elementId = elementId;
    this.context = context;
    this.contextIdentifier = contextParameter === null ? [] : contextParameter.split('.');
    this.renderTemplate = renderTemplate;

    this._hash = this.serializeContext();
  }

  serializeContext() {
    // Get the parameter
    let identified = this.context;

    for (let i = 0; i < this.contextIdentifier.length && identified != null; i++) {
      const part = this.contextIdentifier[i];
      identified = identified[part];
    }

    return JSON.stringify(identified);
  }

  isDirty() {
    const hash = this.serializeContext();
    return hash !== this._hash;
  }

  htmlToDummy(html) {
    const dummyElement = document.createElement('body');
    dummyElement.innerHTML = html;

    for (let i = 0; i < dummyElement.childNodes.length; i++) {
      let childNode = dummyElement.childNodes[i];

      if (childNode.nodeType === 1) {
        if (childNode.childNodes.length === 0) {
          continue;
        }
      } else if (childNode.nodeType === 3) {
        if (/^\s+$/.test(childNode.nodeValue)) {
          continue;
        }

        const wrapperElement = document.createElement('span');
        dummyElement.insertBefore(wrapperElement, childNode);
        wrapperElement.appendChild(childNode);

        childNode = wrapperElement;
      }

      childNode.setAttribute('data-nunjucks-databinding', this.elementId);
    }

    return dummyElement;
  }

  render() {
    const elements = document.querySelectorAll('[data-nunjucks-databinding="' + this.elementId + '"]');
    if (!!elements) {
      const dummyElement = this.htmlToDummy(this.renderTemplate());

      // TODO: What if amount of children is not the same anymore?
      // TODO: What if other scripts have played with the DOM, changed children or such?
      for (let i = 0; i < elements.length; i++) {
        elements[i].parentNode.replaceChild(dummyElement.children[i], elements[i]);
      }
    }

    this._hash = this.serializeContext();
  }
}

module.exports = Binding;