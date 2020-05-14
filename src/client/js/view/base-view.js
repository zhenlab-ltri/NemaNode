const EventEmitter = require('../EventEmitter');

class BaseView extends EventEmitter {
  constructor() {
    super();
  }

  isSmallScreen() {
    return window.innerWidth <= 640;
  }
}

module.exports = BaseView;
