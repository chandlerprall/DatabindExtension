(function () {

  function ItemActions() {}

  ItemActions.addItem = function(text) {
    appDispatcher.trigger(ActionTypes.ADD_ITEM, {text: text});
  };

  window.ItemActions = ItemActions;

})();
