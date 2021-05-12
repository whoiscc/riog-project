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
        // todo: engine
    };
    const menu = new Menu();
    let application;

    const RegisterGame = function (game) {
        gameList.push(game);
    };

    const ForEachGame = function (consumer) {
        for (let game of gameList) {
            consumer({
                name: game.name,
                description: game.description,
                Select: function () {
                    console.log(`[App] game "${game.name}" is selected`);
                    if (session.game) {
                        if (session.game !== game) {
                            // todo: reset engine, restart engine with new game
                            session.game = game;
                        } else {
                            // todo: resume engine
                        }
                    } else {
                        // todo: start engine with selected game
                        session.game = game;
                    }
                    menu.Hide();
                },
            })
        }
    };

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
        menu.ClearElement();
        menu.CreateElement(application);
        menu.AttachElement();
        setTimeout(function () {
            menu.Show();
        }, 0);
    };

    application = {
        RegisterGame,
        ForEachGame,
        OnReady,
        OnPause,
    };
    return application;
}

const application = createApplication();