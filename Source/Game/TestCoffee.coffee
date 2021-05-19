# TestCoffee.coffee - The test game, CoffeeScript version

Create = ->
  console.log '[TestCoffee] create game'
  # initial states
  numberEvent: 0
  numberSecond: 0
  loggingEventList: []

GetSystemTimeText = (context) ->
  "System time: #{context.system.numberMillisecond.toFixed(2)}ms"

GetNumberEventText = (numberEvent) ->
  "Number of events: #{numberEvent}"

# adjust movement period with canvas pixel size
# so it will not move too fast/slow on large/small screen
# introduce a 571:431 factor in period ratio so it looks like random moving
GetImageX = (t, w, h) ->
  t1 = t / 1000 / ((w + h) / 571)
  (Math.sin(t1 * (2 * Math.PI)) + 1) / 2

GetImageY = (t, w, h) ->
  t1 = t / 1000 / ((w + h) / 431)
  (Math.sin(t1 * (2 * Math.PI)) + 1) / 2

GetImageRotation = (t) ->
  t / 1023 * (2 * Math.PI)

GetEventDescriptionText = (event) ->
  switch "#{event.target}/#{event.name}"
    when 'stage%%0/keydown' then "Keydown: key = #{event.value}"
    when 'stage%%0/swipe' then "Swipe: direction = #{event.value}"
    when 'image%coffee%0/click', 'image%coffee%0/tap' then "Coffee is clicked/tapped"

textCommon =
  x: 0.0
  fontSize: 0.03
  fontFamily: 'Lato'
  fill: 'black'

$maxNumberDescription = 20

GetEventDescriptionY = (eventIndex, numberEvent) ->
  0.04 * 2 + (numberEvent - eventIndex - 1) * 0.04

GetEventDescriptionColor = (eventIndex, numberEvent) ->
  n = numberEvent - eventIndex
  fadingLevel = n - $maxNumberDescription + 7
  if fadingLevel <= 0 then return 'black'
  gray = 32 * fadingLevel
  "rgb(#{gray}, #{gray}, #{gray})"

Redraw = (context, data) ->
  console.log '[TextCoffee] redraw game'

  # no elegant way to remove parentheses after Create, what a pity for junkrat revision
  context.Create('stage%%0').Stage
    eventList: ['keydown', 'swipe']

  context.Create('text%system-time%0').Text {
    y: 0.0
    text: GetSystemTimeText context
    textCommon...
  }
  context.Create('text%number-event%0').Text {
    y: 0.04
    text: GetNumberEventText data.numberEvent
    textCommon...
  }
  for event in data.loggingEventList
    if event.index < data.numberEvent - $maxNumberDescription then continue
    context.Create("text%event-description%#{event.index}").Text {
      y: GetEventDescriptionY event.index, data.numberEvent
      text: GetEventDescriptionText event
      textCommon...
    }

  context.Create('image%coffee%0').Image
    url: 'Resource/Coffee.svg'
    x: GetImageX context.system.numberMillisecond, context.system.width, context.system.height
    y: GetImageY context.system.numberMillisecond, context.system.width, context.system.height
    rotation: GetImageRotation context.system.numberMillisecond
    width: 0.12 / context.system.aspectRatio
    height: 0.1
    crop:
      width: 120
      height: 100
    eventList: ['click', 'tap']

  null

OnFrame = (context, data) ->
  context.Update 'text%system-time%0',
    text: GetSystemTimeText context

  context.Update 'image%coffee%0',
    x: GetImageX context.system.numberMillisecond, context.system.width, context.system.height
    y: GetImageY context.system.numberMillisecond, context.system.width, context.system.height
    rotation: GetImageRotation context.system.numberMillisecond


  numberEvent = data.numberEvent
  eventList = []
  for [target, name] in [
    ['stage%%0', 'keydown'],
    ['stage%%0', 'swipe'],
    ['image%coffee%0', 'click'],
    ['image%coffee%0', 'tap'],
  ]
    while value = context.DequeueEvent target, name
      eventList.push { index: numberEvent, target, name, value }
      numberEvent += 1

  if numberEvent != data.numberEvent
    context.Update "text%number-event%0",
      text: GetNumberEventText numberEvent

  loggingEventList = data.loggingEventList
  for event in eventList
    context.Create("text%event-description%#{event.index}").Text {
      y: GetEventDescriptionY event.index, numberEvent
      text: GetEventDescriptionText event
      textCommon...
    }
    loggingEventList.push event
  loggingEventList = loggingEventList.filter((event) ->
    if event.index < numberEvent - $maxNumberDescription
      context.Remove "text%event-description%#{event.index}"
      return false
    context.Update "text%event-description%#{event.index}",
      y: GetEventDescriptionY event.index, numberEvent
      fill: GetEventDescriptionColor event.index, numberEvent
    true
  )

  # updated states
  numberEvent: numberEvent
  numberSecond: data.numberSecond
  loggingEventList: loggingEventList

application.RegisterGame
  name: 'Test Coffee'
  description: 'A testing game written in CoffeeScript.'
  aspectRatio: null
  featureTagList: [
    'shape:text',
    'shape:image'
    'event:keydown',
    'event:click',
    'event:swipe',
    'event:tap',
  ]
  contextRevision: 'junkrat'
  interface: {
    Create
    Redraw
    OnFrame
  }
