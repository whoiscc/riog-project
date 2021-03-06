// Generated by CoffeeScript 2.5.1
(function() {
  // The first reference implementation of the project is for the famous 2048 game. Before implementing it is better to list
  // some information for the game. Notice the registration is postponed after interfaces are defined.
  var Create, OnFrame, Redraw, register;

  register = function() {
    return application.RegisterGame({
      name: '2048',
      description: 'Join the tiles, get to 2048!',
      aspectRatio: 5 / 6,
      featureTagList: ['todo'],
      contextRevision: 'junkrat',
      interface: {Create, Redraw, OnFrame}
    });
  };

  // The aspect ratio is 5:6, so the height will be 20% larger than width, give us some header space for scoreboard, setting
  // and description.

  // Compare to the original version, the most noticeable different of reference implementation is that we will not implement
  // pause/resume/restart function, which should be leveraged from runtime. However, the undo function could be preserved.

  // Create the placeholder for interfaces, I will implement them later.
  Create = function() {
    console.log('[2048] create game');
    return {};
  };

  Redraw = function(context, data) {
    console.log('[2048] redraw');
    return null;
  };

  OnFrame = function(context, data) {
    return data;
  };

  // Now we can do the registration.
  register();

}).call(this);

//# sourceMappingURL=2048.js.map
