(function () {

  function PageActions() {}

  PageActions.updateName = function(name) {
    appDispatcher.trigger(ActionTypes.UPDATE_NAME, {name: name});
  };

  window.PageActions = PageActions;

})();
