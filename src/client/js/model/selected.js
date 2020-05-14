const { difference, union, flatten, unique, intersection } = require('../util');

let ModelPrototype = {};

// this incldues groups
ModelPrototype.getRawSelected = function() {
  return this.selected;
};

ModelPrototype.select = function(ids) {
  this.selected = this.selected.concat(ids);
};

ModelPrototype.unselect = function(ids) {
  [].concat(ids).forEach(id => {
    this.selected.splice(this.selected.indexOf(id), 1);
  });
};

// selected groups will be replaced with its group members instead
ModelPrototype.getSelected = function() {
  let { selected } = this;
  let s = [];

  selected.forEach(n => {
    if (this.isGroup(n)) {
      s = s.concat(this.getGroupById(n).members);
    } else {
      s.push(n);
    }
  });

  return s;
};

ModelPrototype.setSelected = function(newSelected) {
  this.selected = newSelected;
  this.emit('selectedChanged', this.selected);
};

module.exports = ModelPrototype;
