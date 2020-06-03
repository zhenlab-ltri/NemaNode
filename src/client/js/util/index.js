let deepCopy = obj => JSON.parse(JSON.stringify(obj));

let sum = arr => arr.reduce((a, b) => a + b, 0);

let capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

let max = arr => Math.max(...arr);

let min = arr => Math.min(...arr);

let flatten = arr => arr.reduce((a, b) => a.concat(b), []);

let unique = require('lodash.uniq');

let intersection = require('lodash.intersection');

let union = require('lodash.union');

let difference = require('lodash.difference');

let isEmpty = require('lodash.isempty');

let debounce = require('lodash.debounce');

let groupBy = require('lodash.groupby');

let prettyPrintArray = arr => {
  let label;

  if (arr === []) { return ''; }

  if (arr.length === 1) {
    label = arr[0];
  }

  if (arr.length === 2) {
    label = `${arr[0]} and ${arr[1]}`;
  }

  if (arr.length > 2) {
    label = `${arr.slice(0, arr.length - 2).join(', ')} and ${arr[arr.length - 1]}`;
  }

  return label;
};

module.exports = {
  isEmpty,
  deepCopy,
  debounce,
  sum,
  capitalizeFirstLetter,
  unique,
  intersection,
  max,
  min,
  union,
  flatten,
  difference,
  groupBy,
  prettyPrintArray
};
