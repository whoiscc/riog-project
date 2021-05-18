// Application.js - meeting point of games, user interactive, engine, and everything
//
// The one and only instance of Application is created here
// About terminology: *game* means static information & implementation, similar to program file on disk
// *session* means a running game instance state + backend engine state, similar to process in memory
// To keep implementation (of application) minimal, it only support one session
// The session could be paused explicitly by user or implicitly by some events (e.g. window size change)
// If user switch to another game in the menu, the session will be reset, previous game state will be lost

const application = (function CreateApplication () {
  // different aspects of the Application
  const menuApplicationDelegate = {
    ForEachGame,
    PauseGame,
  }
  const engineApplicationDelegate = {
    OnGameUpdate,
    AddSessionListener,
    ClearSessionListener,
    debug: {
      GetThrottleTimeout: DebugGetThrottleTimeout,
    }
  }
  const publicApplicationDelegate = {
    RegisterGame,
    OnReady,
    debug: {
      SetThrottle: DebugSetThrottle,
    }
  }

  // constant states that set only once and do not change during the rest of application lifetime
  const gameList = []
  const menu = new Menu()
  const hammer = new Hammer(document.body)
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
  const debug = {
    throttleTimeout: null,
  }
  const applicationFeatureTagList = [
    'event:timer',
    'event:keydown',
    'event:swipe',
  ]

  // session states, reset on every new session
  const session = {
    game: null,
    data: null,
    engine: null,
    eventListenerDict: {},
    // only update on engine replacing
    numberMillisecond: 0.0,
    numberFrame: 0,
  }

  // application states, permanent cross sessions
  let replaceEngineBeforeResume = false
  let redrawOnUpdate = false
  let isShowingMenu = false
  let fpsInterval = null
  let welcomePage = true  // although welcomePage <=> !session.game all the time, still feels better

  // ...and states declaration end

  function RegisterGame (game) {
    gameList.push(game)
  }

  // things to do on pause/unpause
  // 1. toggle menu modal
  // 2. set/clear FPS updating interval
  // 3. toggle game engine
  function BringGameToFront () {
    // assert isShowingMenu
    isShowingMenu = false
    // 1
    menu.HideModal()
    // 2
    fpsInterval = setInterval(function () {
      // assert session.engine is not null
      menu.SetFps(session.engine.ReportFps())
    }, 1000)
    // 3
    session.engine.Start()
  }

  function BringMenuToFront () {
    // assert not isShowingMenu
    isShowingMenu = true
    // 1
    menu.UpdateGameList(menuApplicationDelegate)
    menu.ShowModal()
    // 2
    clearInterval(fpsInterval)
    fpsInterval = null
    // 3
    session.engine.Stop()
  }

  function CleanUpEngine () {
    // assert session.engine is not null
    ClearSessionListener()
    session.engine.Stop()
    session.engine.CleanUp()
    session.numberFrame = session.engine.numberFrame
    session.numberMillisecond = session.engine.numberMillisecond
    session.engine = null
    menu.SetFps('-')
  }

  function SetUpEngine () {
    // assert session.engine is null
    session.engine = new Engine(engineApplicationDelegate, session.game.contextRevision)
    session.engine.SetUp({
      aspectRatio: session.game.aspectRatio,
      contextRevision: session.game.contextRevision,
      system: {
        numberFrame: session.numberFrame,
        numberMillisecond: session.numberMillisecond,
      },
    })
    redrawOnUpdate = true
  }

  function PauseGame () {
    if (isShowingMenu) {
      return
    }
    console.log('[App] pause the game')
    BringMenuToFront()
  }

  function ResumeGame () {
    console.log('[App] resume the game')
    const timeStamp = performance.now()
    session.lastFrame = timeStamp
    session.lastUpdateFps = timeStamp
    session.numberFrameSinceLastUpdateFps = 0

    if (replaceEngineBeforeResume) {
      replaceEngineBeforeResume = false
      CleanUpEngine()
      SetUpEngine()
    }
    BringGameToFront()
  }

  function StartGame (game) {
    console.log(`[App] start game ${game.name}`)
    if (replaceEngineBeforeResume && !welcomePage) {
      replaceEngineBeforeResume = false
      CleanUpEngine()
    }
    // set up session first because Engine requires a valid session upon setting up
    session.game = game
    welcomePage = false
    session.numberMillisecond = 0.0
    session.numberFrame = 0
    session.data = game.interface.Create()
    SetUpEngine()
    BringGameToFront()
  }

  function ForEachGame (consumer) {
    function CreateOnSelect (game) {
      return function () {
        console.log(`[App] game ${game.name} is selected`)
        menu.SetGameName(game.name)
        if (session.game === game) {
          ResumeGame()
        } else {
          if (!welcomePage) {
            replaceEngineBeforeResume = true
          }
          StartGame(game)
        }
      }
    }

    function RejectSelected () {
      throw new Error('Game is not selectable')
    }

    for (let game of gameList) {
      // need ES7 for `includes` method
      const supported = game.featureTagList.every(function (tag) {
        return Engine.featureTagList.includes(tag) || applicationFeatureTagList.includes(tag)
      }) && Engine.featureTagList.includes(`context:${game.contextRevision}`)
      consumer({
        name: game.name,
        description: game.description,
        Select: supported ? CreateOnSelect(game) : RejectSelected,
        running: session.game === game,
        supported,
      })
    }
  }

  function DebugSetThrottle (maxFps) {
    debug.throttleTimeout = 1000.0 / maxFps
  }

  function DebugGetThrottleTimeout () {
    return debug.throttleTimeout
  }

  const hammerEventList = ['swipe']

  function AddSessionListener (eventName) {
    // assert eventName not in session.eventListenerDict
    function OnEvent (event) {
      // assert session.engine is not null
      event.preventDefault()
      session.engine.OnSessionEvent(eventName, event)
    }

    if (hammerEventList.includes(eventName)) {
      hammer.on(eventName, OnEvent)
    } else {
      document.addEventListener(eventName, OnEvent)
    }
    session.eventListenerDict[eventName] = OnEvent
  }

  function ClearSessionListener () {
    console.log('[App] clear session listener')
    for (let [eventName, listener] of Object.entries(session.eventListenerDict)) {
      if (hammerEventList.includes(eventName)) {
        hammer.off(eventName, listener)
      } else {
        // why it does not complain to addEventListener?
        // noinspection JSCheckFunctionSignatures
        document.removeEventListener(eventName, listener)
      }
    }
    session.eventListenerDict = {}
  }

  function OnReady () {
    console.log('[App] on ready')
    menu.CreateElement(menuApplicationDelegate)
    menu.AttachElement()
    document.querySelector('#loading-text').remove()
    // hold back a little to enable animation
    setTimeout(function () {
      menu.ShowModal()
    }, 100)
    isShowingMenu = true  // the only one manually toggle

    window.addEventListener('resize', function () {
      replaceEngineBeforeResume = true
      PauseGame()
    })
    window.addEventListener('visibilitychange', PauseGame)
  }

  function OnGameUpdate () {
    if (redrawOnUpdate) {
      redrawOnUpdate = false
      const redrawContext = session.engine.GetRedrawContext()
      session.game.interface.Redraw(redrawContext, session.data)
    } else {
      const onFrameContext = session.engine.GetOnFrameContext()
      session.data = session.game.interface.OnFrame(onFrameContext, session.data)
    }
  }

  return publicApplicationDelegate
})()
