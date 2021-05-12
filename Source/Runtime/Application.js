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
    };
    const menu = new Menu();
    let application;  // forward declaration of `this`

    const RegisterGame = function (game) {
        gameList.push(game);
    };

    const ForEachGame = function (consumer) {
        function CreateOnSelect(game) {
            return function () {
                console.log(`[App] game "${game.name}" is selected`);
                menu.SetGameName(game.name);
                if (session.game === game) {
                    console.log('[App] resume the game');
                    // todo: resume engine
                } else {
                    console.log('[App] start game');
                    // todo: create new engine, (replace old one if exist,) start engine with selected game
                    session.game = game;
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
        menu.UpdateGameList(application);
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