'use strict';

define(function() {

  function EventEmitter() {
    this.callbacks = {}
  }

  EventEmitter.prototype.on = function(event, cb) {
    if(!this.callbacks[event]) this.callbacks[event] = [];

    var idx;
    for (var a = 0; a < this.callbacks[event].length; a++) {
      if (this.callbacks[event][a] == null) {
        idx = a;
      }
    }

    if (idx == null) {
      idx = this.callbacks[event].push(cb) - 1;
    } else {
      this.callbacks[event][idx] = cb
    }

    return idx;
  }

  EventEmitter.prototype.off = function(event, cbIdx) {
    this.callbacks[event][cbIdx] = null;
  }

  EventEmitter.prototype.emit = function(event, data) {
    let cbs = this.callbacks[event]
    if(cbs){
      cbs.forEach((cb) => {
        if (typeof cb == 'function')
          cb(data)
      })
    }
  }


  return EventEmitter;
})
