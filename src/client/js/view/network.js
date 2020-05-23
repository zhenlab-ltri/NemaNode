const cytoscape = require('cytoscape');
const $ = require('jquery');
const debounce = require('lodash.debounce');

const { max, min, isEmpty } = require('../util');

const View2 = require('./base-view');
const cystyle = require('./network-style');

const DataService = require('../data-service');

class GraphView extends View2 {
  constructor(model) {
    super();

    this.model = model;

    this.$container = $('#cy');
    this.$inputContainer = $('#cy-input-container');
    this.$input = $('#cy-input');

    this.nodeDragged = false;

    this.animateLayout = true;

    this.cy = cytoscape({
      container: this.$container,
      boxSelectionEnabled: true,
      motionBlur: true,
      selectionType: 'additive',
      style: cystyle.stylesheet,
      minZoom: 0.2,
      maxZoom: 1
    });

    // SVGs won't show in cytoscape on Edge.
    if (window.navigator.userAgent.indexOf('Edge/') !== -1) {
      this.cy
        .style()
        .selector('node.searchedfor')
        .style({
          'background-image': 'none'
        })
        .update();
    }

    this.cy.on('layoutstop', () => {
      this.emit('layoutstop', this.getPositions('all'));
    });

    // Emit tap start before triggering any events.
    this.cy.on('tapstart cxttapstart', () => this.emit('tapstart'));

    // Emit when clicked on background.
    this.cy.on('tap', e => {
      if (e.target === this.cy) {
        this.emit('backgroundClick');
      }
    });

    // Select change.
    this.cy.on('select unselect', 'node', () =>
      this.emit('selectionChanged', this.getSelected())
    );

    // Edge hover.
    this.cy.on('mouseover', 'edge', e => e.target.addClass('hover'));

    this.cy.on('mouseout', 'edge', e => {
      e.target.removeClass('hover');
      e.target.removeClass('focus');
    });

    this.cy.on('click', 'edge', e => e.target.toggleClass('focus'));

    // Emit selected edge when clicking
    this.cy.on('click', 'edge', e => {
      let edge = e.target;
      this.emit('edgeSelected', edge.id());
    });

    // Ensure parents and children aren't selected at the same time.
    this.cy.on('select', e => {
      let node = e.target;

      if (node.isParent()) {
        node.children().unselect();
      }

      if (node.isChild()) {
        node.parent().unselect();
      }
    });

    // Ensure open groups aren't selected by the select box.
    this.cy.on('tapstart cxttapstart', () =>
      this.cy.nodes(':parent').selectify()
    );

    this.cy.on('boxstart', () => this.cy.nodes(':parent').unselectify());

    // Update nodes when moved. The 'free' event trigger on every click, so we have to manually
    // check that something was dragged.
    this.cy.on('drag', 'node', () => (this.nodeDragged = true));
    this.cy.on('free', 'node', e => {
      if (this.nodeDragged) {
        let freed = e.target;

        if (freed.selected()) {
          freed = this.cy.nodes(':selected');
        }

        freed = freed.union(freed.children());
        freed.removeClass('unpositioned');

        this.emit('nodeDragged', this.getPositions());
      }

      this.nodeDragged = false;
    });

    // Redraw gap junction segments when connecting nodes are moved in 100 ms interval.
    this.cy.on(
      'position',
      'node.gjConnected',
      debounce(() => this.correctGjSegments(), 100)
    );

    // Select nodes on right-click. cxttapstart is used instead of cxttap to
    // ensure selection before opening the context menu.
    this.cy.on('cxttapstart', 'node', e => {
      let node = e.target;

      if (!node.selected()) {
        this.cy.elements().unselect();
        node.select();
      }
    });

    model.on('networkChanged', networkElements => {
      let cy = this.cy;
      let { nodes: newNodes, edges: newEdges, runLayout } = networkElements;

      if (
        isEmpty(networkElements.nodes) &&
        isEmpty(networkElements.edges) &&
        isEmpty(networkElements.hidden) &&
        cy.elements().empty()
      ) {
        this.cy.emit('layoutstop');
        return;
      }

      this.one('layoutstop', () => this.correctGjSegments());

      let nodesInNetwork = cy.nodes().filter(n => newNodes[n.id()] != null);
      let previousPositions = {};
      nodesInNetwork.forEach(n => (previousPositions[n.id()] = n.position()));

      Object.keys(newNodes).forEach(nId => {
        if (cy.getElementById(nId).empty()) {
          newNodes[nId].position = { x: cy.width() / 2, y: cy.height() / 2 };
        }
      });

      Object.keys(previousPositions).forEach(nodeId => {
        newNodes[nodeId].position = previousPositions[nodeId];
      });

      // Prettify node names.
      Object.keys(newNodes).forEach(nodeId => {
        let nodeDisplayName = DataService.getDisplayName(
          newNodes[nodeId].data.name
        );
        newNodes[nodeId].data.name = nodeDisplayName;
      });

      cy.remove('*');
      cy.add(Object.values(newNodes));
      cy.add(Object.values(newEdges));

      console.log(newEdges)

      cy.startBatch();
      // Label edges parallel to gap junctions to prevent overlaps.
      cy.edges().removeClass('besideGj');
      cy.edges('[type = 2]')
        .parallelEdges()
        .filter('[type != 2]')
        .addClass('besideGj');

      // Label nodes connected with gap junctions in order to efficiently update gap junction edges
      // that are stretched/shrinked as the node moves.
      cy.nodes().removeClass('gjConnected');
      cy.edges('[type = 2]')
        .not(':loop')
        .connectedNodes()
        .addClass('gjConnected');

      this.correctGjSegments();

      cy.endBatch();

      if (runLayout) {
        this.updateLayout(networkElements.positions, networkElements.layout);
      } else {
        this.emit('layoutstop', () => this.getPositions('all'));
      }
    });

    model.on('groupCreated', groupId => {
      this.one('layoutstop', () => this.startNamingGroup(groupId));
    });
  }

  getPositions(selector = 'all') {
    let positions = {};
    let nodes = this.cy.nodes();

    if (selector !== 'all') {
      nodes = this.cy.nodes().not('.unpositioned');
    }

    nodes.forEach(node => (positions[node.id()] = node.position()));

    return positions;
  }

  enableAnimations() {
    this.animateLayout = true;
  }

  disableAnimations() {
    this.animateLayout = false;
  }

  getSelected() {
    return this.cy.nodes(':selected').map(n => n.id());
  }

  getNodes() {
    return this.cy.nodes().map(n => n.id());
  }

  getPosition(nodeId) {
    return this.cy.getElementById(nodeId).position();
  }

  getBoundingBox(nodeIds) {
    return this.cy.filter('#' + nodeIds.join(',#')).renderedBoundingBox();
  }

  scaleCoordinatesToViewport(coordinates) {
    let { $container } = this;
    let w = $container.width();
    let h = $container.height();
    let windowSize = Math.min(w, h);

    coordinates.forEach(coordinate => {
      coordinate['x'] = coordinate['x'] * windowSize * 0.8;
      coordinate['y'] = coordinate['y'] * windowSize * 0.8;
    });

    return coordinates;
  }

  setSelected(nodeIds) {
    this.cy.elements().unselect();

    if (nodeIds.length > 0) {
      this.cy.nodes('#' + nodeIds.join(',#')).select();
    }
  }

  setPosition(node, position, duration) {
    this.cy.getElementById(node).animate({
      position,
      duration
    });
  }

  removeHighlighted() {
    this.cy.elements().removeClass('faded');
  }

  pan(xPan, yPan) {
    let { x, y } = this.cy.pan();

    this.cy.pan({
      x: x + xPan,
      y: y + yPan
    });
  }
  
  toggleSmallEdgeLabel(id, check) {
    this.cy
    .getElementById(id)
    .toggleClass('showEdgeLabel', check)
    .toggleClass('focus', false);
  };

  toggleEdgeLabel(id, check) {
    if (id == 'all') {
      this.cy
        .edges()
        .toggleClass('showEdgeLabel', check)
        .toggleClass('focus', check);
    } else {
      this.cy
        .getElementById(id)
        .toggleClass('showEdgeLabel', check)
        .toggleClass('focus', check);
    }
  }

  removeSelection() {
    this.cy.nodes().unselect();
  }

  setHighlighted(inputIds, selectedIds, legendHighlights) {
    let { cy } = this;

    // Remove all highlights and return if nothing is selected and no legend item activated.
    this.removeHighlighted();
    if (selectedIds.length === 0 && legendHighlights.length === 0) {
      return;
    }

    // Use selected nodes as source if present, otherwise use input nodes.
    let sourceIds = selectedIds.length ? selectedIds : inputIds;
    let sourceNodes = cy.collection();

    sourceIds.forEach(id => {
      let node = cy.getElementById(id);

      if (node.isParent()) {
        sourceNodes = sourceNodes.union(node.children());
      } else {
        sourceNodes = sourceNodes.union(node);
      }
    });

    // Filter network by edges, as set by legend.
    let edgeSel = 'edge';
    legendHighlights.forEach(highlight => {
      let list = highlight.split('-')[0];
      let type = highlight.substr(highlight.indexOf('-') + 1);

      if (list == 'edge') {
        if (type.includes('typ')) {
          edgeSel += '[type=' + type.slice(-1) + ']';
        } else {
          edgeSel += '.' + type;
        }
      }
    });

    let connectedNodes = sourceNodes.neighborhood(edgeSel).connectedNodes();

    // Filter network by nodes, as set by legend.
    legendHighlights.forEach(highlight => {
      let list = highlight.split('-')[0];
      let type = highlight.split('-')[1];

      if (['type', 'nt'].includes(list)) {
        connectedNodes = connectedNodes.filter('[?' + type + ']');
      }
    });

    // Filter to the neighborhood of the selected nodes.
    if (selectedIds.length > 0) {
      let allowedNodes = cy.collection();

      for (let i = 0; i < sourceNodes.length; i++) {
        let sourceNode = sourceNodes[i];
        let nodes = sourceNode.neighborhood(edgeSel).connectedNodes();

        if (i === 0) {
          allowedNodes = allowedNodes.union(nodes);
        } else {
          allowedNodes = allowedNodes.intersection(nodes);
        }
      }
      connectedNodes = connectedNodes.intersection(allowedNodes);
    }

    // Fade out any nodes and edges that were filtered out.
    let highlightedNodes = sourceNodes.union(connectedNodes);
    highlightedNodes = highlightedNodes.union(highlightedNodes.parents());

    let highlightedEdges = highlightedNodes.edgesWith(highlightedNodes);
    highlightedEdges = highlightedEdges.filter(edgeSel);

    cy.elements()
      .not(highlightedNodes)
      .not(highlightedEdges)
      .addClass('faded');
  }

  endNamingGroup(groupId) {
    let name = this.$input.text();
    this.$inputContainer.hide();

    this.cy.getElementById(groupId).data('name', name);

    this.emit('groupNamed', {
      id: groupId,
      name
    });
  }

  startNamingGroup(groupId) {
    let { cy, $input, $inputContainer } = this;
    let group = cy.getElementById(groupId);
    let pos = group.renderedPosition();
    let zoom = cy.zoom();
    let height = 22,
      width = 500;

    if (group.selected()) {
      $input.css('font-weight', 700);
    } else {
      $input.css('font-weight', 'normal');
    }

    if (group.isParent()) {
      $inputContainer.css('font-size', 18 * zoom + 'px');
      $input
        .css(
          'padding',
          [2 * zoom, 7 * zoom, 6 * zoom, 7 * zoom].join('px ') + 'px'
        )
        .css('border-radius', 6 * zoom + 'px')
        .css('background-color', '#d0d0d0');
      pos['y'] -= group.renderedOuterHeight() / 2 + (height + 4) * zoom;
    } else {
      $inputContainer.css('font-size', 22 * zoom + 'px');
      $input.css('background-color', 'transparent');
      pos['y'] -= (height * zoom) / 2 + 1;
    }

    $inputContainer
      .css('height', height * zoom + 'px')
      .css('line-height', height * zoom + 'px')
      .css('top', pos['y'])
      .css('left', pos['x'] - width / 2)
      .show();

    $input.text(group.data('name')).focus();

    // Select the text.
    let range = document.createRange();
    range.selectNodeContents($input[0]);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    group.data('name', '');

    let handler = e => {
      if (e.type == 'keydown') {
        if (e.keyCode !== 13 && e.keyCode !== 27) {
          //enter, esc
          return;
        }
      }

      if (e.type == 'mousedown' || e.type == 'touchstart') {
        if (e.target.id == 'cy-input') {
          return;
        }
      }
      this.endNamingGroup(groupId);
      $(document).off('keydown mousedown touchstart', handler);
      cy.off('zoom', handler);
    };

    $(document).on('keydown mousedown touchstart', handler);
    cy.on('zoom', handler);
  }

  align(alignType) {
    let selected = this.cy.nodes(':selected');
    selected = selected.add(selected.children());

    let xArr = selected.map(node => node.position('x'));
    let yArr = selected.map(node => node.position('y'));

    switch (alignType) {
      case 'left':
        selected.positions(node => {
          return {
            x: min(xArr),
            y: node.position('y')
          };
        });
        break;
      case 'right':
        selected.positions(node => {
          return {
            x: max(xArr),
            y: node.position('y')
          };
        });
        break;
      case 'top':
        selected.positions(node => {
          return {
            x: node.position('x'),
            y: min(yArr)
          };
        });
        break;
      case 'bottom':
        selected.positions(node => {
          return {
            x: node.position('x'),
            y: max(yArr)
          };
        });
        break;
      case 'horizontal':
        var xMin = min(xArr);
        var xMax = max(xArr);
        selected = selected.sort((a, b) => a.position('x') - b.position('x'));
        selected.positions((node, i) => {
          return {
            x: xMin + ((xMax - xMin) / (xArr.length - 1)) * i,
            y: node.position('y')
          };
        });
        break;
      case 'vertical':
        var yMin = min(yArr);
        var yMax = max(yArr);

        selected = selected.sort((a, b) => a.position('y') - b.position('y'));
        selected.positions((node, i) => {
          return {
            x: node.position('x'),
            y: yMin + ((yMax - yMin) / (yArr.length - 1)) * i
          };
        });
        break;
    }

    this.emit('aligned', this.getPositions('all'));
  }

  correctGjSegments(edgeSel = '[type=2]') {
    let { cy } = this;
    let edges = cy.edges(edgeSel).not(':loop');
    let disFactors = [-2.0, -1.5, -0.5, 0.5, 1.5, 2.0];

    cy.startBatch();

    edges.forEach(e => {
      let sourcePos = e.source().position();
      let targetPos = e.target().position();

      let length = Math.sqrt(
        Math.pow(targetPos['x'] - sourcePos['x'], 2) +
          Math.pow(targetPos['y'] - sourcePos['y'], 2)
      );

      let divider = (length > 60 ? 7 : length > 40 ? 5 : 3) / length;

      let segweights = disFactors
        .map(d => {
          return 0.5 + d * divider;
        })
        .join(' ');

      if (e.style('segment-weights') !== segweights) {
        e.style({ 'segment-weights': segweights });
      }
    });

    cy.endBatch();
  }

  // save png with legend
  saveAsPNG(filename) {
    let png64 = this.cy.png({
      full: true,
      scale: 2
    });

    if (window.navigator['msSaveOrOpenBlob']) {
      // IE and Edge does not support data URIs in links.
      let canvas = document.createElement('canvas');
      let img = new Image();
      img.src = png64;

      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      window.navigator['msSaveBlob'](canvas['msToBlob'](), filename);
    } else {
      let a = document.createElement('a');
      a.setAttribute('href', png64);
      a.setAttribute('download', filename);

      if (document.createEvent) {
        let event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        a.dispatchEvent(event);
      } else {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  }

  makeNode(params) {
    this.idx += 1;

    return {
      group: 'nodes',
      classes: params.classes || 'legend',
      data: {
        id: params.id || 'legend-' + this.idx,
        shape: params.shape || 'ellipse',
        name: params.label || '',
        width: params.width || '24px',
        height: params.height || '24px',
        color: params.color || 'black',
        border: params.border || '0',
        labelshift: params.labelshift || '11px',
        opacity: params.opacity || '1'
      },
      position: params.position
    };
  }

  makeEdge(params) {
    this.idx += 1;

    var source = {
      id: 'legend-' + this.idx + '-source',
      width: '15px',
      height: '15px',
      opacity: '0',
      position: { x: params.position['x'] - 35, y: params.position['y'] }
    };

    var target = {
      id: 'legend-' + this.idx + '-target',
      width: '15px',
      height: '15px',
      opacity: '0',
      position: { x: params.position['x'] + 35, y: params.position['y'] }
    };

    var edge = {
      group: 'edges',
      classes: 'legend' + (params.classes || ''),
      data: {
        id: 'legend-' + this.idx,
        source: source.id,
        target: target.id,
        type: params.type || '0',
        width: params.width || 2.5,
        label: params.label || '',
        labelyshift: params.labelyshift || '0',
        labelxshift: params.labelxshift || '0'
      }
    };
    return [this.makeNode(source), this.makeNode(target), edge];
  }

  removeCytoscapeLegend() {
    this.cy.filter('.legend').remove();
    this.idx = 0;
  }

  // create node/edge legend in cytoscape so that it is captured in the 
  // image output when saving the cytoscape canvas
  createCytoscapeLegend(legendItems) {
    let { cy, model } = this;

    let boundingBox = cy.filter('*').boundingBox();
    let xStart = boundingBox['x2'] + 35;
    let yStart = boundingBox['y1'] + 25;
    let rowHeight = 32;
    let legendElements = [];
    let legendColours = cystyle.colors;
    let colours =
      model.nodeColor == 'nt'
        ? legendColours.colorsNt
        : legendColours.colorsType; //TODO: eventually this will update when model updates.

    let row = 0;

    this.idx = 0;
    legendItems.forEach(item => {
      let { id, text } = item;

      if (!id.startsWith('edge')) {
        // Nodes.
        let node = {
          label: text,
          color: colours[id.split('-')[1]],
          position: { x: xStart, y: yStart + row * rowHeight }
        };
        if (['type-muscle', 'type-others', 'nt-n'].includes(id)) {
          node.width = '30px';
          node.height = '16px';
          node.shape = 'roundrectangle';
          node.labelshift = '8px';
        }
        if (id == 'nt-n') {
          node.border = '1px';
        }
        if (cy.nodes('[?' + id.split('-')[1] + ']').length === 0) {
          return;
        }
        legendElements.push(this.makeNode(node));
        row += 1;
      } else {
        // Edges.
        if (id == 'edge-typ0') {
          row += 0.5;
        }
        let synapses = id == 'edge-typ0' ? [1, 10, 50] : [3];

        let noEdgesWithAnnotations = (
          cy.edges('.mature').length === 0 &&
          cy.edges('.juvenile').length === 0 &&
          cy.edges('.stable').length === 0 &&
          cy.edges('.variable').length === 0 &&
          cy.edges('.post-embryonic').length === 0
        );

        synapses.forEach((syn, i) => {
          let edge = {
            type: '0',
            labelyshift: '0',
            labelxshift: '0',
            position: { x: xStart, y: yStart + (row + i) * rowHeight }
          };
          if (id == 'edge-typ0') {
            edge.width = Math.max(
              3 * Math.pow(syn, 1 / 3) - 2,
              1
            ); /* TODO: this equation is defined twice*/
            edge.label = syn;
            edge.labelyshift = -7 - edge.width + 'px';
            if (syn == 50) {
              edge.labelxshift = '2.5px';
            }
          }
          if (id == 'edge-typ2') {
            edge.type = 2;
          }
          if (id == 'edge-not-classified') {
            edge.classes = ' not-classified';
            if (noEdgesWithAnnotations) {
              return;
            }
          } else if (id == 'edge-mature') {
            edge.classes = ' mature';
            if (noEdgesWithAnnotations) {
              return;
            }
          } else if (id == 'edge-juvenile') {
            edge.classes = ' juvenile';
            if (noEdgesWithAnnotations) {
              return;
            }
          }  else if (id == 'edge-stable') {
            edge.classes = ' stable';
            if (noEdgesWithAnnotations) {
              return;
            }
          } else if (id == 'edge-variable') {
            edge.classes = ' variable';
            if (noEdgesWithAnnotations) {
              return;
            }
          } else if (id == 'edge-post-embryonic') {
            edge.classes = ' post-embryonic';
            if (noEdgesWithAnnotations) {
              return;
            }
          }
          legendElements = legendElements.concat(this.makeEdge(edge));
        });

        if (synapses.length == 1) {
          legendElements.push(
            this.makeNode({
              label: text,
              labelshift: '8px',
              opacity: '0',
              position: { x: xStart + 20, y: yStart + row * rowHeight }
            })
          );
        }
        if (synapses.length > 1) {
          legendElements.push(
            this.makeNode({
              label: text,
              width: '2px',
              height: synapses.length * rowHeight + 'px',
              color: 'black',
              shape: 'rectangle',
              labelshift: '8px',
              position: {
                x: xStart + 30,
                y: yStart + ((synapses.length - 1) / 2 + row) * rowHeight
              }
            })
          );
        }
        row += synapses.length;
        if (id == 'edge-typ2') {
          row += 0.5;
        }
      }
    });

    cy.add(legendElements);
    this.correctGjSegments('[type=2].legend');
  }

  updateLayout(positions, layoutName) {
    let { cy, layout, animateLayout } = this;

    const defaultLayoutOpts = {
      padding: 30,
      animationDuration: 300
    };

    let layoutOptions = Object.assign({}, defaultLayoutOpts);
    let moreThanOnePresetPosition = Object.keys(positions).length > 0;
    let currentLayoutRunning = cy.animated() && layout != null;

    if (currentLayoutRunning) {
      layout.stop(true);
    }

    // If coordinates are defined, draw nodes directly according to coordinates.
    if (moreThanOnePresetPosition) {
      layoutOptions = Object.assign({}, layoutOptions, {
        name: 'preset',
        zoom: false,
        pan: false,
        animate: false,
        positions: node => {
          let id = node.id();

          if (positions[id] != null) {
            return positions[id];
          }
          return {
            x: 0,
            y: 0
          };
        }
      });
    } else {
      // Concentric circle layout.
      if (layoutName == 'concentric') {
        let concentricPositions = this.getConcentricLayoutPositions();

        layoutOptions = Object.assign(layoutOptions, {
          name: 'preset',
          animate: animateLayout,
          positions: node => concentricPositions[node.id()]
        });
      } else if (layoutName == 'cose-bilkent') {
        // Force-directed layout.
        layoutOptions = Object.assign(layoutOptions, {
          name: 'cose-bilkent',
          animate: animateLayout ? 'end' : false,
          nodeRepulsion: 1500,
          idealEdgeLength: 150,
          numIter: 2500,
          nestingFactor: 0.1,
          gravity: 0.2
        });
      } else if (layoutName == 'dagre') {
        // Hierarchical layout.
        layoutOptions = Object.assign(layoutOptions, {
          name: 'dagre',
          animate: animateLayout,
          rankDir: 'TB',
          nodeSep: 10,
          rankSep: 100
        });
      }
    }

    layout = cy.makeLayout(layoutOptions);

    layout.run();
  }

  getConcentricLayoutPositions() {
    let { cy } = this;
    let center = {
      x: cy.width() / 2,
      y: cy.height() / 2
    };

    // Sort input nodes by name.
    let innerNodes = cy.nodes('.searchedfor');
    let innerNodeIds = innerNodes.map(n => n.id()).sort();

    // Sort connected nodes by connection type, then by name.
    // 0: not connected (should be possible)
    // 1: target
    // 2: target + electrical synapse
    // 3: electrical synapse (and target + source + electrical synapse)
    // 4: source + electrical synapse
    // 5: source
    // 6: source + target
    let outerNodes = cy.nodes().not('.searchedfor');
    let edgeTypes = {};
    outerNodes.forEach(node => {
      let edges = node.edgesWith(innerNodes);
      let edgesElectrical = edges.filter('[type=2]');
      let edgesChemical = edges.filter('[type=0]');
      let hasElectrical = edgesElectrical.length > 0;
      let isTarget = edgesChemical.sources().contains(innerNodes);
      let isSource = edgesChemical.targets().contains(innerNodes);
      let idx = 0;

      if (hasElectrical) {
        idx = 3 - isTarget + isSource;
      } else {
        idx = isTarget + isSource * 5;
      }

      edgeTypes[node.id()] = idx;
    });

    let outerNodeIds = outerNodes
      .map(n => n.id())
      .sort((a, b) => {
        if (edgeTypes[a] === edgeTypes[b]) {
          return a.localeCompare(b);
        }

        return edgeTypes[a] - edgeTypes[b];
      });

    // Create concentric circle coordinates. A smaller inner circle is created for input nodes.
    let innerPositions = this.createCircle(
      innerNodeIds,
      center,
      outerNodes.length > 0
    );
    let outerPositions = this.createCircle(outerNodeIds, center);

    return Object.assign(innerPositions, outerPositions);
  }

  // Create circle coordinates for all input nodes around a center.
  createCircle(nodes, center, smallCircle = false) {
    let positions = {};
    let count = nodes.length;
    let dTheta = (2 * Math.PI - (2 * Math.PI) / count) / Math.max(1, count - 1);
    let r = Math.ceil(Math.min(center.x * 2, center.y * 2) / 2.5);

    if (smallCircle) {
      if (count < 4) {
        r /= 3;
      } else {
        r /= 2;
      }
    }

    if (smallCircle && count === 1) {
      positions[nodes[0]] = {
        x: center.x,
        y: center.y
      };
    } else {
      for (let i = 0; i < count; i++) {
        let theta = -i * dTheta;

        positions[nodes[i]] = {
          x: center.x - r * Math.sin(theta),
          y: center.y - r * Math.cos(theta)
        };
      }
    }

    return positions;
  }
}

module.exports = GraphView;
