(function () {

  var p = React.DOM.p;
  var h1 = React.DOM.h1;
  var div = React.DOM.div;
  var input = React.DOM.input;

  var PageComponent = React.createClass({
    mixins: [StateFromStoresMixin],

    getStateFromStores: function() {
      return {
        'displayName': PersonStore.displayName
      };
    },

    render: function() {
      // The wrapper div is a quirk of React - the response of the render
      // function needs to be a React.DOM element. It can wrap any number of
      // other elements.
      return div({}, [
        input({
          'type': 'text',
          'value': this.state.displayName,
          'onChange': this.onChange
        }),
        h1({}, "Hello"),
        p({}, "So glad you could make it, " + this.state.displayName),
        ListComponent({'items': this.props.items})
      ]);
    },

    onChange: function (event) {
      PageActions.updateName(event.target.value);
    }

  });

  window.PageComponent = PageComponent;

})();
