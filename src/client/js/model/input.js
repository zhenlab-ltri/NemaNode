const { unique, difference, intersection } = require('../util');
const DataService = require('../data-service');

let ModelPrototype = {};

ModelPrototype.getInput = function() {
  return this.input;
};

ModelPrototype.addInput = function(toAdd) {
  this.input = this.input.concat(toAdd);
};

ModelPrototype.removeInput = function(toRemove) {
  this.input = difference(this.input, toRemove);
};

ModelPrototype.replaceClassWithClassMembersInInput = function(ids) {
  intersection(this.input, ids).forEach(n => {
    let idx = this.input.indexOf(n);
    this.input.splice(idx, 1);

    let cls = DataService.cellClass(n);

    if (!this.input.includes(cls)) {
      this.input.splice(idx, 0, cls);
    }
  });

  intersection(this.input, ids).forEach(cls => {
    let idx = this.input.indexOf(cls);
    this.input.splice(idx, 1);
    let members = DataService.classMembers(cls);
    this.input = this.input
      .slice(0, idx)
      .concat(members)
      .concat(this.input.slice(idx));
  });
};

ModelPrototype.replaceClassMembersWithClassInInput = function(
  classes,
  classMembers
) {
  classes.forEach(cls => {
    let members = DataService.classMembers(cls);

    intersection(this.input, members).forEach(n => {
      let idx = this.input.indexOf(n);
      this.input.splice(idx, 1);
      let cls = DataService.cellClass(n);
      if (!this.input.includes(cls)) {
        this.input.splice(idx, 0, cls);
      }
    });
  });

  intersection(this.input, classMembers).forEach(n => {
    let idx = this.input.indexOf(n);
    this.input.splice(idx, 1);
    let cls = DataService.cellClass(n);
    if (!this.input.includes(cls)) {
      this.input.splice(idx, 0, cls);
    }
  });
};

ModelPrototype.getValidInput = function(rawInput){
  return unique(rawInput).filter((nodeId, i, arr) => {
    let cellClass = DataService.cellClass(nodeId);
    let containsCellClass = arr.includes(cellClass);
    let isClass = DataService.isClass(nodeId);

    return !(!isClass && containsCellClass);
  });

};

ModelPrototype.setInputFromUrlState = function(rawInput){

  let validInput = this.getValidInput(rawInput);
  let previousValidInput = this.getValidInput(this.input);
  let newValidInput = difference(validInput, previousValidInput);

  // Emit notification if input contains hidden post-embryonic nodes or nodes only present in
  // other datasets.
  if (!this.showPostemb) {
    let newPostEmbInput = newValidInput
      .filter(nodeId => !DataService.isEmb(nodeId))
      .map(n => DataService.getDisplayName(n));
    let allPostEmbInput = validInput
      .filter(nodeId => !DataService.isEmb(nodeId))
      .map(n => DataService.getDisplayName(n));

    if (newPostEmbInput.length > 0) {
      this.emit('warning', {
        id: 'postemb',
        message: 'Enable post-embryonic cells to show {0}.',
        arr: allPostEmbInput
      });
    }
  }

  if (this.database !== 'complete') {
    let newInputsNotInDataset = newValidInput.filter(nodeId => {
      let nodeIdInDatabase = !DataService.exists(nodeId, this.database);
      let nodeIdExistsElsewhere = DataService.existsElsewhere(nodeId);

      return nodeIdInDatabase && nodeIdExistsElsewhere;
    });

    let allInputsNotInDataset = validInput
      .filter(nodeId => {
        let nodeIdInDatabase = !DataService.exists(nodeId, this.database);
        let nodeIdExistsElsewhere = DataService.existsElsewhere(nodeId);

        return nodeIdInDatabase && nodeIdExistsElsewhere;
      })
      .map(n => DataService.getDisplayName(n));

    let newInputsWithConnectionsElsewhere = newValidInput.filter(nodeId =>
      DataService.hasConnectionsElsewhere(nodeId, this.database)
    );

    let allInputsWithConnectionsElsewhere = validInput
      .filter(nodeId =>
        DataService.hasConnectionsElsewhere(nodeId, this.database)
      )
      .map(n => DataService.getDisplayName(n));

    if (newInputsNotInDataset.length > 0) {
      this.emit('warning', {
        id: 'notindataset',
        message:
          '{0} ' +
          (allInputsNotInDataset.length > 1 ? 'are' : 'is') +
          ' not in the ' +
          this.database +
          ' datasets.',
        arr: allInputsNotInDataset
      });
    }

    if (newInputsWithConnectionsElsewhere.length > 0) {
      this.emit('info', {
        id: 'connectionsElsewhere',
        message:
          'Some of the inputted neurons might have additional connections outside the ' +
          'selected ' +
          this.database +
          ' datasets ({0}).',
        arr: allInputsWithConnectionsElsewhere
      });
    }
  }

  // If input is an individual cell, ensure that other members of the same class are split.
  validInput.forEach(nodeId => {
    let isCellClass = DataService.isClass(nodeId);
    let isCellClassMember = !isCellClass;
    let cellClass = DataService.cellClass(nodeId);

    if (isCellClass && this.cellClassIsSplit(nodeId)) {
      this.unsplitClass(nodeId);
    }

    if (isCellClassMember && !this.cellClassIsSplit(cellClass)) {
      this.splitClass(cellClass);
    }
  });

  this.input = validInput;
};

// set input from when the user changes it
ModelPrototype.setInput = function(rawInput) {

  // call the base set input functino
  this.setInputFromUrlState(rawInput);

  let validInput = this.getValidInput(rawInput);

  let groupIds = validInput
  .filter(nodeId => this.isGroupMember(nodeId))
  .map(nodeId => this.getGroupByMemberId(nodeId))
  .map(group => group.id);

  this.unhide(validInput.concat(groupIds));

  groupIds.forEach(groupId => this.openGroup(groupId));
};

module.exports = ModelPrototype;
