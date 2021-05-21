> "It's a perfect day for some mayhem."

In junkrat revision, each entity, i.e. shape along with some other things is identified with a unique string regards to
context, and the context interfaces are centralized to this string, which from now on is referenced as **identifier**.
The identifier could be chosen arbitrarily, and the recommended pattern is `<type>%<name>%<index>`, e.g. the second
cactus in the chrome dino game could be `image%cactus%1`, and all three parts should be present even there is always
only one instance in the game.

The reason to introducing identifier is to prevent foreign states from engine polluting game session state. With
identifier as key, this is no need to store any foreign object in session state, and it is encouraged to further compute
identifier upon referencing instead of storing it statically in session state.

**Interface of redraw context.** Use `context.Create(id).<type>` method to draw a shape whose identifier is `id`. For
example, `context.Create('text%score%0').Text({ ... })` draws a text to screen, and the text could be referenced with
identifier `text%score%0` later in on-frame context. Calling `Create` with same identifier more than once is an error.

TODO: prefix shape or entity?

The available set of `<type>` is corresponding to listed `shape:<type>` feature tags. The argument to each method is a
dict, whose keys are basically modeled from [Konva][konva-rect-api]. Noticeable differences:

* All size should be floating number between `0.0` and `1.0` instead of in pixels. This feature along with `aspectRaio`
  game attribute helps writing resolution-independent games.
    * The exception is `crop` attribute for images. It is in pixel because it applies to original images, which should
      have fixed-pixel size. This toy project does not handle multi-resolution resources. ^_^
* The `rotation` should be in radius.
* Additional key called `eventList`, which is a list of strings of event names, which should be required with
  `event:*` feature tags. The event kinds in this list will be listened for the shape, so only per-shape event kinds
  should be here. Currently, there is no interface for dis-listening events or modifying event list after creation.

[konva-rect-api]: https://konvajs.org/api/Konva.Rect.html

A special *stage* type entity could be created by calling `Stage` method. The stage entity is used to config the game
globally, and at most one stage could be created at a time. Currently, the only available config key is
`eventList` which could be used to listen to per-game events. TODO: set game title and terminate game.

**Interface of on-frame context.** While the `Create` method above is also available in on-frame context, some more
interfaces are added. All these methods accept a previously created identifier as argument, and calling with non-exist
identifier is error.

`context.Remove(id)` removes an entity. Its identifier is recycled.

`context.Update(id, { ... })` modifies a shape (there is not much thing to be modified for timer right?). The dict
argument is also modeled from Konva, with percentage sizes and one additional key called `identifier`, which allows
changing identifier. The new identifier must not be used upon calling, and the following referencing will go through the
new identifier in the same on-frame processing. For timers, `pause` could be used as key with boolean value to pause
them.

`context.DequeueEvent(id, eventName)` returns the first event whose kind is `eventName`. If there is no unhandled (i.e.
haven't been dequeued) such kind event, the method returns `null`. The internal queue structure allows game to partially
handle events and save the rest to following frames. The value of event is event-specific. For example, the value of
per-game mouse-moving event is a dict with keys `x` and `y` indicate where the mouse is (and the values are in
percentages of course). If there's no meaningful value for an event, it could simply be `true`.

Because the interval between two on-frame calling could be longer than expect (because of slow client or pausing), the
trigger event series could be surprising, e.g. mouse-entering and mouse-leaving are both triggered. However, some causal
logic could be assumed to hold, e.g. two mouse-entering will not trigger in a row without a mouse-leaving in between.

**Invariant about `Create` and `Update`.** For any entity, if you use a set of config to `Create` it and then use 
`Update` to overwrite a subset of it, then for every frame after the `Update` call, the effect to the system (including
e.g. canvas pixels and engine internal states) will always be equivalent to directly calling `Create` instead of 
`Update` on the same frame, with the override config. This invariant is essential to the invariant that `Redraw` needs
to obey, which is described in [game interface document][gi-doc].

[gi-doc]: GameInterface.markdown

**Other misc interface.** In both context, there is a `system` key available to provide some read-only low-level global
information. Only access to them when necessary, and use the other interface instead whenever possible.

* `context.system.numberFrame` the number of frames that have been drawn to screen, which should be equal to the sum of
  past calling of `Redraw` and `OnFrame`. Because game could run under different frame rate, animation control by frame
  number will have various speed, use number of millisecond instead for it. Number of frame may be useful to determine
  some frame-level execution ordering.
* `context.system.numberMillisecond` the number of millisecond that the game have been running. Notice that this is a
  floating number, and the underlying JavaScript runtime may provide sub-millisecond precision.
* `context.system.engineNumberFrame/engineNumberMillisecond` similar to above, but being reset every time the engine is
  replaced, i.e. on `Redraw` call.
* `context.system.timeStamp` the timestamp that gets from `requestAnimationFrame`. Use it with care for pausing.
* `context.system.width/height` the real size of canvas in pixels. Promised not change before next `Redraw` call.
* `context.system.aspectRatio` how many times is the size of width to height. If `aspectRatio` is set in game config
  then this value will always be the same to it.
    * Draw a rect whose width is `x` and height is `x * aspectRatio` will appear as a square in screen. This seems
      incorrect at first, but actually it is because that the width and height are in percentages, so the aspect ratio,
      which is calculated from pixels, need to be inversely used.