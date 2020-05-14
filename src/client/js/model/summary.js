const DataService = require('../data-service');

const { flatten, intersection } = require('../util');

// object to extend Model.prototype
let ModelPrototype = {};

ModelPrototype.canBeSplit = function(nodes) {
  return nodes.some(n => !DataService.isCell(n));
};

ModelPrototype.canBeJoined = function(nodes) {
  return nodes.some(n => !DataService.isClass(n));
};

ModelPrototype.canBeGrouped = function(nodes) {
  let selectedGroupIds = intersection(nodes, this.getGroupIds());

  nodes.forEach(n => {
    if (this.isGroupMember(n)) {
      selectedGroupIds.push(this.getGroupByMemberId(n).id);
    }
  });

  return (
    nodes.length - selectedGroupIds.length > 0 && selectedGroupIds.length < 2
  );
};

ModelPrototype.canBeUngrouped = function(nodes) {
  let groups = this.getGroups();
  let groupIds = groups.map(g => `${g.id}`);
  let groupMembers = flatten(groups.map(group => group.members));

  return intersection(nodes, groupIds.concat(groupMembers)).length > 0;
};

ModelPrototype.canBeOpened = function(nodes) {
  return nodes.some(n => this.isGroup(n) && !this.getGroupById(n).open);
};

ModelPrototype.canBeClosed = function(nodes) {
  return nodes.some(n => this.isGroup(n) && this.getGroupById(n).open);
};

ModelPrototype.canBeRenamed = function(nodes) {
  return intersection(nodes, this.getGroupIds()).length === 1;
};

module.exports = ModelPrototype;
