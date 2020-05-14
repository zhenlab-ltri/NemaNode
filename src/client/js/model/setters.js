const DataService = require('../data-service');

const { difference, union, unique } = require('../util');

let ModelPrototype = {};

ModelPrototype.setDatabase = function(databaseNew) {
  this.database = databaseNew;
  DataService.setDatasetType(this.database);
  this.emit('databaseChanged', this.database);
  // Give warning if input contains cells outside network.
  this.setInput(this.getInput());
};

ModelPrototype.setDatasets = function(datasetsNew) {
  this.datasets = datasetsNew;
  this.datasets.sort((d0, d1) => {
    let d0Time = DataService.getDatasetInfo(this.database, d0).visual_time;
    let d1Time = DataService.getDatasetInfo(this.database, d1).visual_time;

    return d0Time - d1Time;
  });

  // If the complete adult legacy dataset is selected, individual muscle cells should be joined.
  if (this.datasets.includes(DataService.getAdultCompleteDataset().id)) {
    this.emit('joinLegacyCells', DataService.legacyCellToClass);
  }
  this.emit(
    'validNodesChanged',
    DataService.getValidNodes(this.showIndividual, this.database, this.datasets)
  );
  this.emit('datasetsChanged', this.datasets);
};

ModelPrototype.setNodeColor = function(newNodeColor) {
  this.nodeColor = newNodeColor;
  this.emit('nodeColorChanged', this.nodeColor);
};

ModelPrototype.setLayout = function(newLayout) {
  this.layout = newLayout;
  this.emit('layoutChanged', this.layout);
};

ModelPrototype.setThresholdChemical = function(threshold) {
  this.thresholdChemical = threshold;
  this.emit('chemicalThresholdChanged', threshold);
};

ModelPrototype.setThresholdElectrical = function(threshold) {
  this.thresholdElectrical = threshold;
  this.emit('electricalThresholdChanged', threshold);
};

ModelPrototype.setShowLinked = function(checked) {
  this.showLinked = checked;
  this.emit('showLinkedChanged', checked);
};

ModelPrototype.setShowIndividual = function(checked) {
  this.showIndividual = checked;
  this.emit('showIndividualChanged', checked);
  this.emit(
    'validNodesChanged',
    DataService.getValidNodes(checked, this.database, this.datasets)
  );
};

ModelPrototype.setShowEdgeLabel = function(checked) {
  this.showEdgeLabel = checked;
  this.emit('showEdgeLabelChanged', checked);
};

ModelPrototype.setShowConnectionColor = function(checked){
  this.showConnectionColor = checked;
  this.emit('showConnectionColorChanged', checked);
};

ModelPrototype.setShowPostemb = function(checked) {
  this.showPostemb = checked;
  // Give warning if input contains post-embryonic cells.
  if (!this.showPostemb) {
    this.setInput(this.getInput());
  }
  this.emit('showPostembChanged', checked);
};

ModelPrototype.setLegendItems = function(newLegendItems) {
  this.legendItems = newLegendItems;
  this.emit('legendItemsChanged', this.legendItems);
};

module.exports = ModelPrototype;
