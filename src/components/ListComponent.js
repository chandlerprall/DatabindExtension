(function () {

  var div = React.DOM.div;
  var ul = React.DOM.ul;
  var li = React.DOM.li;
  var input = React.DOM.input;
  var button = React.DOM.button;

  var ListComponent = React.createClass({
    mixins: [StateFromStoresMixin],

    getStateFromStores: function() {
      return {
        'items': ItemStore.items
      };
    },

    render: function() {
      return div({}, [
        ul({}, this.state.items.map(function(item) {
          return li({}, item);
        }, this)),
        input({'type': 'text', 'ref': 'itemInput'}),
        button({'onClick': this.onClick}, 'Add')
      ]);
    },

    onClick: function() {
      ListActions.addItem(this.refs.itemInput.state.value);
    }

  });

  window.ListComponent = ListComponent;

})();
