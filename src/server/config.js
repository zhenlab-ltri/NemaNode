const fs = require('fs');
const path = require('path');
const ini = require('ini');

const options = ini.parse(
  fs.readFileSync(path.join(__dirname, '../../config.ini'), 'utf-8')
);
const { port, auth_user, auth_password } = options.http_server;

const userVars = {
  PORT: parseInt(port),
  USER: auth_user,
  PASSWORD: auth_password
};


let envVars = {
  VERSION: process.env.npm_package_version,
  NODE_ENV: process.env.NODE_ENV
};

for (let key in envVars) {
  let val = envVars[key];

  if (val === '' || val === undefined) {
    delete envVars[key];
  }
}

let conf = Object.assign({}, userVars, envVars);

Object.freeze(conf);

module.exports = conf;