// Generated by CoffeeScript 2.5.1
(function() {
  // TestCoffee.coffee - The test game, CoffeeScript version
  var $maxNumberDescription, Create, GetCoffeeTimerInterval, GetEventDescriptionColor, GetEventDescriptionText, GetEventDescriptionY, GetImageDescriptionText, GetImageRotation, GetImageX, GetImageY, GetNumberEventText, GetPauseButtonText, GetSystemTimeText, GetTimerDescriptionText, OnFrame, Redraw, textCommon;

  Create = function() {
    console.log('[TestCoffee] create game');
    return {
      // initial states
      numberEvent: 0,
      numberSecond: 0,
      loggingEventList: [],
      timerRemain: 1000.0,
      timerPaused: false,
      coffeeTimerInterval: GetCoffeeTimerInterval()
    };
  };

  GetCoffeeTimerInterval = function() {
    return 500 + Math.random() * 1000;
  };

  GetSystemTimeText = function(context) {
    return `System time: ${context.system.numberMillisecond.toFixed(2)}ms`;
  };

  GetNumberEventText = function(numberEvent) {
    return `Number of events: ${numberEvent}`;
  };

  // adjust movement period with canvas pixel size
  // so it will not move too fast/slow on large/small screen
  // introduce a 571:431 factor in period ratio so it looks like random moving
  GetImageX = function(t, w, h) {
    var t1;
    t1 = t / 1000 / ((w + h) / 571);
    return (Math.sin(t1 * (2 * Math.PI)) + 1) / 2;
  };

  GetImageY = function(t, w, h) {
    var t1;
    t1 = t / 1000 / ((w + h) / 431);
    return (Math.sin(t1 * (2 * Math.PI)) + 1) / 2;
  };

  GetImageRotation = function(t) {
    return t / 1023 * (2 * Math.PI) % (2 * Math.PI);
  };

  GetImageDescriptionText = function(t, w, h) {
    return `Coffee: x = ${(GetImageX(t, w, h)).toFixed(2)}, y = ${(GetImageY(t, w, h)).toFixed(2)}, ` + `r = ${(GetImageRotation(t)).toFixed(2)}`;
  };

  GetTimerDescriptionText = function(remain) {
    return `Until next fire: ${remain.toFixed(2)}ms`;
  };

  GetPauseButtonText = function(paused) {
    if (paused) {
      return 'Resume Timer';
    } else {
      return 'Pause Timer';
    }
  };

  GetEventDescriptionText = function(event) {
    switch (`${event.target}/${event.name}`) {
      case 'stage%%0/keydown':
        return `Keydown: key = ${event.value}`;
      case 'stage%%0/swipe':
        return `Swipe: direction = ${event.value}`;
      case 'image%coffee%0/click':
      case 'image%coffee%0/tap':
        return "Coffee is clicked/tapped";
      case 'timer%%0/fire':
        return `Timer is fired #${event.value}`;
    }
  };

  textCommon = {
    x: 0.0,
    fontSize: 0.03,
    fontFamily: 'Lato',
    fill: 'black'
  };

  $maxNumberDescription = 15;

  GetEventDescriptionY = function(eventIndex, numberEvent) {
    return 0.04 * 4 + (numberEvent - eventIndex - 1) * 0.04;
  };

  GetEventDescriptionColor = function(eventIndex, numberEvent) {
    var fadingLevel, gray, n;
    n = numberEvent - eventIndex;
    fadingLevel = n - $maxNumberDescription + 7;
    if (fadingLevel <= 0) {
      return 'black';
    }
    gray = 32 * fadingLevel;
    return `rgb(${gray}, ${gray}, ${gray})`;
  };

  Redraw = function(context, data) {
    var event, i, len, pauseButtonCommon, ref;
    console.log('[TextCoffee] redraw game');
    // no elegant way to remove parentheses after Create, what a pity for junkrat revision
    context.Create('stage%%0').Stage({
      eventList: ['keydown', 'swipe']
    });
    context.Create('image%coffee%0').Image({
      url: 'Resource/Coffee.svg',
      x: GetImageX(context.system.numberMillisecond, context.system.width, context.system.height),
      y: GetImageY(context.system.numberMillisecond, context.system.width, context.system.height),
      rotation: GetImageRotation(context.system.numberMillisecond),
      width: 0.12 / context.system.aspectRatio,
      height: 0.1,
      crop: {
        width: 120,
        height: 100
      },
      eventList: ['click', 'tap']
    });
    context.Create('timer%%0').Timer({
      interval: 1000
    });
    context.Create('timer%coffee%0').Timer({
      interval: data.coffeeTimerInterval
    });
    pauseButtonCommon = {
      x: 0.005,
      y: 0.115,
      width: 0.20 / context.system.aspectRatio
    };
    context.Create('rect%pause-button%0').Rect({
      stroke: 'black',
      strokeWidth: 1,
      height: 0.04,
      ...pauseButtonCommon
    });
    context.Create('text%pause-button%0').Text({
      text: GetPauseButtonText(data.timerPaused),
      lineHeight: 0.04 / textCommon.fontSize,
      align: 'center',
      eventList: ['click', 'tap'],
      ...textCommon,
      ...pauseButtonCommon
    });
    context.Create('text%system-time%0').Text({
      y: 0.0,
      text: GetSystemTimeText(context),
      ...textCommon
    });
    context.Create('text%number-event%0').Text({
      y: 0.04,
      text: GetNumberEventText(data.numberEvent),
      ...textCommon
    });
    context.Create('text%coffee-status%0').Text({
      y: 0.08,
      text: GetImageDescriptionText(context.system.numberMillisecond, context.system.width, context.system.height),
      ...textCommon
    });
    context.Create('text%timer-status%0').Text({
      y: 0.12,
      text: GetTimerDescriptionText(data.timerRemain),
      ...textCommon,
      x: 0.22 / context.system.aspectRatio // override common setting
    });
    ref = data.loggingEventList;
    for (i = 0, len = ref.length; i < len; i++) {
      event = ref[i];
      if (event.index < data.numberEvent - $maxNumberDescription) {
        continue;
      }
      context.Create(`text%event-description%${event.index}`).Text({
        y: GetEventDescriptionY(event.index, data.numberEvent),
        text: GetEventDescriptionText(event),
        ...textCommon
      });
    }
    return null;
  };

  OnFrame = function(context, data) {
    var coffeeTimerInterval, count, event, eventList, i, j, len, len1, loggingEventList, name, numberEvent, ref, target, timerPaused, timerRemain, value;
    context.Update('text%system-time%0', {
      text: GetSystemTimeText(context)
    });
    context.Update('image%coffee%0', {
      x: GetImageX(context.system.numberMillisecond, context.system.width, context.system.height),
      y: GetImageY(context.system.numberMillisecond, context.system.width, context.system.height),
      rotation: GetImageRotation(context.system.numberMillisecond)
    });
    context.Update('text%coffee-status%0', {
      text: GetImageDescriptionText(context.system.numberMillisecond, context.system.width, context.system.height)
    });
    timerRemain = context.DequeueEvent('timer%%0', 'remain');
    context.Update('text%timer-status%0', {
      text: GetTimerDescriptionText(timerRemain)
    });
    timerPaused = data.timerPaused;
    if ((context.DequeueEvent('text%pause-button%0', 'click')) || (context.DequeueEvent('text%pause-button%0', 'tap'))) {
      timerPaused = !timerPaused;
      context.Update('text%pause-button%0', {
        text: GetPauseButtonText(timerPaused)
      });
      context.Update('timer%%0', {
        pause: timerPaused
      });
    }
    coffeeTimerInterval = data.coffeeTimerInterval;
    if ((count = context.DequeueEvent('timer%coffee%0', 'fire')) != null) {
      if (count === 0) {
        context.Update('image%coffee%0', {
          opacity: 0.3
        });
      } else if (count === 1) {
        context.Update('image%coffee%0', {
          opacity: 1.0
        });
        context.Remove('timer%coffee%0');
        coffeeTimerInterval = GetCoffeeTimerInterval();
        context.Create('timer%coffee%0').Timer({
          interval: coffeeTimerInterval
        });
      }
    }
    numberEvent = data.numberEvent;
    eventList = [];
    ref = [['stage%%0', 'keydown'], ['stage%%0', 'swipe'], ['image%coffee%0', 'click'], ['image%coffee%0', 'tap'], ['timer%%0', 'fire']];
    for (i = 0, len = ref.length; i < len; i++) {
      [target, name] = ref[i];
      while ((value = context.DequeueEvent(target, name)) != null) {
        eventList.push({
          index: numberEvent,
          target,
          name,
          value
        });
        numberEvent += 1;
      }
    }
    if (numberEvent !== data.numberEvent) {
      context.Update("text%number-event%0", {
        text: GetNumberEventText(numberEvent)
      });
    }
    loggingEventList = data.loggingEventList;
    for (j = 0, len1 = eventList.length; j < len1; j++) {
      event = eventList[j];
      context.Create(`text%event-description%${event.index}`).Text({
        y: GetEventDescriptionY(event.index, numberEvent),
        text: GetEventDescriptionText(event),
        ...textCommon
      });
      loggingEventList.push(event);
    }
    loggingEventList = loggingEventList.filter(function(event) {
      if (event.index < numberEvent - $maxNumberDescription) {
        context.Remove(`text%event-description%${event.index}`);
        return false;
      }
      context.Update(`text%event-description%${event.index}`, {
        y: GetEventDescriptionY(event.index, numberEvent),
        fill: GetEventDescriptionColor(event.index, numberEvent)
      });
      return true;
    });
    return {
      // updated states
      numberEvent: numberEvent,
      numberSecond: data.numberSecond,
      loggingEventList: loggingEventList,
      timerRemain: timerRemain,
      timerPaused: timerPaused,
      coffeeTimerInterval: coffeeTimerInterval
    };
  };

  application.RegisterGame({
    name: 'Test Coffee',
    description: 'A testing game written in CoffeeScript.',
    aspectRatio: null,
    featureTagList: ['shape:text', 'shape:image', 'event:keydown', 'event:click', 'event:swipe', 'event:tap', 'event:timer'],
    contextRevision: 'junkrat',
    interface: {Create, Redraw, OnFrame}
  });

}).call(this);

//# sourceMappingURL=TestCoffee.js.map
