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

# 2000ms period back and forth, 1111ms period rotation
# make them not match for more combination
GetImageX = (t) ->
  t1 = t / 2000 * (2 * Math.PI)
  (Math.sin(t1) + 1) / 2

GetImageRotation = (t) ->
  t / 1111 * (2 * Math.PI)

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

  context.Create('image%coffee%0').Image
    url: 'Resource/Coffee.svg'
    x: GetImageX context.system.numberMillisecond
    y: 0.24
    rotation: GetImageRotation context.system.numberMillisecond
    width: 0.12 / context.system.aspectRatio
    height: 0.1
    crop:
      width: 120
      height: 100

  null

$UpdateEventDescriptionText = (context, text) ->
  context.Update 'text%event-description%0', { text }

OnFrame = (context, data) ->
  context.Update 'text%system-time%0',
    text: GetSystemTimeText context

  context.Update 'image%coffee%0',
    x: GetImageX context.system.numberMillisecond
    rotation: GetImageRotation context.system.numberMillisecond

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
    'shape:image'
    'event:keydown',
    'event:click',
  ]
  contextRevision: 'junkrat'
  interface: {
    Create
    Redraw
    OnFrame
  }
