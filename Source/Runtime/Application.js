// Application.js - meeting point of games, user interactive, engine, and everything
//
// The one and only instance of Application is created here
// About terminology: *game* means static information & implementation, similar to program file on disk
// *session* means a running game instance state + backend engine state, similar to process in memory
// To keep implementation (of application) minimal, it only support one session
// The session could be paused explicitly by user or implicitly by some events (e.g. window size change)
// If user switch to another game in the menu, the session will be reset, previous game state will be lost
//
// todo: for app and engine
// find a proper way to merge runtime-provided and engine-provided features into one context

const application = (function () {
  // different aspects of the Application
  const menuApplicationDelegate = {
    ForEachGame,
    PauseGame,
  }
  const engineApplicationDelegate = {
    OnGameUpdate,
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

  // constant states that do not change during the whole application lifetime
  const gameList = []
  const menu = new Menu()
  const engineFeatureTagList = Engine.featureTagList
  const debug = {
    throttleTimeout: null,
  }

  // session states, reset on every new session
  const session = {
    game: null,
    data: null,
    engine: null,
    // only update on engine replacing
    numberMillisecond: 0.0,
    numberFrame: 0,
  }

  // application states, permanent cross sessions
  let replaceEngineBeforeResume = false
  let redrawOnUpdate = false
  let isShowingMenu = false
  let fpsInterval = null

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
    session.engine.Start(engineApplicationDelegate)
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
    session.engine.Stop()
    session.engine.CleanUp()
    session.numberFrame = session.engine.system.numberFrame
    session.numberMillisecond = session.engine.system.numberMillisecond
    session.engine = null
    menu.SetFps('-')
  }

  function SetUpEngine () {
    // assert session.engine is null
    session.engine = new Engine()
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
  }

  function StartGame (game) {
    console.log(`[App] start game ${game.name}`)
    if (replaceEngineBeforeResume) {
      replaceEngineBeforeResume = false
      CleanUpEngine()
    }
    // set up session first because Engine requires a valid session upon setting up
    session.game = game
    session.numberMillisecond = 0.0
    session.numberFrame = 0
    session.data = game.interface.Create()
    SetUpEngine()
  }

  function ForEachGame (consumer) {
    function CreateOnSelect (game) {
      return function () {
        console.log(`[App] game ${game.name} is selected`)
        menu.SetGameName(game.name)
        if (session.game === game) {
          ResumeGame()
        } else {
          if (session.game) {
            replaceEngineBeforeResume = true
          }
          StartGame(game)
        }
        BringGameToFront()
      }
    }

    function RejectSelected () {
      throw new Error('Game is not selectable')
    }

    for (let game of gameList) {
      const running = session.game === game
      // need ES7 for `includes` method
      const supported = game.featureTagList.every(function (tag) {
        return engineFeatureTagList.includes(tag)
      }) && engineFeatureTagList.includes(`context:${game.contextRevision}`)
      consumer({
        name: game.name,
        description: game.description,
        Select: supported ? CreateOnSelect(game) : RejectSelected,
        running,
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

  function OnReady () {
    console.log('[App] on ready')
    menu.CreateElement(menuApplicationDelegate)
    menu.AttachElement()
    document.querySelector('#loading-text').remove()
    // hold back a little to enable animation
    setTimeout(function () {
      menu.ShowModal()
    }, 100)
    isShowingMenu = true  // the only one manually pause

    window.addEventListener('resize', function () {
      replaceEngineBeforeResume = true
      PauseGame()
    })
    window.addEventListener('blur', PauseGame)
  }

  function PauseGame () {
    if (isShowingMenu) {
      return
    }
    console.log('[App] pause the game')
    BringMenuToFront()
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
