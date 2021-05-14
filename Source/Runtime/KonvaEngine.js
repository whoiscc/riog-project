// KonvaEngine.js - rendering engine based on Konva
//
// Application makes sure that only one Engine running at the same time
// but it may destroy an Engine and create a new one, so clean up global footprint (e.g. DOM element) is important

function Engine() {
    this.layer = null;
    this.width = null;
    this.height = null;
}

// static property
Engine.featureTagList = [
    'engine:konva',
    'shape:rect',
    'shape:ellipse',
    'shape:line',
    'shape:image',
    'shape:text',
    'event:mouseenter',
    'event:mouseleave',
    'event:mousedown',
    'event:mouseup',
]

Engine.prototype.SetUp = function (config) {
    const container = document.createElement('div');
    container.id = 'konva-container';
    container.style.position = 'fixed';
    // 1.7em because currently banner is about 1.6em (1em font size with 0.3em padding)
    // and set it to 1.6em causes some overlap
    container.style.top = '1.7em';  // fixme
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    document.body.append(container);
    let containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;
    if (config.aspectRatio) {
        // solution 1: (w, containerHeight)
        const w = containerHeight / config.aspectRatio.height * config.aspectRatio.width;
        // solution 2: (containerWidth, h)
        const h = containerWidth / config.aspectRatio.width * config.aspectRatio.height;
        // choose the one fits into screen
        if (w > containerWidth) {
            this.width = containerWidth;
            this.height = h;
        } else {
            this.width = w;
            this.height = containerHeight;
        }
    }
    container.style.marginLeft = ((containerWidth - this.width) / 2) + 'px';

    console.log(`[KonvaEngine] create stage, width = ${this.width}, height = ${this.height}`);
    const stage = new Konva.Stage({
        container: 'konva-container',
        width: this.width,
        height: this.height,
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
        // if current iteration is for pre-frame, do not ask application for a new frame
        if (preFrame) {
            preFrame = false;
        } else {
            application.OnGameUpdate(timeStamp);
        }
        engine.layer.draw();
        application.AfterFrame(timeStamp);

        const debugThrottleTimeout = application.debug.GetThrottleTimeout();
        if (!debugThrottleTimeout) {
            requestAnimationFrame(loop);
        } else {
            setTimeout(function () {
                requestAnimationFrame(loop);
            }, debugThrottleTimeout);
        }
    });
}