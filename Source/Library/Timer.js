// Timer.js - user-level efficient multi-timer management

function TimerState () {
  this.entityDict = {}
  this.timerQueue = new buckets.PriorityQueue(function (companion, otherCompanion) {
    if (companion.fireNumberMillisecond < otherCompanion.fireNumberMillisecond) {
      return 1
    } else if (companion.fireNumberMillisecond > otherCompanion.fireNumberMillisecond) {
      return -1
    }
    return 0
  })
  this.fireQueueDict = {}
}
