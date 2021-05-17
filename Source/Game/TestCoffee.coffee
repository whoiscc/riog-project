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

Redraw = (context, data) ->
  console.log '[TextCoffee] redraw game'

  textCommon =
    x: 0.0
    fontSize: 0.03
    fontFamily: 'Lato'
    fill: 'black'
  # no elegant way to remove parentheses after Create, what a pity for junkrat revision
  context.Create('text%system-time%0').Text {
    y: 0.0
    text: GetSystemTimeText context
    textCommon...
  }
  context.Create('text%event%0').Text {
    y: 0.04
    text: "Wait for the first event (since last redraw)"
    textCommon...
  }
  context.Create('text%number-event%0').Text {
    y: 0.08
    text: GetNumberEventText data.numberEvent
    textCommon...
  }

  context.Create('stage%%0').Stage {
    eventList: ['keydown']
  }

  null

OnFrame = (context, data) ->
  context.Update 'text%system-time%0',
    text: GetSystemTimeText context

  numberEvent = data.numberEvent
  # process at most one event in one frame
  do ->
    numberEvent += 1
    if key = context.DequeueEvent 'stage%%0', 'keydown'
      context.Update 'text%event%0',
        text: "keydown: key = #{key}"
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
  description: 'A testing game written in CoffeeScript'
  aspectRatio: null
  featureTagList: [
    'shape:text',
    'event:keydown',
  ]
  contextRevision: 'junkrat'
  interface: {
    Create
    Redraw
    OnFrame
  }
