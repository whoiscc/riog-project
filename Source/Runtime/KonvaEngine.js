// KonvaEngine.js - rendering engine based on Konva
//
// Application makes sure that only one Engine running at the same time
// but it may destroy an Engine and create a new one, so clean up global footprint (e.g. DOM element) is important

function Engine (application, contextRevision) {
  // constant
  this.application = application
  this.contextRevision = contextRevision
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
    lastReportFpsMillisecond: 0.0,
  }

  // context revision state
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

    console.log(`[KonvaEngine] use context revision ${config.contextRevision}`)
    if (this.contextRevision === 'junkrat') {
      this.contextState = {
        shapeDict: {},
        eventQueueDict: {},
        actionDict: CreateJunkratContextActionDict(this),
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
      ((this.system.engineNumberMillisecond - this.system.lastReportFpsMillisecond) / 1000)
    this.system.lastReportFpsNumberFrame = this.system.engineNumberFrame
    this.system.lastReportFpsMillisecond = this.system.engineNumberMillisecond
    return fps
  }

  Engine.prototype.GetRedrawContext = function () {
    if (this.contextRevision === 'junkrat') {
      return GetJunkratRedrawContext(this)
    } else {
      // assert unreachable
    }
  }

  Engine.prototype.GetOnFrameContext = function () {
    if (this.contextRevision === 'junkrat') {
      return GetJunkratOnFrameContext(this)
    } else {
      // assert unreachable
    }
  }

  Engine.prototype.OnSessionEvent = function (eventName, event) {
    console.log(eventName, event)
    if (this.contextRevision === 'junkrat') {
      JunkratOnSessionEvent(eventName, event)
    } else {
      // assert unreachable
    }
  }

  // junkrat context implementation
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

  function JunkratOnSessionEvent (eventName, event) {
    //
  }

  function JunkratPreprocessConfig (engine, config, renameConsumer) {
    const goodConfig = {}
    for (let [key, value] of Object.entries(config)) {
      // insert more keys here
      if (['x'].includes(key)) {
        goodConfig[key] = value * engine.width
      } else if (['y', 'fontSize'].includes(key)) {
        goodConfig[key] = value * engine.height
      } else if (key === 'identifier') {
        renameConsumer(value)
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
            // no renaming is allowed in `Create`
            const text = new Konva.Text(JunkratPreprocessConfig(engine, config, null))
            engine.contextState.shapeDict[identifier] = text
            engine.layer.add(text)
          },
          Stage: function (config) {
            // assert no duplicated Create
            for (let eventName of config.eventList) {
              engine.application.AddSessionListener(eventName)
            }
          }
        }
      },
      Update: function (identifier, config) {
        let newIdentifier = null
        engine.contextState.shapeDict[identifier].setAttrs(
          JunkratPreprocessConfig(engine, config, function (identifier) {
            newIdentifier = identifier
          }))
        if (newIdentifier) {
          engine.contextState.shapeDict[newIdentifier] = engine.contextState.shapeDict[identifier]
          delete engine.contextState.shapeDict[identifier]
        }
      },
      Remove: function (identifier) {
        engine.contextState.shapeDict[identifier].destroy()
        delete engine.contextState.shapeDict[identifier]
      },
      DequeueEvent: function (identifier, eventName) {
        // todo
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
