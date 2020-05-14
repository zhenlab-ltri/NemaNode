const { sum, difference, union, unique } = require('../util');

let meanPosition = positions => {
  let xArr = positions.map(p => p.x);
  let yArr = positions.map(p => p.y);
  return {
    x: sum(xArr) / xArr.length,
    y: sum(yArr) / yArr.length
  };
};

let ModelPrototype = {};

ModelPrototype.getPositions = function() {
  return this.positions;
};

ModelPrototype.getPosition = function(id) {
  if (!this.positionExists(id)) {
    throw new Error(`${id} does not have a position`);
  }
  return this.positions[id];
};

ModelPrototype.getLockedPositions = function() {
  return this.lockedPositions;
};

ModelPrototype.positionExists = function(id) {
  return this.positions.hasOwnProperty(id);
};

ModelPrototype.setPositions = function(newPositions) {
  this.positions = Object.assign(this.positions, newPositions);
};

ModelPrototype.setPosition = function(id, position) {
  this.positions[id] = position;
};

// for some reason, positions are reset when this is called
ModelPrototype.setPositionsFromArray = function(positionArray) {
  this.positions = {};

  positionArray.forEach(({ x, y, id }) => {
    this.positions[id] = { x, y };
    this.lockedPositions.push(id);
  });
};

ModelPrototype.removePositions = function(ids) {
  ids = ids || Object.keys(this.positions);

  this.lockedPositions = difference(this.lockedPositions, ids);

  ids.forEach(id => delete this.positions[id]);
};

ModelPrototype.nodePositionIsLocked = function(id) {
  return this.lockedPositions.includes(id);
};

ModelPrototype.lockedPositionsExist = function() {
  return this.lockedPositions.length > 0;
};

ModelPrototype.lockNodePositions = function(ids) {
  this.lockedPositions = this.lockedPositions.concat(ids);
};

ModelPrototype.lockPositions = function(newPositions) {
  this.setPositions(newPositions);
  this.lockedPositions = union(this.lockedPositions, Object.keys(newPositions));

  Object.keys(newPositions).forEach(nodeId => {
    if (this.isGroup(nodeId)) {
      this.lockedPositions = this.lockedPositions.concat(
        this.getGroupById(nodeId).members
      );
    }

    if (this.isGroupMember(nodeId)) {
      this.lockedPositions.push(this.getGroupByMemberId(nodeId).id);
    }
  });

  this.lockedPositions = unique(this.lockedPositions);
};

module.exports = { positionModule: ModelPrototype, meanPosition };
