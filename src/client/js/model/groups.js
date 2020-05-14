const { createGrid } = require('./layout');
const { meanPosition } = require('./position');

const { sum, max, intersection } = require('../util');

let ModelPrototype = {};

ModelPrototype.createGroup = function({
  id = null,
  open = false,
  name = 'Group'
} = {}) {
  let findValidGroupId = () => {
    let i = 0;
    while (this.isGroup(i + '')) {
      i += 1;
    }
    return i + '';
  };

  let groupId = id == null ? findValidGroupId() : id;

  this.groups[groupId] = {
    id: groupId,
    name,
    open,
    members: []
  };

  return groupId;
};

ModelPrototype.deleteGroup = function(groupId) {
  let group = this.getGroupById(groupId);

  group.members.forEach(memberId => {
    delete this.parent[memberId];
  });

  delete this.groups[groupId];
};

ModelPrototype.setGroups = function(newGroups) {
  this.groups = {};
  this.parent = {};

  newGroups.forEach(grpJson => {
    let { id, name, open, members } = grpJson;
    let groupId = this.createGroup({ id, open, name });
    let group = this.getGroupById(groupId);
    this.groups[groupId] = group;

    this.addMembersToGroup(groupId, members);
  });
};

ModelPrototype.setGroupName = function(groupId, name) {
  let group = this.getGroupById(groupId);
  group.name = name;
};

ModelPrototype.isGroup = function(id) {
  return this.groups.hasOwnProperty(id);
};

ModelPrototype.isGroupMember = function(id) {
  return this.parent.hasOwnProperty(id);
};

ModelPrototype.getGroupMembers = function() {
  let groupMembers = [];
  this.getGroups().forEach(
    g => (groupMembers = groupMembers.concat(g.members))
  );

  return groupMembers;
};

ModelPrototype.getGroupMembersByGroup = function(id) {
  let group = this.getGroupById(id);

  return group.members;
};

ModelPrototype.getGroupIds = function() {
  return Object.keys(this.groups);
};

ModelPrototype.getGroups = function() {
  return Object.values(this.groups);
};

ModelPrototype.getGroupById = function(groupId) {
  if (this.groups[groupId] == null) {
    throw new Error(`${groupId} is not a group`);
  }

  return this.groups[groupId];
};

ModelPrototype.getGroupByMemberId = function(groupMemberId) {
  if (this.parent[groupMemberId] == null) {
    throw new Error(`${groupMemberId} does not belong to a group`);
  }

  return this.getGroupById(this.parent[groupMemberId]);
};

ModelPrototype.addMembersToGroup = function(groupId, toGroup) {
  toGroup = [].concat(toGroup);

  let group = this.getGroupById(groupId);

  group.members = group.members.concat(toGroup);

  toGroup.forEach(tg => (this.parent[tg] = groupId));
};

ModelPrototype.removeMembersFromGroup = function(groupId, groupMemberIds) {
  groupMemberIds = [].concat(groupMemberIds);

  let group = this.getGroupById(groupId);

  groupMemberIds.forEach(gmId => {
    group.members.splice(group.members.indexOf(gmId), 1);

    if (this.parent[gmId] === groupId) {
      delete this.parent[gmId];
    }
  });
};

ModelPrototype.selectedGroups = function() {
  return intersection(this.getRawSelected(), this.getGroupIds());
};

ModelPrototype.positionGroupMembers = function(groupId) {
  let { members: groupMembers } = this.getGroupById(groupId);

  let groupPosition = this.getPosition(groupId);
  let groupMemberXPositions = [];
  let groupMemberYPositions = [];

  let groupMembersWithoutPositions = groupMembers.filter( m => {
    let hasPosition = true;
    try {
      this.getPosition(m);
    } catch (e){
      hasPosition = false;
    }
    return !hasPosition;
  });

  // create grid for group members without positions
  // cases where a group member might not have a position:
  //  - when nemanode is used as an api and people put something like this in the url:
  //  - ?la=concentric&in=AVA&s=1&g=0_Group_0_SAA_ADA
  // SAA and ADA are group members but don't have a position defined
  let gridPositions = createGrid(groupMembersWithoutPositions, { 
    x: groupPosition.x, 
    y: groupPosition.y,
    rows: (groupMembersWithoutPositions / 3) + 1
  });

  this.setPositions(gridPositions);

  groupMembers.forEach( m => {
    let { x, y } = this.getPosition(m);
    groupMemberXPositions.push(x);
    groupMemberYPositions.push(y);
  });

  let xOffset = groupPosition.x - sum(groupMemberXPositions) / groupMemberXPositions.length;
  let yOffset = groupPosition.y - sum(groupMemberYPositions) / groupMemberYPositions.length;

  groupMembers.forEach(member => {
    let memberPos = this.getPosition(member);

    this.setPosition(member, {
      x: memberPos.x + xOffset,
      y: memberPos.y + yOffset
    });
  });
};

ModelPrototype.group = function(nodes) {
  let groupId = null;
  let toGroup = [];

  nodes.forEach(node => {
    if (this.isGroup(node)) {
      groupId = node;
    } else if (this.isGroupMember(node)) {
      groupId = this.parent[node];
    } else {
      toGroup.push(node);
    }
  });

  if (toGroup.length == 0) {
    return null;
  }

  // Create group if no group is selected.
  if (groupId == null) {
    groupId = this.createGroup();
    let meanPositionOfToGroup = meanPosition(
      toGroup.map(id => this.getPosition(id))
    );

    this.setPosition(groupId, meanPositionOfToGroup);

    if (this.lockedPositionsExist()) {
      this.lockNodePositions(groupId);
    }

    this.emit('groupCreated', groupId);
  }

  this.addMembersToGroup(groupId, toGroup);

  return groupId;
};

ModelPrototype.groupSelected = function() {
  let groupId = null;
  if (this.canBeGrouped(this.getRawSelected())) {
    groupId = this.group(this.getRawSelected());
  }

  if (groupId != null) {
    this.setSelected([groupId]);
  }

  return groupId;
};

ModelPrototype.ungroup = function(id) {
  if (this.isGroupMember(id)) {
    let group = this.getGroupByMemberId(id);

    this.removeMembersFromGroup(group.id, id);

    if (group.members.length == 0) {
      this.ungroup(group.id);
    }
  } else if (this.isGroup(id)) {
    let group = this.getGroupById(id);

    this.positionGroupMembers(group.id);

    if (!group.open) {
      this.select(group.members);
    }

    this.deleteGroup(id);

    this.unselect(id);
  }
};

ModelPrototype.ungroupSelected = function() {
  this.getRawSelected().forEach(id => this.ungroup(id));
};

ModelPrototype.openGroup = function(groupId) {
  let group = this.getGroupById(groupId);

  if (!group.open) {
    group.open = true;
    this.positionGroupMembers(groupId);
  }
};

ModelPrototype.openSelectedGroups = function() {
  this.selectedGroups().forEach(groupId => this.openGroup(groupId));
};

ModelPrototype.closeSelectedGroups = function() {
  this.selectedGroups().forEach(groupId => this.closeGroup(groupId));
};

ModelPrototype.closeGroup = function(id) {
  if (!this.isGroup(id)) {
    return;
  }

  let group = this.getGroupById(id);

  if (!group.open) {
    return;
  }

  group.open = false;

  let meanPositionOfMembers = meanPosition(
    group.members.map(member => this.getPosition(member))
  );

  this.setPosition(group.id, meanPositionOfMembers);
};

ModelPrototype.closeAllGroups = function() {
  this.getGroupIds().forEach(groupId => this.closeGroup(groupId));
};

module.exports = ModelPrototype;
