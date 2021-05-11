// Application.js - collect information of games, and control them

function createApplication() {
    const gameList = [];
    const menu = new Menu();
    let application;

    const Register = function (game) {
        gameList.push(game);
    };

    const ForEach = function (consumer) {
        for (let game of gameList) {
            consumer({
                name: game.name,
                description: game.description,
                Select: function () {
                    console.log(`[App] game "${game.name}" is selected`);
                    // todo: run the game, properly handle previous running one if exist
                    menu.Hide();
                },
            })
        }
    };

    const Initialize = function () {
        menu.CreateElement(application);
    };

    const OnReady = function () {
        menu.AttachElement();
        setTimeout(function () {
            menu.Show();
            document.querySelector('#loading-text').remove();
        }, 0);
    };

    application = {
        Register,
        ForEach,
        Initialize,
        OnReady,
    };
    return application;
}

const application = createApplication();