const http = require('http');
const path = require('path');
const fs = require('fs');
const process = require('process');

const compression = require('compression');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');

const logger = require('./logger');
const routes = require('./routes');
const db = require('./db/');

const { PORT, USER, PASSWORD } = require('./config');

const app = express();
const server = http.createServer(app);

// compress json requests using g-zip
app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup
app.set('views', path.join(__dirname, '../../dist/'));

app.engine('html', (filePath, options, callback) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      return callback(err);
    }

    return callback(null, content.toString());
  });
});
app.set('view engine', 'html');

app.use(cookieParser());
app.use(
  express.static(path.join(__dirname, '../..', 'dist'), {
    immutable: true,
    maxAge: 31557600000
  })
);

if (USER !== '' && PASSWORD !== '') {
  app.use(
    basicAuth({
      users: { [USER]: PASSWORD },
      challenge: true
    })
  );
}

app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;

  next(err);
});

// on thrown error in route, send http 500 and send just the error text message
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);

  next(err);
});

let normalizePort = val => {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

let port = normalizePort(PORT);

server.on('error', error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES': {
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    }
    case 'EADDRINUSE': {
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    }
    default: {
      throw error;
    }
  }
});

db.connect().then(() => {
  server.listen(port);
});

process.on('exit', () => {
  db.connect()
    .then(connection => {
      connection.end();
      server.close();
    })
    .catch(() => {
      logger.error('Could not close mysql connection');
    });
});

module.exports = app;
