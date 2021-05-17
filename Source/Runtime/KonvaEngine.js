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
  this.system = {
    numberFrame: 0,
    numberMillisecond: 0.0,
    engineNumberFrame: 0,
    engineNumberMillisecond: 0.0,
    // TimeStamp instead of Timestamp is used through out this codebase to following DOMHighResTimeStamp
    currentFrameTimeStamp: null,
    lastFrameTimeStamp: null,
    // FPS reporting calculation use local (engine) statistics
    lastReportFpsNumberFrame: 0,
    lastReportFpsNumberMillisecond: 0.0,
  }

  // context revision-specific state
  // maybe the only place that polymorphism is used
  this.contextState = null
}

// static property
Engine.featureTagList = [
  'engine:konva',
  'context:junkrat',
  'shape:rect',
  'shape:ellipse',
  'shape:line',
  'shape:image',
  'shape:text',
  'event:mouseenter',
  'event:mouseleave',
  'event:mousedown',
  'event:mouseup',
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

    // initialize system statistics
    this.system.numberFrame = config.system.numberFrame
    this.system.numberMillisecond = config.system.numberMillisecond
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
    this.system.lastFrameTimeStamp = performance.now()
    const engine = this
    requestAnimationFrame(function loop (timeStamp) {
      if (!engine.running) {
        console.log('[KonvaEngine] exit rendering loop')
        return
      }
      // either `Redraw` or `OnFrame` will be called below
      // and timeStamp will be present in one of the context
      engine.system.currentFrameTimeStamp = timeStamp
      engine.application.OnGameUpdate()
      engine.layer.draw()

      // post drawing handling
      engine.system.numberFrame += 1
      engine.system.engineNumberFrame += 1
      const interval = timeStamp - engine.system.lastFrameTimeStamp
      engine.system.numberMillisecond += interval
      engine.system.engineNumberMillisecond += interval
      engine.system.lastFrameTimeStamp = timeStamp

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
    const fps = (this.system.engineNumberFrame - this.system.lastReportFpsNumberFrame) /
      ((this.system.engineNumberMillisecond - this.system.lastReportFpsNumberMillisecond) / 1000)
    this.system.lastReportFpsNumberFrame = this.system.engineNumberFrame
    this.system.lastReportFpsNumberMillisecond = this.system.engineNumberMillisecond
    return fps
  }

  // junkrat context implementation
  function GetJunkratInitialContextState (engine) {
    return {
      shapeDict: {},
      stageIdentifier: null,
      eventQueueDict: {},
      eventListDict: {},
      actionDict: CreateJunkratContextActionDict(engine),
    }
  }

  function GetJunkratRedrawContext (engine) {
    return {
      Create: engine.contextState.actionDict.Create,
      system: JunkratContextSystem(engine),
    }
  }

  function GetJunkratOnFrameContext (engine) {
    return {
      Create: engine.contextState.actionDict.Create,
      Update: engine.contextState.actionDict.Update,
      Remove: engine.contextState.actionDict.Remove,
      DequeueEvent: engine.contextState.actionDict.DequeueEvent,
      system: JunkratContextSystem(engine),
    }
  }

  function JunkratOnSessionEvent (engine, eventName, nativeEvent) {
    // assert engine.contextState.stageIdentifier is not null
    let event
    if (eventName === 'keydown') {
      event = nativeEvent.key
    } else {  // default to
      event = true
    }
    engine.contextState.eventQueueDict[`${engine.contextState.stageIdentifier}/${eventName}`].enqueue(event)
  }

  function JunkratPreprocessConfig (engine, config) {
    const goodConfig = {}
    for (let [key, value] of Object.entries(config)) {
      // insert more keys here
      if (['x'].includes(key)) {
        goodConfig[key] = value * engine.width
      } else if (['y', 'fontSize'].includes(key)) {
        goodConfig[key] = value * engine.height
      } else if (['identifier', 'eventList'].includes(key)) {
        // just skip
      } else {
        goodConfig[key] = value
      }
    }
    return goodConfig
  }

  function CreateJunkratContextActionDict (engine) {
    return {
      Create: function (identifier) {
        return {
          Text: function (config) {
            const text = new Konva.Text(JunkratPreprocessConfig(engine, config))
            engine.contextState.shapeDict[identifier] = text
            // todo: eventList
            engine.layer.add(text)
          },
          Stage: function (config) {
            // assert engine.contextState.stageIdentifier == null
            engine.contextState.eventListDict[identifier] = config.eventList || []
            for (let eventName of config.eventList) {
              engine.application.AddSessionListener(eventName)
              engine.contextState.eventQueueDict[`${identifier}/${eventName}`] = new buckets.Queue()
            }
            engine.contextState.stageIdentifier = identifier
          }
        }
      },
      Update: function (identifier, config) {
        // assert not stage
        engine.contextState.shapeDict[identifier].setAttrs(JunkratPreprocessConfig(engine, config))
        if (config.identifier) {
          engine.contextState.shapeDict[config.identifier] = engine.contextState.shapeDict[identifier]
          delete engine.contextState.shapeDict[identifier]
        }
      },
      Remove: function (identifier) {
        if (identifier === engine.contextState.stageIdentifier) {
          engine.application.ClearSessionListener()
          engine.contextState.stageIdentifier = null
        } else {
          engine.contextState.shapeDict[identifier].destroy()
          delete engine.contextState.shapeDict[identifier]
        }

        for (let eventName of engine.contextState.eventListDict[identifier]) {
          delete engine.contextState.eventQueueDict[`${identifier}/${eventName}`]
        }
        delete engine.contextState.eventListDict[identifier]
      },
      DequeueEvent: function (identifier, eventName) {
        // assert the queue exist
        return engine.contextState.eventQueueDict[`${identifier}/${eventName}`].dequeue()
      },
    }
  }

  function JunkratContextSystem (engine) {
    return {
      timeStamp: engine.system.currentFrameTimeStamp,
      numberFrame: engine.system.numberFrame,
      numberMillisecond: engine.system.numberMillisecond,
      engineNumberFrame: engine.system.engineNumberFrame,
      engineNumberMillisecond: engine.system.engineNumberMillisecond,
      width: engine.width,
      height: engine.height,
      aspectRatio: engine.width / engine.height,
    }
  }
})()
