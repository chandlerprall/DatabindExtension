# DatabindExtension 3.0.0

One-way databinding extension for [Nunjucks templating engine](http://mozilla.github.io/nunjucks/)

## Options
When constructing the DatabindExtension, you can supply the following options:

* **updateMode**, Determines how the bindings are updated. Can be 'auto', 'proxy', or 'manual'. Default 'auto' which in
  most browser means proxy.

## Usage
To use the extension you do _not_ need to use the nunjucks environment addExtension method like a traditional extension.
You need to instantiate the DatabindExtension class which will add a few methods to the global nunjucks instance, to the
environment class and to the template class for convenience.

```javascript
const databindExtension = new DatabindExtension({});
```

Then, create the context:

```javascript
var context = databindExtension.createContext({
    displayName: 'person',
    items: ['Test1', 'Test2']
});
```

Then, use one of three methods to render the template. DatabindExtension requires you to provide your target DOM element
and will place the render result inside this DOM element.
It's possible to pass `document.body` as the node argument depending on your needs.

### nunjucks.renderToDom()
```javascript
nunjucks.renderToDom()
```
### environment.renderToDom()
```javascript
// ... Code to setup the environment 
environment.renderToDom() // In case you instantiated your own environment manually.
```
### template.renderToDom()
```javascript
// ... Code to load the template 
template.renderToDom() // In case you instantiated your own environment manually.
```

Instance Methods
-----
**createContext(context)**
Create a context object based on an input object which is monitored for changes