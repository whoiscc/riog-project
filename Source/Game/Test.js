// Test.js - a test game as placeholder

(function () {
    function Create() {
        console.log('[TestGame] create a game');
        return {
            numberEvent: 0,
            numberSecond: 0,
        };
    }

    function Redraw(context, data) {
        console.log('[TestGame] redraw');
        context.Create('text%hello%0').Text({
            x: 0.0,
            y: 0.0,
            text: 'Hello',
            fontSize: 0.05,
            fontFamily: 'Lato',
            fill: 'black',
        });
        context.Create('text%number-event%0').Text({
            x: 0.0,
            y: 0.1,
            text: `Number of event: ${data.numberEvent}`,
            fontSize: 0.05,
            fontFamily: 'Lato',
            fill: 'black',
        });
    }

    function OnFrame(context, data) {
        // todo
        return data;
    }

    application.RegisterGame({
        name: 'Test',
        description: 'A no-op game for testing whether runtime is working well.',
        aspectRatio: null,
        featureTagList: [
            'shape:text',
        ],
        contextRevision: 'junkrat',
        interface: {
            Create,
            Redraw,
            OnFrame,
        },
    });
})();
