(function () {

  var StateFromStoresMixin = {

    getInitialState: function() {
      return this.getStateFromStores();
    },

    componentDidMount: function() {
      appDispatcher.on(ActionTypes.DATA_CHANGED, this.updateState, this);
    },

    componentWillUnmount: function() {
      appDispatcher.off(ActionTypes.DATA_CHANGED, this.updateState, this);
    },

    updateState: function () {
      this.setState(this.getStateFromStores());
    }

  };

  window.StateFromStoresMixin = StateFromStoresMixin;

})();
