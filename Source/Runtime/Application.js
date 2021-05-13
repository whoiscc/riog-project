// Application.js - meeting point of games, user interactive, engine, and everything
//
// The one and only instance of Application is created and the end of this file
// About terminology: *game* means static information & implementation, similar to program file on disk
// *session* means a running game instance state + backend engine state, similar to process in memory
// To keep implementation (of application) minimal, it only support one session
// The session could be paused explicitly by user or implicitly by some events (e.g. window size change)
// If user switch to another game in the menu, the session will be reset, previous game state will be lost

function createApplication() {
    let application;  // forward declaration of `this`

    // constant states that do not change during the whole application lifetime
    const gameList = [];
    const menu = new Menu();
    const debug = {
        throttleTimeout: null,
    };

    // session states, reset on every new session
    const session = {
        game: null,
        data: null,
        engine: null,
        lastFrame: 0.0,
        lastUpdateFps: 0.0,
        numberMillisecond: 0.0,
        numberFrame: 0,
        numberFrameSinceLastUpdateFps: 0,
    };

    // application states, permanent cross sessions
    let paused = true;
    let replaceEngineBeforeResume = false;

    // states declaration end

    function RegisterGame(game) {
        gameList.push(game);
    }

    function ResumeGame() {
        console.log('[App] resume the game');
        session.lastFrame = performance.now();
        session.lastUpdateFps = performance.now();
        session.numberFrameSinceLastUpdateFps = 0;

        const hasPreFrame = replaceEngineBeforeResume;
        if (replaceEngineBeforeResume) {
            session.engine.CleanUp();
            session.engine = new Engine();
            session.engine.SetUp({
                aspectRatio: session.game.aspectRatio,
            });
            // todo: somehow create a redraw context for session game
            const redrawContext = null;
            session.game.interface.Redraw(redrawContext, session.data);
            replaceEngineBeforeResume = false;
        }
        session.engine.Start(application, hasPreFrame);
    }

    function StartGame(game) {
        console.log('[App] start game');
        if (replaceEngineBeforeResume) {
            session.engine.CleanUp();
            replaceEngineBeforeResume = false;
        }
        session.game = game;
        session.data = game.interface.Create();
        session.engine = new Engine();
        session.engine.SetUp({
            aspectRatio: session.game.aspectRatio,
        });
        session.lastFrame = performance.now();
        session.lastUpdateFps = performance.now();
        session.numberMillisecond = 0.0;
        session.numberFrame = 0;
        session.numberFrameSinceLastUpdateFps = 0;

        // todo: somehow create a redraw context for session game
        const redrawContext = null;
        session.game.interface.Redraw(redrawContext, session.data);
        session.engine.Start(application, true);
    }

    function ForEachGame(consumer) {
        function CreateOnSelect(game) {
            return function () {
                console.log(`[App] game "${game.name}" is selected`);
                paused = false;
                menu.SetGameName(game.name);
                if (session.game === game) {
                    ResumeGame();
                } else {
                    if (session.game) {
                        replaceEngineBeforeResume = true;
                    }
                    StartGame(game);
                }
                setTimeout(function () {
                    menu.HideModal();
                }, 0);
            };
        }

        for (let game of gameList) {
            consumer({
                name: game.name,
                description: game.description,
                Select: CreateOnSelect(game),
                running: session.game === game,
            })
        }
    }

    function IsPaused() {
        return paused;
    }

    function DebugSetThrottle(maxFps) {
        debug.throttleTimeout = 1000.0 / maxFps;
    }

    function GetDebugThrottleTimeout() {
        return debug.throttleTimeout;
    }

    function OnReady() {
        console.log('[App] on ready');
        menu.CreateElement(application);
        menu.AttachElement();
        setTimeout(function () {
            menu.ShowModal();
            document.querySelector('#loading-text').remove();
        }, 0);

        window.addEventListener('resize', function () {
            if (!paused) {
                OnPause();
            }
            replaceEngineBeforeResume = true;
        });
        window.addEventListener('blur', function () {
            if (!paused) {
                OnPause();
            }
        });
    }

    function OnPause() {
        console.log('[App] game is paused');
        paused = true;
        menu.UpdateGameList(application);
        setTimeout(function () {
            menu.ShowModal();
        }, 0);
    }

    function OnGameUpdate(timeStamp) {
        // todo: somehow create a on-frame context
        const onFrameContext = null;
        session.data = session.game.interface.OnFrame(onFrameContext, session.data);
    }

    function AfterFrame(timeStamp) {
        session.numberFrame += 1;
        session.numberFrameSinceLastUpdateFps += 1;
        session.numberMillisecond += timeStamp - session.lastFrame;
        session.lastFrame = timeStamp;
        if (session.lastFrame - session.lastUpdateFps >= 1000.0) {
            menu.SetFps(session.numberFrameSinceLastUpdateFps);
            session.lastUpdateFps = session.lastFrame;
            session.numberFrameSinceLastUpdateFps = 0;
        }
    }

    // noinspection JSUnusedGlobalSymbols
    const debugInterfaces = {
        SetThrottle: DebugSetThrottle,
        GetThrottleTimeout: GetDebugThrottleTimeout,
    };

    application = {
        RegisterGame,
        ForEachGame,
        IsPaused,
        OnReady,
        OnPause,
        OnGameUpdate,
        AfterFrame,
        debug: debugInterfaces,
    };
    return application;
}

const application = createApplication();