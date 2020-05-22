const { intersection, unique, prettyPrintArray } = require('../util');

const EventEmitter = require('../EventEmitter');
const Tour = require('./tour');

const DataService = require('../data-service');

let bindInfoNotificationEvents = ({ model, view }) => {
  view.popup.on('popupDenied', () => {
    model.emit('info', {
      id: 'popupNotAllowed',
      message: 'Select nodes before the popup menu can appear.'
    });
  });

  view.cookies.on('copySuccess', url => {
    model.emit('info', {
      id: 'copySuccess',
      message:
        'A link to this network has been copied to your clipboard. ' +
        '<input value="' +
        url +
        '" />'
    });
  });

  view.cookies.on('copyError', url => {
    model.emit('info', {
      id: 'copyError',
      message: 'Link to this network: <input value="' + url + '" />'
    });
  });
};

let bindSearchbarEvents = ({ model, view }) => {
  view.searchbar.on('inputChanged', inputs => {
    let previousInput = model.input;
    model.setInput(inputs);
    let currentInput = model.input;
    if (previousInput.toString() == currentInput.toString()) {
      return;
    }
    if (
      currentInput.length === 0 ||
      (previousInput.length === 1 && currentInput.length === 1)
    ) {
      model.clear();
    }
    model.updateNetwork();
  });

  view.options.on('closeSettings', () => {
    if (view.searchbar.getInputs().length === 0) {
      view.searchbar.focus();
    }
  });

  // Run loading wheel when
  model.on('networkUpdate', () => view.searchbar.showLoadingWheel());

  view.graph.on('layoutstop', () => view.searchbar.hideLoadingWheel());
};

let bindOptionsEvents = ({ view, model, controller }) => {
  view.options
    .on('setDatabase', database => {
      model.clear();
      model.setDatabase(database);
      var datasets = view.options.getSelectedDatasets();
      model.setDatasets(datasets);
      model.updateNetwork();
    })
    .on('setDatasets', datasets => {
      model.setDatasets(datasets);
      model.updateNetwork();
    })
    .on('setNodeColor', mode => {
      model.setNodeColor(mode);
      model.updateNetwork('minor');
      view.graph.setHighlighted(model.input, model.selected, model.legendItems);
    })
    .on('setThresholdChemical', threshold => {
      model.setThresholdChemical(threshold);
      model.updateNetwork();
    })
    .on('setThresholdElectrical', threshold => {
      model.setThresholdElectrical(threshold);
      model.updateNetwork();
    })
    .on('setLayout', layout => {
      let groupMemberPositions = model
        .getGroupMembers()
        .filter(m => model.positionExists(m))
        .map(m => ({ id: m, p: model.getPosition(m) }));

      view.graph.one('layoutstop', () => {
        groupMemberPositions.forEach(pos => {
          let { id, p } = pos;
          model.setPosition(id, p);
        });
        model.updateNetwork('', false);
      });

      model.setLayout(layout);
      model.closeAllGroups();
      model.removePositions();
      model.updateNetwork();
    })
    .on('setShowLinked', checked => {
      model.setShowLinked(checked);
      model.updateNetwork();
    })
    .on('setShowIndividual', checked => {
      model.setShowIndividual(checked);
      model.updateNetwork();
    })
    .on('setShowEdgeLabel', checked => {
      model.setShowEdgeLabel(checked);
      model.updateNetwork('minor');
    })
    .on('setShowPostemb', checked => {
      model.setShowPostemb(checked);
      model.updateNetwork();
    })
    .on('setShowConnectionColor', checked => {
      model.setShowConnectionColor(checked);
      model.updateNetwork('minor');
    })
    .on('refreshLayout', () => {
      let groupMemberPositions = model
        .getGroupMembers()
        .filter(m => model.positionExists(m))
        .map(m => ({ id: m, p: model.getPosition(m) }));

      view.graph.one('layoutstop', () => {
        groupMemberPositions.forEach(pos => {
          let { id, p } = pos;
          model.setPosition(id, p);
        });
        model.updateNetwork('', false);
      });

      model.closeAllGroups();
      model.removePositions();
      model.updateNetwork();
    })
    .on('saveNetworkAsImage', () => {
      let legendItems = view.legend.getVisible();
      view.graph.createCytoscapeLegend(legendItems);
      let tz = new Date().getTimezoneOffset() * 60000;
      let time = new Date(Date.now() - tz)
        .toISOString()
        .slice(0, -5)
        .replace(/:/g, '-')
        .replace('T', '_');

      view.graph.saveAsPNG('NemaNode.org_' + time + '.png');
      view.graph.removeCytoscapeLegend();
    })
    .on('copyLinkToNetwork', () => {
      view.cookies.generateURL(controller.getState());
    });
};

let bindPopupMenuEvents = ({ model, view }) => {
  view.popup
    .on('viewTrajectory', () => {
      /*let selectedNodes = model.getSelected();
      let classNodes = selectedNodes.filter(node => DataService.isClass(node));
      let classMemberNodes = selectedNodes.filter(node =>
        DataService.isCell(node)
      );
      let mappedClassMemberNodes = classNodes
        .map(classNode => DataService.classMembers(classNode))
        .reduce((acc, curVal) => acc.concat(curVal), []);

      let nextInput = unique(classMemberNodes.concat(mappedClassMemberNodes));

      if( model.database !== 'head' ){
        let datasetNames = model.datasets.map( datasetId => DataService.getDatasetById( datasetId ).name );
        let datasetWarningLabel = prettyPrintArray( datasetNames );

        model.emit('warning', {
          id: `nt-only-head-datasets`,
          message: `Only zhen lab head datasets contain 3D visualizations of cells and neurons.  The ${datasetWarningLabel} datasets do not have 3D visualizations`,
          arr: []
        });
      } else {
        let selectedDatasetsWithoutTrajectory = intersection( DataService.datasets.filter(d => !d.hasTrajectory && d.type === 'head'), model.datasets );
        let datasetWarningLabel = prettyPrintArray( selectedDatasetsWithoutTrajectory );

        if( selectedDatasetsWithoutTrajectory.length > 0 ){
          model.emit('warning', {
            id: `nt-only-head-datasets`,
            message: `Only zhen lab head datasets contain 3D visualizations of cells and neurons.  The ${datasetWarningLabel} datasets do not have 3D visualizations`,
            arr: []
          });
        }
      }

      view.ntv.view.isOpen = true;
      view.ntv.view.input = nextInput;*/
    })
    .on('openGroup', () => {
      model.openSelectedGroups();
      model.updateNetwork('minor');
    })
    .on('closeGroup', () => {
      model.closeSelectedGroups();
      model.updateNetwork('minor');
    })
    .on('renameGroup', () => {
      let groupId = model.selected[0];
      view.graph.startNamingGroup(groupId);
    })
    .on('info', () => {
      view.info.open();
      view.info.show();
    })
    .on('hide', () => {
      let previousInput = model.input.slice();
      model.hideSelected();
      let currentInput = model.input;

      if (previousInput.toString() !== currentInput.toString()) {
        view.searchbar.setInput(currentInput);
      }

      if (currentInput.length === 0) {
        view.searchbar.focus();
        model.clear();
      }

      model.updateNetwork();
    })
    .on('grow', () => {
      // Promise required since a database query is needed to grow the network.
      let previousInput = model.input.slice();

      model.growSelected().then(() => {
        let currentInput = model.input;
        if (previousInput.toString() == currentInput.toString()) {
          return;
        }

        view.searchbar.setInput(currentInput);
        model.updateNetwork();
      });
    })
    .on('deselect', () => view.graph.removeSelection())
    .on('join', () => {
      let previousInput = model.input.slice();
      model.joinSelected();
      let currentInput = model.input;

      if (previousInput.toString() !== currentInput.toString()) {
        view.searchbar.setInput(currentInput);
      }

      model.updateNetwork('minor');
    })
    .on('split', () => {
      let previousInput = model.input.slice();
      model.splitSelected();
      let currentInput = model.input;

      if (previousInput.toString() !== currentInput.toString()) {
        view.searchbar.setInput(currentInput);
      }

      model.updateNetwork('minor');
    })
    .on('group', () => {
      model.groupSelected();
      model.updateNetwork('minor');
    })
    .on('ungroup', () => {
      model.ungroupSelected();
      model.updateNetwork('minor');
    })
    .on('alignLeft', () => view.graph.align('left'))
    .on('alignRight', () => view.graph.align('right'))
    .on('alignTop', () => view.graph.align('top'))
    .on('alignBottom', () => view.graph.align('bottom'))
    .on('distributeHorizontally', () => view.graph.align('horizontal'))
    .on('distributeVertically', () => view.graph.align('vertical'))
    .on('selectAll', () => view.graph.setSelected(view.graph.getNodes()));
};

let bindHelpEvents = ({ view, controller }) => {
  let tour = new Tour(view, controller);

  let hideImmatureTour = () =>
    tour.isRunning() && tour.atFirstStep() ? tour.stop() : null;
  let showImmatureTour = () => (tour.atFirstStep() ? tour.start() : null);

  view.help
    .on('startTour', function() {
      view.help.hide();
      controller.hideOpenUI();
      tour.start();
    })
    .on('endTour', function() {
      controller.hideOpenUI();
      tour.end();
    })
    .on('nextTourStep', function() {
      tour.nextStep();
    });

  view.searchbar.on('inputChanged focusin', inputs => {
    inputs.length === 0 ? showImmatureTour() : hideImmatureTour();
  });

  view.options.on('openSettings', () => hideImmatureTour());
  view.graph.on('backgroundClick', () => hideImmatureTour());
};

let bindHiddenEvents = ({ view, model }) => {
  view.hidden.on('selectionChanged', selected => {
    model.unhide(selected);
    model.updateNetwork();
  });
};

let bindNetworkEvents = ({ model, view }) => {
  view.graph
    .on('groupNamed', ({ id, name }) => model.setGroupName(id, name))
    .on('tapstart', () => view.searchbar.blur())
    .on('backgroundClick', () => {
      view.searchbar.blur();
      view.legend.removeHighlighted();
      view.graph.removeHighlighted();
      view.graph.removeSelection();
      view.options.hide();
      view.info.hide();
      view.info.close();
      view.help.hide();
      view.hidden.close();
      //view.ntv.view.isOpen = false;
    })
    .on('edgeSelected', edgeId => {
      let edgeIdTokens = edgeId.split('-');
      let sourceId = edgeIdTokens[0];
      let targetId = edgeIdTokens[2];
      let rawNodeIds = [];
      let nextInput = [];

      [sourceId, targetId].forEach(id => {
        if (model.isGroup(id)) {
          rawNodeIds = rawNodeIds.concat(model.getGroupMembersByGroup(id));
        } else {
          rawNodeIds.push(id);
        }
      });

      rawNodeIds.forEach(id => {
        if (DataService.isClass(id)) {
          nextInput = nextInput.concat(DataService.classMembers(id));
        } else {
          nextInput = nextInput.concat(id);
        }
      });

      //view.ntv.view.isOpen = true;
      //view.ntv.view.input = nextInput;
    })
    .on('layoutstop aligned', positions => model.setPositions(positions))
    .on('nodeDragged', positions => model.lockPositions(positions))
    .on('selectionChanged layoutstop', () => {
      model.setSelected(view.graph.getSelected());
      view.graph.setHighlighted(model.input, model.selected, model.legendItems);

      // Update popup menu options.
      if (model.selected.length == 0) {
        view.popup.preventActions(['all']);
        return;
      }

      let actionsToPrevent = {
        openGroup: !model.canBeOpened(model.selected),
        closeGroup: !model.canBeClosed(model.selected),
        renameGroup: !model.canBeRenamed(model.selected),
        join: !model.canBeJoined(model.selected),
        split: !model.canBeSplit(model.selected),
        group: !model.canBeGrouped(model.selected),
        ungroup: !model.canBeUngrouped(model.selected)
      };

      view.popup.preventActions(
        Object.keys(actionsToPrevent).filter(action => actionsToPrevent[action])
      );
    });
};

let bindLegendEvents = ({ model, view }) => {
  view.legend
    .on('highlightChanged', legendItems => model.setLegendItems(legendItems))
    .on('highlightClicked', () => {
      let { input, selected, legendItems } = model;

      view.graph.setHighlighted(input, selected, legendItems);
    });
};

class Controller extends EventEmitter {
  constructor(model, view) {
    super();

    this.model = model;
    this.view = view;

    bindInfoNotificationEvents({ model, view });
    bindSearchbarEvents({ model, view });
    bindOptionsEvents({ model, view, controller: this });
    bindPopupMenuEvents({ model, view });
    bindHelpEvents({ view, controller: this });
    bindHiddenEvents({ model, view });
    bindNetworkEvents({ model, view });
    bindLegendEvents({ model, view });
  }

  setState(state, fromUrl=false) {
    let { model, view } = this;

    model.clear();

    // Load parameters or set default values.
    let database = state['database'] || 'head';
    let allDatasets = DataService.getDatasetList(database);
    let datasets = intersection(allDatasets, state['datasets'] || []);
    datasets = datasets.length > 0 ? datasets : allDatasets;
    let nodeColor = state['nodeColor'] || 'type';
    let layout = state['layout'] || 'concentric';
    let thresholdChemical = state['thresholdChemical'] || 3;
    let thresholdElectrical = state['thresholdElectrical'] || 2;
    let showLinked =
      state['showLinked'] !== undefined ? state['showLinked'] : true;
    let showIndividual =
      state['showIndividual'] !== undefined ? state['showIndividual'] : false;
    let showEdgeLabel =
      state['showEdgeLabel'] !== undefined ? state['showEdgeLabel'] : false;
    let showPostemb =
      state['showPostemb'] !== undefined ? state['showPostemb'] : true;
    let input = state['input'] || [];
    let legendItems = state['legendItems'] || [];
    let showConnectionColor = 
      state['showConnectionColor'] !== undefined ? state['showConnectionColor'] : true;

    // Set view first, so events emitted from the model are triggered correctly.
    view.searchbar.setInput(input);
    view.options.selectOption(database);
    view.options.selectDatasets(datasets);
    view.options.selectOption(nodeColor);
    view.options.selectOption(layout);
    view.options.setInput('threshold-chm', thresholdChemical);
    view.options.setInput('threshold-gj', thresholdElectrical);
    view.options.checkOption('show-linked', showLinked);
    view.options.checkOption('show-indiv-cells', showIndividual);
    view.options.checkOption('show-edge-num', showEdgeLabel);
    view.options.checkOption('show-postemb', showPostemb);
    view.options.checkOption('show-connection-color', showConnectionColor);

    // Update model.
    model.setDatabase(database);
    model.setDatasets(datasets);
    model.setNodeColor(nodeColor);
    model.setLayout(layout);
    model.setThresholdChemical(thresholdChemical);
    model.setThresholdElectrical(thresholdElectrical);
    model.setShowLinked(showLinked);
    model.setShowIndividual(showIndividual);
    model.setShowEdgeLabel(showEdgeLabel);
    model.setShowPostemb(showPostemb);
    model.setShowConnectionColor(showConnectionColor);
    model.setPositionsFromArray(state['coordinates'] || []);
    model.setSplit(state['split'] || []);
    model.setJoined(state['join'] || []);
    model.setGroups(state['groups'] || []);
    fromUrl ? model.setInputFromUrlState(input) : model.setInput(input);
    model.setHidden(state['hidden'] || []);
    model.setSelected(state['selected'] || []);
    model.setLegendItems(legendItems);

    if (model.input.length === 0) {
      return;
    }

    view.graph.one('layoutstop', () => {
      view.legend.setHighlighted(legendItems);
      view.legend.emit('highlightClicked'); //TODO: this is a hack  
    });

    // Load the graph.
    if (state['coordinates']) {
      model.updateNetwork('minor');
    } else {
      model.updateNetwork();
    }
  }

  getState() {
    let { model, view } = this;
    let nodes = view.graph.getNodes();
    let state = model.getState(nodes);

    return state;
  }

  hideOpenUI() {
    let { view } = this;
    view.options.hide();
    view.info.hide();
    view.info.close();
    view.popup.hide();
    view.legend.close();
  }
}

module.exports = Controller;
