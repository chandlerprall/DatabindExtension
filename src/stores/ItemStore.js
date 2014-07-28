(function () {

  var ItemStore = {
    items: [ 'Test1', 'Test2' ]
  };

  appDispatcher.on(ActionTypes.ADD_ITEM, function(data) {
    ItemStore.items.push(data.text);
    appDispatcher.trigger(ActionTypes.DATA_CHANGED);
  });

  window.ItemStore = ItemStore;

})();