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
      interface for all games, since different games may behave dramatically differently on drawing. The different
      revisions should not have any difference in the sense of functionality, which is precisely controlled by feature
      tag system. The difference between revisions is only a matter of design pattern.
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

**The timing for calling `Redraw` and `OnFrame`.** `Redraw` is called when the game session is just created for the very
first frame of game, and when it is unavoidable. The cases are:

* Client window is resized
* (More cases to be added here)

`OnFrame` is called on the other, *normal* cases.

**Difference between `context` arguments for `Redraw` and `OnFrame`.** The core difference of them is that redraw
context is for *creating only* and on-frame context is for *both creating and modification*. The detail interface of
both context is listed below.

**Assumed idempotent/immutable of interface functions.** The runtime makes following assumption of interface functions.
If implementation breaks them, the behaviour is undefined.

* Session data is never directly modified, i.e. it is read only in `Redraw`, and
  `OnFrame` never directly modify its argument, instead it returns an updated copy.
* Multiple calls to `Redraw` with the same `data` argument will always perform the same drawing, i.e. same calling
  series to `context`
* Multiple calls to `OnFrame` could result in different states and drawings. After all we want some randomness in our
  games, right? ^_^
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
* Maybe more in the future.

----

In this section context interface of revision *junkrat* is introduced. in this revision, each shape along with some
other things is identified with a unique string regards to context, and the context interfaces are centralized to this
string, which from now on is referenced as identifier. The identifier could be chosen arbitrarily, and the recommended
pattern is `<type>%<name>%<index>`, e.g. the second cactus in the chrome dino game could be `image%cactus%1`, and all
three parts should be present even there is always only one instance in the game.

The reason to introducing identifier is to prevent foreign states from engine polluting game session state. With
identifier as key, this is no need to store any foreign object in session state, and it is recommended to further
compute identifier upon referencing instead of storing it statically in session state.

There is a preserved identifier `stage%%0`, which is useful in some cases like listening for per-game events.

**Interface of redraw context.** Use `context.Create(id).<type>` method to draw a shape whose identifier is `id`. For
example, `context.Create('text%score%0').Text({ ... })` draws a text to screen, and the text could be referenced with
identifier `text%score%0` later in on-frame context. Calling `Create` with same identifier more than once is an error.

The available set of `<type>` is corresponding to listed `shape:<type>` feature tags. The argument to each method is a
dict, whose keys are basically modeled from [Konva][konva-rect-api]. Noticeable differences:

* All size should be floating number between `0.0` and `1.0` instead of in pixels. This feature along with `aspectRaio`
  game attribute helps writing resolution-independent games.
* Additional key called `eventList`, which is a list of strings of event names, which should be required with
  `event:*` feature tags. The event kinds in this list will be listened for the shape, so only per-shape event kinds
  should be here. Currently, there is no interface for dis-listening events or modifying event list after creation.

> All per-game events are automatically listened. (Could have a better design here?)

[konva-rect-api]: https://konvajs.org/api/Konva.Rect.html

In addition to creating shapes, creation of timers could also be done by calling `Timer` method if `event:time` feature
tag is required. TODO: The detail interface of `Timer` method. Notice that `Timer` only counts in-game time, it will be
paused as well when the game is paused.

**Interface of on-frame context.** While the `Create` method above is also available in on-frame context, some more
interfaces are added. All these methods accept a previously created identifier as argument, and calling with non-exist
identifier is error.

`context.Remove(id)` removes a shape or timer. Its identifier is recycled.

`context.Update(id, { ... })` modifies a shape (there is not much thing to be modified for timer right?). The dict
argument is also modeled from Konva, with percentage sizes and one additional key called `identifier`, which allows
changing identifier. The new identifier must not be used upon calling, and the following referencing will go through the
new identifier in the same on-frame processing.

`context.DequeueEvent(id, eventName)` returns the first event whose kind is `eventName`. If there is no unhandled (i.e.
haven't been dequeued) such kind event, the method returns `null`. The internal queue structure allows game to partially
handle events and save the rest to following frames. The value of event is event-specific. For example, the value of
per-game mouse-moving event is a dict with keys `x` and `y` indicate where the mouse is (and the values are in
percentages of course). If there's no meaningful value for an event, it could simply be `true`. Use `stage%%0` as `id`
to get per-game events.

Because the interval between two on-frame calling could be longer than expect (because of slow client or pausing), the
trigger event series could be surprising, e.g. mouse-entering and mouse-leaving are both triggered. However, some causal
logic could be assumed to hold, e.g. two mouse-entering will not trigger in a row without a mouse-leaving in between.