(function () {

  function ListActions() {}

  ListActions.addItem = function(text) {
    appDispatcher.trigger(ActionTypes.ADD_ITEM, {text: text});
  };

  window.ListActions = ListActions;

})();
