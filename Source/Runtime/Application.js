// Application.js - meeting point of games, user input, and everything
//
// About terminology: *game* means static information & implementation, similar to program file on disk
// *session* means a running game instance state + backend engine state, similar to process in memory
// To keep implementation (of application) minimal, it only support one session
// The session could be paused explicitly by user or implicitly by some events (e.g. window size change)
// If user switch to another game in the menu, the session will be reset, previous game state will be lost

function createApplication() {
    const gameList = [];
    const session = {
        game: null,
        data: null,
        engine: null,
        lastResume: null,
        numberFrame: 0,
        numberMillisecond: 0,
        lastUpdateFps: null,
        numberFrameSinceLastUpdateFps: 0,
    };
    let paused = true;
    const menu = new Menu();
    let application;  // forward declaration of `this`

    const RegisterGame = function (game) {
        gameList.push(game);
    };

    const ForEachGame = function (consumer) {
        function CreateOnSelect(game) {
            return function () {
                console.log(`[App] game "${game.name}" is selected`);
                paused = false;
                menu.SetGameName(game.name);
                if (session.game === game) {
                    console.log('[App] resume the game');
                    session.engine.Start(application, false);
                } else {
                    console.log('[App] start game');
                    session.game = game;
                    session.data = game.interface.Create();
                    if (session.engine) {
                        session.engine.Cleanup();
                    }
                    session.engine = new Engine();
                    session.engine.Setup();
                    // todo: somehow create a redraw context for session game
                    const redrawContext = null;
                    session.game.interface.Redraw(redrawContext, session.data);

                    menu.SetFps(0);
                    session.lastUpdateFps = performance.now();
                    session.engine.Start(application, true);
                }
                menu.Hide();
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
    };

    const IsPaused = function () {
        return paused;
    }

    const OnReady = function () {
        console.log('[App] on ready');
        menu.CreateElement(application);
        menu.AttachElement();
        setTimeout(function () {
            menu.Show();
            document.querySelector('#loading-text').remove();
        }, 0);
        // todo: setup event listener to trigger OnPause
    }

    const OnPause = function () {
        console.log('[App] game is paused');
        paused = true;
        menu.UpdateGameList(application);
        setTimeout(function () {
            menu.Show();
        }, 0);
    };

    const OnFrame = function (timeStamp) {
        // todo: somehow create a on-frame context
        const onFrameContext = null;
        session.data = session.game.interface.OnFrame(onFrameContext, session.data);

        session.numberFrameSinceLastUpdateFps += 1;
        if (timeStamp - session.lastUpdateFps >= 1000.0) {
            menu.SetFps(session.numberFrameSinceLastUpdateFps);
            session.lastUpdateFps = timeStamp;
            session.numberFrameSinceLastUpdateFps = 0;
        }
    };

    application = {
        RegisterGame,
        ForEachGame,
        IsPaused,
        OnReady,
        OnPause,
        OnFrame,
    };
    return application;
}

const application = createApplication();