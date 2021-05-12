The reference implementation of game should call `application.RegisterGame` in global
scope, one time for each game. The `RegisterGame` method accepts one dict as argument,
which should contain following keys: (notice: all keys are required, if not applicable
to certain game, use `null` value instead of omitting)
* `name` string of game's name
* `description` string of game's description, should not longer than few sentences
* `interface` dict of interface functions of the game, including:
  * `Create()` called when a game session is created. Return a dict contains the
    initial state of the game session.
  * `Redraw(context, data)` called when the game needs a complete redraw. The drawing
    is performed through calling method on argument `context`, the session state which
    is return by previous `Create` or `OnFrame` is passed as argument `data`. Return
    nothing.
  * `OnFrame(context, data)` called when the game needs to draw next normal frame. The
    arguments are similar to `Redraw`, although the `context` passed is not the same
    and contains different set of methods. Return the updated data.
* more keys WIP
  
----

**The timing for calling `Redraw` and `OnFrame`.** `Redraw` is called when the game
session is just created for the very first frame of game, and when it is unavoidable.
The cases are:
* Client window is resized
* (More cases to be added here)

`OnFrame` is called on the other, *normal* cases.

**Difference between `context` arguments for `Redraw` and `OnFrame`.** The core
difference of them is that redraw context is for *creating only* and on-frame 
context is for *both creating and modification*. The detail interface of both context
is WIP.

**Assumed idempotent/immutable of interface functions.** The runtime makes following 
assumption of interface functions. If implementation breaks them, the behaviour is 
undefined.
* Session data is never directly modified, i.e. it is read only in `Redraw`, and 
  `OnFrame` never directly modify its argument, instead it returns an updated copy.
* Multiple calls to `Redraw` with the same `data` argument will always perform the
  same drawing, i.e. same calling series to `context`
* Multiple calls to `OnFrame` could result in different states and drawings. After
  all we want some randomness in our games, right? ^_^
* If a calling to `OnFrame` returns a certain session state while performing certain
  drawing, another calling to `Redraw` with the returned session state as argument
  must perform the same drawing. This makes sure that canvas keeps the same after a
  redrawn pause.