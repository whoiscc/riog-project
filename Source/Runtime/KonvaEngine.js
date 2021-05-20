// KonvaEngine.js - rendering engine based on Konva
//
// Application makes sure that only one Engine running at the same time
// but it may destroy an Engine and create a new one, so clean up global footprint (e.g. DOM element) is important

function Engine (application) {
  // constant
  this.application = application
  // almost constant that only assign once in Setup
  this.layer = null
  this.width = null
  this.height = null

  // other context-revision-independent states
  this.running = false
  this.numberFrame = 0
  this.numberMillisecond = 0.0
  this.engineNumberFrame = 0
  this.engineNumberMillisecond = 0.0
  // TimeStamp instead of Timestamp is used through out this codebase to following DOMHighResTimeStamp
  this.currentFrameTimeStamp = null
  this.lastFrameTimeStamp = null
  // FPS reporting calculation use local (engine) statistics
  this.lastReportFpsNumberFrame = 0
  this.lastReportFpsNumberMillisecond = 0.0

  // context revision-specific state
  // maybe the only place that polymorphism is used
  this.contextState = null
}

// static property
Engine.featureTagList = [
  'engine:konva',
  'context:junkrat',
  'shape:rect',
  'shape:image',
  'shape:text',
  'event:click',
  'event:tap',
  'event:timer',
];

(function () {
  Engine.prototype.SetUp = function (config) {
    // assert no duplicated Setup
    const container = document.createElement('div')
    container.id = 'konva-container'
    container.style.position = 'fixed'
    // 1.7em because currently banner is about 1.6em (1em font size with 0.3em padding)
    // and set it to 1.6em causes some overlap
    container.style.top = '1.7em'  // fixme
    container.style.left = '0'
    container.style.right = '0'
    container.style.bottom = '0'
    document.body.append(container)
    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight
    if (config.aspectRatio) {
      // solution 1: (w, containerHeight)
      const w = containerHeight * config.aspectRatio
      // solution 2: (containerWidth, h)
      const h = containerWidth / config.aspectRatio
      // choose the one fits into screen
      if (w > containerWidth) {
        this.width = containerWidth
        this.height = Math.floor(h)
      } else {
        this.width = Math.floor(w)
        this.height = containerHeight
      }
    } else {
      this.width = containerWidth
      this.height = containerHeight
    }
    container.style.marginLeft = ((containerWidth - this.width) / 2) + 'px'

    console.log(`[KonvaEngine] create stage, width = ${this.width}, height = ${this.height}`)
    const stage = new Konva.Stage({
      container: 'konva-container',
      width: this.width,
      height: this.height,
    })
    this.layer = new Konva.Layer()
    stage.add(this.layer)

    // this part can go into constructor, but it will be hard to make use of private functions
    console.log(`[KonvaEngine] use context revision ${config.contextRevision}`)
    if (config.contextRevision === 'junkrat') {
      this.contextState = GetJunkratInitialContextState(this)
      this.PreGameUpdate = function () {
        JunkratPreGameUpdate(this)
      }
      this.GetRedrawContext = function () {
        return GetJunkratRedrawContext(this)
      }
      this.GetOnFrameContext = function () {
        return GetJunkratOnFrameContext(this)
      }
      this.OnSessionEvent = function (eventName, nativeEvent) {
        JunkratOnSessionEvent(this, eventName, nativeEvent)
      }
    } else {
      // assert unreachable
    }

    console.log(
      '[KonvaEngine] start with system stat: ' +
      `frame #${config.system.numberFrame}, ${config.system.numberMillisecond}ms`
    )
    this.numberFrame = config.system.numberFrame
    this.numberMillisecond = config.system.numberMillisecond
  }

  Engine.prototype.CleanUp = function () {
    console.log(`[KonvaEngine] clean up`)
    document.querySelector('#konva-container').remove()
    this.layer = null  // for safe
  }

  Engine.prototype.Start = function () {
    console.log('[KonvaEngine] start rendering loop')
    this.running = true
    // 1. make sure lastFrameTimeStamp always has value
    // 2. skip paused interval
    this.lastFrameTimeStamp = performance.now()
    const engine = this
    requestAnimationFrame(function loop (timeStamp) {
      if (!engine.running) {
        console.log('[KonvaEngine] exit rendering loop')
        return
      }
      // either `Redraw` or `OnFrame` will be called below
      // and timeStamp will be present in one of the context
      engine.currentFrameTimeStamp = timeStamp
      engine.PreGameUpdate && engine.PreGameUpdate()
      engine.application.OnGameUpdate()
      engine.layer.draw()

      // post drawing handling
      engine.numberFrame += 1
      engine.engineNumberFrame += 1
      const interval = timeStamp - engine.lastFrameTimeStamp
      engine.numberMillisecond += interval
      engine.engineNumberMillisecond += interval
      engine.lastFrameTimeStamp = timeStamp

      // schedule for next frame
      const debugThrottleTimeout = engine.application.debug.GetThrottleTimeout()
      if (!debugThrottleTimeout) {
        requestAnimationFrame(loop)
      } else {
        setTimeout(function () {
          requestAnimationFrame(loop)
        }, debugThrottleTimeout)
      }
    })
  }

  Engine.prototype.Stop = function () {
    this.running = false
  }

  Engine.prototype.ReportFps = function () {
    const fps = (this.engineNumberFrame - this.lastReportFpsNumberFrame) /
      ((this.engineNumberMillisecond - this.lastReportFpsNumberMillisecond) / 1000)
    this.lastReportFpsNumberFrame = this.engineNumberFrame
    this.lastReportFpsNumberMillisecond = this.engineNumberMillisecond
    return fps
  }

  // junkrat context implementation
  function GetJunkratInitialContextState (engine) {
    return {
      shapeDict: {},
      stageIdentifier: null,
      eventQueueDict: {},
      eventListDict: {},
      timerQueue: new buckets.PriorityQueue(function (t1, t2) {
        if (t1.fireNumberMillisecond < t2.fireNumberMillisecond) {
          return 1
        } else if (t1.fireNumberMillisecond > t2.fireNumberMillisecond) {
          return -1
        }
        return 0
      }),
      Create: JunkratContextCreate(engine),
      Update: JunkratContextUpdate(engine),
      Remove: JunkratContextRemove(engine),
      DequeueEvent: JunkratContextDequeueEvent(engine),
    }
  }

  function GetJunkratRedrawContext (engine) {
    return {
      Create: engine.contextState.Create,
      system: JunkratContextSystem(engine),
    }
  }

  function GetJunkratOnFrameContext (engine) {
    return {
      Create: engine.contextState.Create,
      Update: engine.contextState.Update,
      Remove: engine.contextState.Remove,
      DequeueEvent: engine.contextState.DequeueEvent,
      system: JunkratContextSystem(engine),
    }
  }

  function JunkratOnSessionEvent (engine, eventName, nativeEvent) {
    // assert engine.contextState.stageIdentifier is not null
    engine.contextState.eventQueueDict[`${engine.contextState.stageIdentifier}/${eventName}`]
      .enqueue(JunkratPreprocessEvent(eventName, nativeEvent))
  }

  function JunkratPreGameUpdate (engine) {
    const companion = engine.contextState.timerQueue.peek()
    if (!companion) {
      return
    }
    if (companion.fireNumberMillisecond > engine.engineNumberMillisecond) {
      return
    }
    engine.contextState.timerQueue.dequeue()
    if (companion.cancelled) {
      return
    }

    const timer = engine.contextState.shapeDict[companion.identifier]
    engine.contextState.eventQueueDict[`${companion.identifier}/fire`].enqueue(timer.count)
    timer.count += 1
    timer.queueCompanion = {
      identifier: companion.identifier,
      cancelled: false,
      fireNumberMillisecond: engine.engineNumberMillisecond + timer.interval,
    }
    engine.contextState.timerQueue.enqueue(timer.queueCompanion)
  }

  function JunkratPreprocessEvent (eventName, nativeEvent) {
    if (eventName === 'keydown') {
      return nativeEvent.key
    }
    if (eventName === 'swipe') {
      const directionDict = {
        [Hammer.DIRECTION_LEFT]: 'left',
        [Hammer.DIRECTION_RIGHT]: 'right',
        [Hammer.DIRECTION_UP]: 'up',
        [Hammer.DIRECTION_DOWN]: 'down',
      }
      return directionDict[nativeEvent.direction]
    }
    return true  // default non-value event
  }

  function JunkratPreprocessConfig (engine, config) {
    const goodConfig = {}
    for (let [key, value] of Object.entries(config)) {
      // insert more keys here
      if (['x', 'width'].includes(key)) {
        goodConfig[key] = value * engine.width
      } else if (['y', 'fontSize', 'height'].includes(key)) {
        goodConfig[key] = value * engine.height
      } else if (['rotation'].includes(key)) {
        goodConfig[key] = value / (2 * Math.PI) * 360
      } else if ([].includes(key)) {  // crop is not processed
        goodConfig[key] = JunkratPreprocessConfig(engine, config[key])
      } else if (['identifier', 'eventList'].includes(key)) {
        // just skip
      } else {
        goodConfig[key] = value
      }
    }
    return goodConfig
  }

  function JunkratContextCreate (engine) {
    return function (identifier) {
      function GetCreateMethod (provideShape, registerEventName, addEntity, afterCheck = false) {
        return function (config) {
          // fixme: is this 'loading' label strategy too naive for general async Create?
          engine.contextState.shapeDict[identifier] = 'loading'
          provideShape(config, function (shape) {
            // shape is removed before it is loaded
            if (afterCheck && !engine.contextState.shapeDict[identifier]) {
              shape.destroy()
              return
            }
            shape && shape.setAttrs && shape.setAttrs(JunkratPreprocessConfig(engine, config))
            const eventList = config.eventList || []
            for (let eventName of eventList) {
              registerEventName(shape, eventName)
              engine.contextState.eventQueueDict[`${identifier}/${eventName}`] = new buckets.Queue()
            }
            engine.contextState.eventListDict[identifier] = eventList
            addEntity(shape)
          })
        }
      }

      function ProvideKonvaShape (ShapeKind) {
        return function (_config, consumer) {
          consumer(new ShapeKind())
        }
      }

      function ProvidePlaceholder (_config, consumer) {
        consumer(null)
      }

      function ProvideTimer (config, Consumer) {
        Consumer({
          type: 'timer',
          interval: config.interval,
          count: 0,
          queueCompanion: {  // only is not null when not paused
            identifier,
            cancelled: false,
            fireNumberMillisecond: engine.engineNumberMillisecond + config.interval,
          },
          remain: null,  // only is not null when paused
        })
      }

      function ProvideImage (config, consumer) {
        Konva.Image.fromURL(config.url, consumer)
      }

      function ListenShapeEvent (shape, eventName) {
        shape.on(eventName, function (event) {
          engine.contextState.eventQueueDict[`${identifier}/${eventName}`]
            .enqueue(JunkratPreprocessEvent(eventName, event))
        })
      }

      function ListenStageEvent (_stage, eventName) {
        engine.application.AddSessionListener(eventName)
      }

      function RejectListenEvent () {
        throw new Error('not applicable to event')
      }

      function AddShape (shape) {
        engine.contextState.shapeDict[identifier] = shape
        engine.layer.add(shape)
      }

      function AddStage (_stage) {
        engine.contextState.stageIdentifier = identifier
        delete engine.contextState.shapeDict[identifier]  // remove 'loading' label
      }

      function AddTimer (timer) {
        engine.contextState.shapeDict[identifier] = timer
        engine.contextState.timerQueue.enqueue(timer.queueCompanion)
        // fixme
        engine.contextState.eventQueueDict[`${identifier}/fire`] = new buckets.Queue()
        engine.contextState.eventListDict[identifier] = ['fire']
      }

      // CPS, yyds
      return {
        Stage: GetCreateMethod(ProvidePlaceholder, ListenStageEvent, AddStage),
        Image: GetCreateMethod(ProvideImage, ListenShapeEvent, AddShape, true),
        Text: GetCreateMethod(ProvideKonvaShape(Konva.Text), ListenShapeEvent, AddShape),
        Rect: GetCreateMethod(ProvideKonvaShape(Konva.Rect), ListenShapeEvent, AddShape),
        Timer: GetCreateMethod(ProvideTimer, RejectListenEvent, AddTimer),
      }
    }
  }

  function JunkratContextUpdate (engine) {
    return function (identifier, config) {
      // assert not stage
      if (engine.contextState.shapeDict[identifier] === 'loading') {
        return
      }

      if (engine.contextState.shapeDict[identifier].type === 'timer') {
        const timer = engine.contextState.shapeDict[identifier]
        if (config.pause !== undefined) {
          if (config.pause && timer.queueCompanion) {
            // pause the timer
            timer.remain = timer.queueCompanion.fireNumberMillisecond - engine.engineNumberMillisecond
            timer.queueCompanion.cancelled = true
            timer.queueCompanion = null
          }
          if (!config.pause && timer.remain) {
            // resume the timer
            timer.queueCompanion = {
              identifier,
              cancelled: false,
              fireNumberMillisecond: engine.engineNumberMillisecond + timer.remain,
            }
            timer.remain = null
            engine.contextState.timerQueue.enqueue(timer.queueCompanion)
          }
        }
      } else {
        // plain Konva shape object
        engine.contextState.shapeDict[identifier].setAttrs(JunkratPreprocessConfig(engine, config))
      }

      if (config.identifier) {
        engine.contextState.shapeDict[config.identifier] = engine.contextState.shapeDict[identifier]
        delete engine.contextState.shapeDict[identifier]
      }
    }
  }

  function JunkratContextRemove (engine) {
    return function (identifier) {
      const entity = engine.contextState.shapeDict[identifier]
      delete engine.contextState.shapeDict[identifier]
      if (identifier === engine.contextState.stageIdentifier) {
        engine.application.ClearSessionListener()
        engine.contextState.stageIdentifier = null
      } else if (entity === 'loading') {
        return  // skip event listener handling
      } else if (entity.type === 'timer') {
        entity.queueCompanion && (entity.queueCompanion.cancelled = true)
      } else {  // plain Konva shape object
        entity.destroy()
      }

      for (let eventName of engine.contextState.eventListDict[identifier]) {
        delete engine.contextState.eventQueueDict[`${identifier}/${eventName}`]
      }
      delete engine.contextState.eventListDict[identifier]
    }
  }

  function JunkratContextDequeueEvent (engine) {
    return function (identifier, eventName) {
      if (engine.contextState.shapeDict[identifier] === 'loading') {
        return
      }
      if (eventName === 'remain') {
        const timer = engine.contextState.shapeDict[identifier]
        // assert timer.type === 'timer'
        return timer.remain ? timer.remain : timer.queueCompanion.fireNumberMillisecond - engine.engineNumberMillisecond
      }
      // assert the queue exist
      return engine.contextState.eventQueueDict[`${identifier}/${eventName}`].dequeue()
    }
  }

  function JunkratContextSystem (engine) {
    return {
      timeStamp: engine.currentFrameTimeStamp,
      numberFrame: engine.numberFrame,
      numberMillisecond: engine.numberMillisecond,
      engineNumberFrame: engine.engineNumberFrame,
      engineNumberMillisecond: engine.engineNumberMillisecond,
      width: engine.width,
      height: engine.height,
      aspectRatio: engine.width / engine.height,
    }
  }
})()
