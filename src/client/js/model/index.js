const EventEmitter = require('../EventEmitter');
const services = require('../services');
const DataService = require('../data-service');

const modelToCytoscape = require('./cytoscape-adaptor');
const summary = require('./summary');
const setters = require('./setters');
const { positionModule } = require('./position');
const splitJoin = require('./split-join');
const input = require('./input');
const hide = require('./hidden');
const grow = require('./grow');
const groups = require('./groups');
const selected = require('./selected');

class Model extends EventEmitter {
  constructor(cy) {
    super();
    this.cy = cy;

    this.legendItems = [];

    this.input = [];
    this.selected = [];
    this.hidden = [];

    this.split = [];
    this.joined = [];

    this.groups = {};
    this.parent = {}; // should only be used by the groups module, no other module should not access this directly

    this.positions = {};
    this.lockedPositions = [];

    // bind all the submodules to the main module
    [
      modelToCytoscape,
      summary,
      setters,
      positionModule,
      splitJoin,
      hide,
      input,
      grow,
      groups,
      selected
    ].forEach(modelModule => {
      Object.entries(modelModule).forEach(method => {
        let [methodName, methodImpl] = method;
        this[methodName] = methodImpl.bind(this);
      });
    });
  }


  updateNetwork(updateType = '', runLayout = true) {
    this.emit('networkUpdate');

    let validInput = this.input.filter(input =>
      DataService.exists(input, this.database)
    );

    let params = {
      database: this.database,
      datasets: this.datasets,
      input: validInput,
      selected: this.selected,
      showLinked: this.showLinked,
      showPostemb: this.showPostemb,
      showIndividual: this.showIndividual,
      split: this.split,
      joined: this.joined,
      hidden: this.hidden,
      groups: this.groups,
      nodeColor: this.nodeColor,
      showEdgeLabel: this.showEdgeLabel,
      showAnnotations: this.showAnnotations,
      positions: this.positions,
      lockedPositions: this.lockedPositions,
      layout: this.layout
    };

    if (validInput.length === 0) {
      this.emit(
        'networkChanged',
        this.convertModelToCytoscape([], updateType, params, runLayout)
      );
      return Promise.resolve();
    }

    return services
      .getNematodeConnections({
        cells: validInput,
        datasetType: this.database,
        datasetIds: this.datasets,
        thresholdChemical: this.thresholdChemical,
        thresholdElectrical: this.thresholdElectrical,
        includeNeighboringCells: this.showLinked,
        includeAnnotations: true
      })
      .then(data => {
        let connections = data;
        this.emit(
          'networkChanged',
          this.convertModelToCytoscape(
            connections,
            updateType,
            params,
            runLayout
          )
        );
      });
  }

  clear() {
    this.selected = [];
    this.setHidden([]);
    this.split = [];
    this.joined = [];
    this.setGroups([]);
    this.positions = {};
    this.lockedPositions = [];
  }

  getState(nodes) {
    let state = {
      database: this.database,
      datasets: this.datasets.slice(),
      nodeColor: this.nodeColor,
      layout: this.layout,
      thresholdChemical: this.thresholdChemical,
      thresholdElectrical: this.thresholdElectrical,
      showLinked: this.showLinked,
      showIndividual: this.showIndividual,
      showEdgeLabel: this.showEdgeLabel,
      showPostemb: this.showPostemb,
      showAnnotations: this.showAnnotations,
      input: this.input.slice(),
      hidden: this.hidden.slice(),
      split: this.split.slice(),
      join: this.joined.slice(),
      selected: this.selected.slice(),
      legendItems: this.legendItems.slice()
    };

    state.groups = this.getGroups();

    state.coordinates = [];

    let nodesInNetwork = [];
    nodes.forEach(n => {
      if (this.isGroup(n)) {
        let group = this.getGroupById(n);

        nodesInNetwork = nodesInNetwork.concat(group.members);

        if (!group.open) {
          nodesInNetwork.push(n);
        }
      } else {
        nodesInNetwork.push(n);
      }
    });

    for (let nodeId in this.positions) {
      if (this.lockedPositionsExist() && !this.nodePositionIsLocked(nodeId)) {
        continue;
      }

      if (!nodesInNetwork.includes(nodeId)) {
        continue;
      }

      state.coordinates.push({
        id: nodeId,
        x: parseInt(this.getPosition(nodeId).x, 10),
        y: parseInt(this.getPosition(nodeId).y, 10)
      });
    }

    return state;
  }
}

module.exports = Model;
