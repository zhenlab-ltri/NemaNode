require('regenerator-runtime');

module.exports = {
  maxConcurrency: 1,
  globalSetup: './before-tests.js',
  globalTeardown: './after-tests.js',
  testEnvironment: 'node'
};
