const DataService = require('../data-service');

const { meanPosition } = require('./position');
const { createCircle } = require('./layout');

const { difference, union, flatten, unique, intersection } = require('../util');

let ModelPrototype = {};

ModelPrototype.cellClassIsSplit = function(cellClass) {
  return this.split.includes(cellClass);
};

ModelPrototype.unsplitClass = function(cellClass) {
  this.split.splice(this.split.indexOf(cellClass), 1);
};

ModelPrototype.splitClass = function(cellClass) {
  this.split.push(cellClass);
};

ModelPrototype.getSplit = function() {
  return this.split;
};

ModelPrototype.setSplit = function(newSplit) {
  this.split = newSplit;
};

ModelPrototype.splitSelected = function() {
  let toSplit = this.getSelected();

  // If the legacy complete dataset is selected, ensure that the muscles classes aren't split,
  // since individual muscle cells weren't annotated in that dataset.
  if (this.datasets.includes(DataService.getAdultCompleteDataset().id)) {
    let notAllowedToSplit = intersection(
      toSplit,
      DataService.adultCompleteDatasetSpecificClasses
    );
    if (notAllowedToSplit.length > 0) {
      this.emit('warning', {
        id: 'legacySplitAttempt',
        message:
          'Individual muscle cells were not annotated in the legacy adult datasets ' +
          '(Varshney et al., 2011). Disable the dataset to split {0}.',
        arr: notAllowedToSplit
      });
    }
    toSplit = difference(toSplit, notAllowedToSplit);
  }

  toSplit = toSplit.filter(n => !DataService.isCell(n));

  // Update positions.
  toSplit.forEach(cls => {
    if (this.positionExists(cls)) {
      let { x: classPosX, y: classPosY } = this.getPosition(cls);
      let members = DataService.classMembers(cls);
      let newMemberPositions = createCircle(members, {
        x: classPosX,
        y: classPosY
      });

      this.setPositions(newMemberPositions);

      if (this.lockedPositionsExist()) {
        this.lockNodePositions(members);
      }
    }
  });

  // Update groups.
  toSplit.forEach(cls => {
    if (this.isGroupMember(cls)) {
      let groupId = this.getGroupByMemberId(cls).id;
      let classMembers = DataService.classMembers(cls);

      this.removeMembersFromGroup(groupId, cls);
      this.addMembersToGroup(groupId, classMembers);
    }
  });

  // Update selected.
  this.unselect(toSplit);

  let allClassMembers = flatten(
    toSplit.map(cls => DataService.classMembers(cls))
  );
  this.select(allClassMembers);

  // Update input.
  this.replaceClassWithClassMembersInInput(toSplit);

  // Prepare info if all class members are hidden after split because of thresholds.
  this.one('networkChanged', networkElements => {
    let nodes = Object.keys(networkElements.nodes);

    let filteredAfterSplit = toSplit.filter(cls => {
      let classMembers = DataService.classMembers(cls);
      let classMembersAreFiltered =
        intersection(classMembers, nodes).length === 0;
      let classMembersArentInGroup =
        classMembers.filter(classMember => this.isGroupMember(classMember))
          .length === 0;

      return classMembersAreFiltered && classMembersArentInGroup;
    });

    if (filteredAfterSplit.length > 0) {
      this.emit('info', {
        id: 'splitNodesAreHidden',
        message:
          'Members of the split cell class' +
          (filteredAfterSplit.length > 1 ? 'es' : '') +
          ' {0} are hidden because of the connection thresholds set in the options sidebar:' +
          '<br />Chemical synapses: ' +
          this.thresholdChemical +
          '<br />Gap junctions: ' +
          this.thresholdElectrical,
        arr: filteredAfterSplit
      });
    }
  });

  this.split = this.split.concat(toSplit);
  this.joined = difference(this.joined, toSplit);
};

ModelPrototype.getJoined = function() {
  return this.joined;
};

ModelPrototype.setJoined = function(toJoin) {
  let newJoined = [];

  if (this.datasets.includes(DataService.getAdultCompleteDataset().id)) {
    // automatically join classes specific to the complete adult dataset
    newJoined = newJoined.concat(
      DataService.adultCompleteDatasetSpecificClasses
    );
  }
  this.joined = union(newJoined, toJoin);
};

ModelPrototype.joinSelected = function() {
  let toJoin = this.getSelected().filter(n => !DataService.isClass(n));
  let toJoinClasses = unique(toJoin.map(n => DataService.cellClass(n)));

  // Update positions.
  toJoinClasses.forEach(cls => {
    let members = DataService.classMembers(cls);

    let memberPositions = members
      .filter(m => this.positionExists(m))
      .map(m => this.getPosition(m));

    if (memberPositions.length > 0) {
      this.setPosition(cls, meanPosition(memberPositions));
    }

    if (this.lockedPositionsExist()) {
      this.lockNodePositions(cls);
    }
  });

  // Update groups.
  toJoinClasses.forEach(cls => {
    let classMembers = DataService.classMembers(cls);
    let groupIds = [];

    classMembers.forEach(cm => {
      if (this.isGroupMember(cm)) {
        let groupId = this.getGroupByMemberId(cm).id;

        groupIds.push(groupId);

        this.removeMembersFromGroup(groupId, cm);
      }
    });

    if (groupIds.length > 0) {
      this.addMembersToGroup(groupIds[0], cls);
    }

    this.getGroups().forEach(group => {
      if (group.members.length === 0) {
        this.ungroup(group.id);
      }
    });
  });

  // Update hidden
  toJoinClasses.forEach(cls => {
    let classMembers = DataService.classMembers(cls);

    this.unhide(classMembers);
  });

  // Update selected.
  this.unselect(toJoin);
  this.select(toJoinClasses);

  // Update input.
  this.replaceClassMembersWithClassInInput(toJoinClasses, toJoin);

  // Update join list.
  this.joined = this.joined.concat(toJoinClasses);
  this.split = difference(this.split, toJoinClasses);
};

module.exports = ModelPrototype;
