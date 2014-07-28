(function () {

  var PersonStore = {
    displayName: 'person'
  };

  appDispatcher.on(ActionTypes.UPDATE_NAME, function(data) {
    PersonStore.displayName = data.name;
    appDispatcher.trigger(ActionTypes.DATA_CHANGED);
  });

  window.PersonStore = PersonStore;

})();
