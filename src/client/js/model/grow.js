const services = require('../services');
const DataService = require('../data-service');

const { difference, unique, flatten } = require('../util');

let ModelPrototype = {};

ModelPrototype.growNetwork = function(toAdd, newConnections) {
  let neighbors = [];

  newConnections.forEach(connection => {
    let pre = connection['pre'].toUpperCase();
    let post = connection['post'].toUpperCase();

    [pre, post].forEach(n => {
      if (this.showIndividual && !DataService.isCell(n)) {
        return;
      }
      if (!this.showIndividual && !DataService.isClass(n)) {
        return;
      }
      neighbors.push(n);
    });

    toAdd = unique(neighbors);

    toAdd = difference(
      toAdd,
      unique([
        ...this.getInput(),
        ...this.getInput().map(n => DataService.cellClass(n)),
        ...flatten(this.getInput().map(n => DataService.classMembers(n)))
      ])
    );

    this.addInput(toAdd);
    this.unhide(toAdd);
  });
};

ModelPrototype.growSelected = function() {
  let toAdd = this.getSelected();

  if (this.showLinked) {
    toAdd = difference(toAdd, this.getInput());
    this.addInput(toAdd);
    this.unhide(toAdd);

    return Promise.resolve();
  }

  return services
    .getNematodeConnections({
      cells: toAdd,
      datasetType: this.database,
      datasetIds: this.datasets,
      thresholdChemical: this.thresholdChemical,
      thresholdElectrical: this.thresholdElectrical,
      includeNeighboringCells: true,
      includeAnnotations: false
    })
    .then(connections => this.growNetwork(toAdd, connections));
};

module.exports = ModelPrototype;
