(function () {

  function PersonActions() {}

  PersonActions.updateName = function(name) {
    appDispatcher.trigger(ActionTypes.UPDATE_NAME, {name: name});
  };

  window.PersonActions = PersonActions;

})();
