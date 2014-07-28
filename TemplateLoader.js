/**
 * Simplified from the Nunjucks template loader. Retrieves the template with a
 * simple Ajax call. Automatically adds ".hbs" to the template name.
 *
 * https://github.com/mozilla/nunjucks
 */
(function() {

  function TemplateLoader(baseUrl) {
    this.baseUrl = baseUrl;
  }

  TemplateLoader.prototype.getTemplate = function(name) {
    if (typeof name !== 'string') {
      throw new Error('template names must be a string: ' + name);
    }

    if (name.slice(-4) !== '.hbs') {
      name = name + '.hbs';
    }

    return Handlebars.compile(this.fetch(this.baseUrl + '/' + name));
  };

  TemplateLoader.prototype.fetch = function(url) {
    var src;

    var request = new XMLHttpRequest();

    url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' + (new Date().getTime());
    request.open('GET', url, false);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400){
        src = request.responseText;
      }
    };

    request.send();

    return src;
  };

  // Export the class
  window.TemplateLoader = TemplateLoader;

})();
