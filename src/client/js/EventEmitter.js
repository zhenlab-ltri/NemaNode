const { unique } = require('./util');

class EventEmitter {

  constructor() {
    this.events = {};
  }

  on(evts, lsn) {
    const { events } = this;
    evts.split(' ').forEach(evt => {
      (events[evt] || (events[evt] = [])).push(lsn);
      events[evt] = unique(events[evt]);
    });
    return this;
  }

  off(evts, lsn) {
    const { events } = this;
    evts.split(' ').forEach(evt => {
      events[evt] = (events[evt] || []).filter(listener => {
        return listener != lsn;
      });
    });
    return this;
  }

  one(evts, lsn) {
    const lsnTemp = (arg) => {
      lsn(arg);
      this.off(evts, lsnTemp);
    };
    this.on(evts, lsnTemp);
  }

  emit(evt, arg) {
    const { events } = this;
    (events[evt] || []).slice().forEach((listener) => {
      listener(arg, evt);
    });
  }
}

module.exports = EventEmitter;
