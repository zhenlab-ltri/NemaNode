const { unique } = require('./util');

let EventEmitter = function() {
  'use strict';

  let self = this;

  let events = {};

  this.on = function(evts, lsn) {
    evts.split(' ').forEach(function(evt) {
      (events[evt] || (events[evt] = [])).push(lsn);
      events[evt] = unique(events[evt]);
    });
    return self;
  };

  this.off = function(evts, lsn) {
    evts.split(' ').forEach(function(evt) {
      events[evt] = (events[evt] || []).filter(function(listener) {
        return listener != lsn;
      });
    });
    return self;
  };

  this.one = function(evts, lsn) {
    self.on(evts, function lsnTemp(arg) {
      lsn(arg);
      self.off(evts, lsnTemp);
    });
  };

  /**
   * @param {string} evt
   * @param {*=} arg
   */
  this.emit = function(evt, arg) {
    (events[evt] || []).slice().forEach(function(listener) {
      listener(arg, evt);
    });
  };
};

module.exports = EventEmitter;
