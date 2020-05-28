let winston = require('winston');
let { NODE_ENV, LOG_LEVEL } = require('./config');

let transports = [
  new winston.transports.File({
    name: 'error',
    filename: 'error.log',
    level: 'error'
  })
];

if (NODE_ENV !== 'production') {
  transports = transports.concat([
    new winston.transports.Console({ level: LOG_LEVEL })
  ]);
}

let logger = new winston.Logger({
  transports
});

module.exports = logger;
