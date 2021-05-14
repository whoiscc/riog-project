// 2048.js - reference implementation of the 2048 game

(function () {
    function Create() {
        console.log('[2048] create game');
        return {};
    }

    function Redraw(context, data) {
        console.log('[2048] redraw');
    }

    function OnFrame(context, data) {
        // todo
        return data;
    }

    application.RegisterGame({
        name: '2048',
        description: 'Join the tiles, get to 2048!',
        aspectRatio: {width: 5, height: 6},
        featureTagList: [],
        contextRevision: 'junkrat',
        interface: {
            Create,
            Redraw,
            OnFrame,
        },
    });
})();
