module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 8
  },
  rules: {
    semi: ['error', 'always'], // Always have semi-colons.
    'no-console': 'error', // Don't allow console.log().
    'no-var': 'error', // Use let or const.
    'no-prototype-builtins': 'off', // Allow using hasOwnProperty.
  }
};
