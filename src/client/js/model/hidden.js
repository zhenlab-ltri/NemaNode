const { difference, intersection, unique } = require('../util');

let ModelPrototype = {};

ModelPrototype.getHidden = function() {
  return this.hidden;
};

ModelPrototype.setHidden = function(newHidden) {
  this.hidden = unique(newHidden);
};

ModelPrototype.hide = function(nodeIds) {
  this.hidden = unique(this.hidden.concat(nodeIds));
};

ModelPrototype.unhide = function(nodeIds) {
  this.hidden = unique(difference(this.hidden, nodeIds));
};

ModelPrototype.hideSelected = function() {
  let toHide = this.getRawSelected();

  toHide.forEach(id => {
    // Ungroup group members before hiding them.
    if (this.isGroupMember(id)) {
      this.ungroup(id);
      this.hide(id); // toHide is mutated by ungroup, hide the id manually
    }

    // Close groups before hiding them.
    if (this.isGroup(id)) {
      this.closeGroup(id);
    }
  });

  this.removeInput(intersection(toHide, this.getInput()));
  this.hide(toHide);
  this.setSelected([]);
};

module.exports = ModelPrototype;
