// KonvaEngine.js - rendering engine based on Konva
//
// Application makes sure that only one Engine running at the same time
// but it may destroy an Engine and create a new one, so clean up global footprint (e.g. DOM element) is important

function Engine() {
    this.layer = null;
}

Engine.prototype.SetUp = function () {
    const container = document.createElement('div');
    container.id = 'konva-container';
    container.style.position = 'fixed';
    container.style.top = '1.7em';  // fixme
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    document.body.append(container);
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    console.log(`[KonvaEngine] create stage, width = ${containerWidth}, height = ${containerHeight}`);
    const stage = new Konva.Stage({
        container: 'konva-container',
        width: containerWidth,
        height: containerHeight,
    });
    this.layer = new Konva.Layer();
    stage.add(this.layer);
}

Engine.prototype.CleanUp = function () {
    console.log(`[KonvaEngine] clean up`);
    document.querySelector('#konva-container').remove();
    this.layer = null;  // for safe
}

Engine.prototype.Start = function (application, preFrame) {
    console.log('[KonvaEngine] start rendering loop');
    const engine = this;
    requestAnimationFrame(function loop(timeStamp) {
        if (application.IsPaused()) {
            console.log('[KonvaEngine] exit rendering loop');
            return;
        }
        // if current iteration is for pre-frame, do not notify application there is a frame here
        if (preFrame) {
            preFrame = false;
        } else {
            application.OnGameUpdate(timeStamp);
        }
        engine.layer.draw();
        application.AfterFrame(timeStamp);

        const debugThrottleTimeout = application.GetDebugThrottleTimeout();
        if (!debugThrottleTimeout) {
            requestAnimationFrame(loop);
        } else {
            setTimeout(function () {
                requestAnimationFrame(loop);
            }, debugThrottleTimeout);
        }
    });
}