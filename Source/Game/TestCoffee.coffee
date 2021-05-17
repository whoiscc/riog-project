# TestCoffee.coffee - The test game, CoffeeScript version

Create = ->
  console.log '[TestCoffee] create game'
  # initial states
  numberEvent: 0
  numberSecond: 0

GetSystemTimeText = (context) ->
  "System time: #{context.system.numberMillisecond.toFixed(2)}ms"

GetNumberEventText = (numberEvent) ->
  "Number of events: #{numberEvent}"

GetSquareX = (t) ->
  t1 = t % 2000
  (Math.min t1, 2000 - t1) / 1000

GetSquareRotation = (t) ->
  t % 360

Redraw = (context, data) ->
  console.log '[TextCoffee] redraw game'

  context.Create('stage%%0').Stage {
    eventList: ['keydown']
  }

  textCommon =
    x: 0.0
    fontSize: 0.03
    fontFamily: 'Lato'
    fill: 'black'
  # no elegant way to remove parentheses after Create, what a pity for junkrat revision
  context.Create('text%system-time%0').Text {
    y: 0.0
    text: GetSystemTimeText context
    eventList: ['click']
    textCommon...
  }
  context.Create('text%event-description%0').Text {
    y: 0.04
    text: "Wait for the first event (since last redraw)"
    textCommon...
  }
  context.Create('text%number-event%0').Text {
    y: 0.08
    text: GetNumberEventText data.numberEvent
    textCommon...
  }

  context.Create('rect%%0').Rect
    x: GetSquareX context.system.numberMillisecond
    y: 0.24
    rotation: GetSquareRotation context.system.numberMillisecond
    width: 0.05
    height: 0.05 * context.system.aspectRatio
    fill: 'lightblue'

  null

$UpdateEventDescriptionText = (context, text) ->
  context.Update 'text%event-description%0', { text }

OnFrame = (context, data) ->
  context.Update 'text%system-time%0',
    text: GetSystemTimeText context

  context.Update 'rect%%0',
    x: GetSquareX context.system.numberMillisecond
    rotation: GetSquareRotation context.system.numberMillisecond

  numberEvent = data.numberEvent
  # process at most one event in one frame
  do ->
    numberEvent += 1
    if key = context.DequeueEvent 'stage%%0', 'keydown'
      $UpdateEventDescriptionText context, "keydown: key = #{key}"
      return
    if context.DequeueEvent 'text%system-time%0', 'click'
      $UpdateEventDescriptionText context, 'system time is clicked'
      return
    # default
    numberEvent -= 1

  if numberEvent != data.numberEvent
    context.Update 'text%number-event%0',
      text: GetNumberEventText numberEvent

  # updated states
  numberEvent: numberEvent
  numberSecond: data.numberSecond

application.RegisterGame
  name: 'Test Coffee'
  description: 'A testing game written in CoffeeScript.'
  aspectRatio: null
  featureTagList: [
    'shape:text',
    'event:keydown',
    'event:click',
  ]
  contextRevision: 'junkrat'
  interface: {
    Create
    Redraw
    OnFrame
  }
