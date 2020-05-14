let defaults = {
  PORT: 3000,
  USER: '',
  PASSWORD: '',
  GOOGLE_ANALYTICS_ID: ''
};

let envVars = {
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID
};

// these vars are always included in the bundle because they ref `process.env.${name}` directly
// NB DO NOT include passwords etc. here
let clientVars = {
  NODE_ENV: process.env.NODE_ENV
};

Object.assign(envVars, clientVars);

for (let key in envVars) {
  let val = envVars[key];

  if (val === '' || val == null) {
    delete envVars[key];
  }
}

let conf = Object.assign({}, defaults, envVars);

Object.freeze(conf);

module.exports = conf;
