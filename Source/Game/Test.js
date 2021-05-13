// Test.js - a test game as placeholder

(function () {
    function Create() {
        console.log('[TestGame] create a game');
        return {};
    }

    function Redraw(context, data) {
        console.log('[TestGame] redraw');
    }

    function OnFrame(context, data) {
        // todo
        return data;
    }

    application.RegisterGame({
        name: 'Test',
        description: 'A no-op game for testing whether runtime is working well.',
        interface: {
            Create,
            Redraw,
            OnFrame,
        },
        aspectRatio: null,
    });
})();
