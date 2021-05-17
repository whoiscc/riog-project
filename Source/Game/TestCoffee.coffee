# TestCoffee.coffee - The test game, CoffeeScript version

Create = ->
  console.log '[TestCoffee] create game'
  # initial states
  numberEvent: 0
  numberSecond: 0

GetSystemTimeText = (context) ->
  "System time: #{context.system.numberMillisecond.toFixed(3)}ms"

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
  context.Create('text%number-event%0').Text {
    y: 0.04
    text: "Number of events: #{data.numberEvent}"
    textCommon...
  }

  context.Create('stage%%0').Stage {
    eventList: ['keydown']
  }

  null

OnFrame = (context, data) ->
  context.Update 'text%system-time%0',
    text: GetSystemTimeText context

  data

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
