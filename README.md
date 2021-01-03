DatabindExtension
=================

One-way databinding extension for [Nunjucks templating engine](http://mozilla.github.io/nunjucks/)

Options
-----
When constructing the DatabindExtension, you can supply the following options:

* **updateMode**, Determines how the bindings are updated. Can be 'auto', 'proxy', 'pull' or 'manual'. Default is 'auto' which will detect the best approach based on browser features.
* **bindElementPrefix**, The prefix for binding wrapper elements. Default is 'boundelement-'

Usage
-----
To use the extension you must create a Nunjucks environment and add the `DatabindExtension` extension
```javascript
var nunjucksEnv = new nunjucks.Environment(new nunjucks.WebLoader('/templates'), {
    autoescape: true
});
nunjucksEnv.addExtension('BindExtension', new DatabindExtension({}));
```

Then, you create the context for nunjucks a little differently:
```javascript
var context = databindExtension.createContext({
    displayName: 'person',
    items: ['Test1', 'Test2']
});
```

The `DatabindExtension` extensions provides a `bind` tag for you to use in your templates. This will add a data-nunjucks-databind tag to any first-level children elements
```html
{% bind %}
    <ul>
    {% for item in items %}
        <li>{{item}}</li>
    {% endfor %}
    </ul>
{% endbind %}
```

Any content within the `{% bind %}{% endBind %}` tags will be automatically re-rendered when the template's data object changes. However, doing a full render whenever any part of the object is modified is far from optimal and can have unintended side effects, so the `{% bind %}` tag accepts an optional parameter indicating what part of the object needs to change to trigger a re-render.
```html
{% bind "items" %}
    <ul>
    {% for item in items %}
        <li>{{item}}</li>
    {% endfor %}
    </ul>
{% endbind %}
```

Including `"items"` tells the extension to only update this part of the template when the corresponding `items` attribute is modified.

Methods
-----
###createContext(context)
Create a context object based on an input object which is monitored for changes

###updateBindings([force])
Update bindings if they have changed. Set `force` to true to force the update regardless of change