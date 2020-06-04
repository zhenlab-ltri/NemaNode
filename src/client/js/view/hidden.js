const cytoscape = require('cytoscape');
const $ = require('jquery');

const BaseView = require('./base-view');
const cystyle = require('./network-style');

const { max, debounce } = require('../util');

const DataService = require('../data-service');

class HiddenView extends BaseView {
  constructor(model) {
    super();

    this.model = model;
    this.$outerContainer = $('#cy-hidden-container');
    this.$innerContainer = $('#cy-hidden');
    this.$greeting = $('#greeting');
    this.$cy = $('#cy2');

    this.cy = cytoscape({
      container: this.$cy,
      boxSelectionEnabled: true,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      autoungrabify: true,
      style: cystyle.stylesheet
        .filter(sel => {
          return (
            !sel['selector'].includes(':selected') ||
            !sel['selector'].includes('.searchedfor')
          );
        })
        .concat({
          selector: 'node',
          css: {
            'font-size': 0
          }
        })
    });

    this.model.on('networkChanged', model =>
      this.updateHiddenCytoscape(model.hidden, model.hiddenPositions)
    );

    this.cy.on('tap', e => {
      if (!this.$outerContainer.hasClass('open')) {
        this.open();
      } else {
        if (e.target == this.cy) {
          this.close();
        }
      }
    });

    this.cy.on('cxttap', 'node', e => {
      e.target.select();
    });

    this.cy.on(
      'select',
      'node',
      debounce(() => {
        this.emit('selectionChanged', this.getSelected());
      }, 300)
    );
  }

  updateHiddenCytoscape(hidden, hiddenPositions) {
    let { cy } = this;
    let noHidden = Object.keys(hidden).length === 0;

    if (noHidden) {
      this.cy.nodes().remove();
      this.close();
      return;
    }

    this.$greeting.hide();

    this.cy.startBatch();

    // Prettify node names.
    Object.keys(hidden).forEach(nodeId => {
      let nodeDisplayName = DataService.getDisplayName(
        hidden[nodeId].data.name
      );

      hidden[nodeId].data.name = nodeDisplayName;
    });

    // Remove elements not present in the new network.
    cy.nodes()
      .filter(oldNode => hidden[oldNode.id()] === undefined)
      .remove();

    // Update coinciding elements.
    cy.nodes().forEach(oldNode => {
      let newNode = hidden[oldNode.id()];

      oldNode.data(newNode['data']);
      oldNode.classes(newNode['classes']);

      delete hidden[oldNode.id()];
    });

    let nodesToAdd = Object.values(hidden);
    cy.add(nodesToAdd);

    if (nodesToAdd.length > 0) {
      this.wiggle();
    }

    if (this.isOpen()) {
      this.cy.nodes().style({
        'font-size': '22px'
      });
    }

    cy.endBatch();

    // Add scroll bar if too many nodes are present.
    let containerHeight = 320;
    let maxY = max(Object.keys(hiddenPositions).map(n => hiddenPositions[n].y));

    if (maxY + 40 <= containerHeight) {
      this.$cy.css('height', containerHeight);
    } else {
      this.$cy.css('height', maxY + 40);

      if (!this.$outerContainer.hasClass('open')) {
        this.$innerContainer.stop().animate(
          {
            scrollTop: this.$innerContainer[0].scrollHeight
          },
          300
        );
      }
    }

    cy.resize();

    // Draw layout.
    let hiddenLayout = {
      name: 'preset',
      positions: node => hiddenPositions[node.id()],
      fit: false,
      animate: true
    };

    cy.layout(hiddenLayout).run();
  }

  isOpen() {
    return this.$outerContainer.hasClass('open');
  }

  open() {
    this.$outerContainer.addClass('open');

    this.cy.nodes().style({
      'font-size': '22px'
    });

    if (this.cy.nodes().length === 0) {
      this.$greeting.show();
    }

    this.cy.autounselectify(false);
  }

  close() {
    this.$greeting.hide();
    this.$outerContainer.removeClass('open');
    this.cy.autounselectify(true);
    this.cy.nodes().style({ 'font-size': 0 });
  }

  wiggle() {
    if (!this.$outerContainer.hasClass('open')) {
      this.$outerContainer
        .stop()
        .addClass('wiggled')
        .delay(200)
        .queue(function() {
          $(this).removeClass('wiggled');
        });
    }
  }

  getSelected() {
    return this.cy.nodes(':selected').map(n => n.id());
  }
}

module.exports = HiddenView;
