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
        const textCommon = {
            x: 0.0,
            fontSize: 0.03,
            fontFamily: 'Lato',
            fill: 'black',
        };
        context.Create('text%hello%0').Text({
            y: 0.0,
            text: 'Hello',
            ...textCommon,
        });
        context.Create('text%number-event%0').Text({
            y: 0.04,
            text: `Number of event: ${data.numberEvent}`,
            ...textCommon,
        });
        context.Create('text%number-ms%0').Text({
            y: 0.08,
            text: `Number of millisecond: ${context.stat.numberMillisecond.toFixed(3)}`,
            ...textCommon,
        });
    }

    function OnFrame(context, data) {
        context.Update('text%number-ms%0', {
            text: `Number of millisecond: ${context.stat.numberMillisecond.toFixed(3)}`,
        });
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
