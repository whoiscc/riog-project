The reference implementation of game should call `application.RegisterGame` in global scope, one time for each game.
The `RegisterGame` method accepts one dict as argument, which should contain following keys: (notice: all keys are
required, if not applicable to certain game, use `null` value instead of omitting)

* `name` string of game's name
* `description` string of game's description, should not longer than few sentences
* `featureTagList` list of strings of *feature tags*. The list of available feature tags is showing below. If any
  feature tag in this list is not supported by current engine and runtime implementation, the game will be shown as
  "unsupported" in the menu and be disabled. It is a by-design limitation that "or" semantic cannot be performed, which
  prevents game implementation trying to be cross-platform.
* `contextRevision` is preserved and should always be `"junkrat"` for now.
    * The reason to introduce context revision is because that (maybe) it is hard to design a generally "good" context
      interface for all games and engines, since different games may behave dramatically differently on drawing. The
      different revisions should not have any difference in the sense of functionality, which is precisely controlled by
      feature tag system. The difference between revisions is only a matter of design pattern.
    * According to description above the revision of context actually works more like variant. The terminology decision
      here is because "variant" implies a "vanilla" version exists, which is not the case here.
* `aspectRatio` floating number of how many times is the size of width to height. The canvas will be the maximum-sized
  rect that follow this requirement.
* `interface` dict of interface functions of the game, including:
    * `Create()` called when a game session is created. Return a dict contains the initial state of the game session.
    * `Redraw(context, data)` called when the game needs a complete redraw. The drawing is performed through calling
      method on argument `context`, the session state which is return by previous `Create` or `OnFrame` is passed as
      argument `data`. Return nothing.
    * `OnFrame(context, data)` called when the game needs to draw next normal frame. The arguments are similar
      to `Redraw`, although the `context` passed is not the same and contains different set of methods. Return the
      updated data.
* more keys WIP

----

**About `Redraw`'s semantic.** The meaning of calling `Redraw` is to "restore" canvas content without modifying states.

To explain it let's consider an alternative interface for game. Instead of `Redraw` and `OnFrame`, a game should provide
`UpdateState` and `Draw`. `UpdateState` reads events and update game session states according to them, and `Draw` reads
the states and set color of every pixel on the canvas. With these two functions, engine could call `Create` to
initialize the session data, then call `Draw` to make the entering scene of the game. Then on each frame the engine
calls `UpdateState` first and then `Draw`. When game is restored from some storage, the engine first call `Draw` to
"restore" the last frame that ever `Draw`ed before the game is saved; these two `Draw` should produce exact same pixels,
because the input states are the same. This approach is actually borrowed from web frontend frameworks' pattern, which
works well in that case.

However, without a feasible diff-tree algorithm, calling `Draw` on every frame and redo everything from scratch is too
inefficient. Thus, we use `Redraw` and `OnFrame` instead, where `Redraw` is the same as `Draw`, and what `OnFrame` does
is one `UpdateState` and one `Draw`. Because the two tasks are done in the same function, unnecessary works could be
skipped.

With these explanations, it is clear that:

* `Redraw` is only called when `Draw` is called along without a `UpdateState` prepended, e.g. game start and restore.
* `Redraw` will be called with the exact same system states that provided to the last `OnFrame` call. Since the
  `UpdateState` part of `OnFrame` may mutate some system states, those states must be made to be unnecessary for
  redrawing, and `Redraw` cannot access to them.

**The properties and invariants of functions.** In the implementation of game, the mutability and side effect of
functions are deserved to be taken care of. Because of this, the functions (including `Create`, `Redraw` and `OnFrame`)
are divided into three groups (actually four, because some function could be in both the first two groups):

* **Non-idempotent.** If the function is called with the same arguments and same system states more the once, the
  following calling mutates system states. The most common case is the functions that call context interfaces to modify
  canvas. Notice that calling context interfaces is not sufficient to determine a function is non-idempotent. Beside the
  obvious case that a function conditionally skip all logic in the following calls, for example, a function that loops
  until a call to `DequeueEvent` returns falsy value could be idempotent, because the following call to it will escape
  the loop immediately.
* **Non-deterministic.** If the function is called with the same arguments and same system states more the once, and
  each time the function may return different values or mutate system states differently upon each calling. The most
  common case is a function that generates random numbers.
* **Pure.** If a function is idempotent and deterministic.

As simple examples, among the standard interfaces, `Create` could be non-deterministic, `Redraw` could be (and probably
will be) non-idempotent, and `OnFrame` could be both non-idempotent and non-deterministic. With this conclusion, the
engine could simply make some assumptions like:

* Multiple calls to `Redraw` with the same `data` argument will always perform the same drawing, i.e. same calling
  series to `context`
* If a calling to `OnFrame` returns a certain session state while performing certain drawing, another calling
  to `Redraw` with the returned session state as argument must perform the same drawing. This makes sure that canvas
  keeps the same after a redrawn pause.

----

**The kinds of feature tags.** Currently the feature tags includes:

* `engine:*` which directly indicates engine. If a game put this tag in its feature tags list, then it will only be
  supported when the specified engine is using by runtime. Thus, there is no need to put any other tags at all.
* `shape:*` indicates what shape could be drawn by the engine, and the most common ones are `shape:rect`
  , `shape:ellipse`, `shape:line`, `shape:text` etc. If a shape is supported by engine, there will be methods presenting
  in context for creating, modifying and removing the shape. The exact form of the methods depends on context revision.
* `event:*` indicates what event could be listened by the engine and the runtime. The exact way to inform game that an
  event is triggered depends on context revision. Notice that some events are listened per shape,
  e.g. `event:mouseenter`, some events are listened per game, e.g. `event:swipe`. Most of the events are triggered by
  user interactive, and the most important exception is `event:timer`.
* `context:*` should only appear in engines' feature tag lists, to indicate what context revision is supported by the
  engine. Because each game must specify what context revision it is using, so a dedicated `contextRevision` config key
  is required on game side.
* Maybe more in the future.
