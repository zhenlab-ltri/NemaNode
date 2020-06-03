const pallete = require('google-palette');

const Vue = require('vue').default;
Vue.config.devtools = false; //disable warning
Vue.config.productionTip = false; //disable warning
const VueDraggableResizable = require('vue-draggable-resizable');
const { VueSelect } = require('vue-select');
// const { VTooltip, VPopover, VClosePopover } = require('v-tooltip');
// Vue.use(VTooltip);
Vue.component('vue-draggable-resizable', VueDraggableResizable);
Vue.component('vue-select', VueSelect);
// Vue.directive('close-popover', VClosePopover);
// Vue.component('v-popover', VPopover);

const services = require('../../services');
const DataService = require('../../data-service');

const { unique, difference } = require('../../util');

const {
  SCALE_BAR_SIZES,
  SCALE_BAR_UNITS,
  BG_COLOR_OPTIONS,
  SYNAPSE_VISIBLITY_OPTIONS,
  NEURON_COLOR_SCHEME_OPTIONS,
  CONNECTION_COLOR_SCHEME_OPTIONS,
  SHOW_WORM_BODY_OPTIONS
} = require('./ui-constants');


let createNeuronTrajectoryUi = ({ controller, width, height }) => {
  return new Vue({
    el: '#ntv',
    mounted: () => {
      this.controller.initializeVisualization();
      let { scalebarMeasurement, scalebarMinWidth } = this.controller.computeScalebarMeasurement();
      this.scalebarMeasurement = scalebarMeasurement;
      this.scalebarMinWidth = scalebarMinWidth;

    },
    data: {
      // neuron names
      controller,
      input: [],
      hidden: [],

      // select options
      datasetOptions: DataService.datasets
        .filter(d => d.hasTrajectory)
        .sort((d0, d1) => d0.time - d1.time)
        .map(dataset => dataset.id),
      neuronColorSchemeOptions: NEURON_COLOR_SCHEME_OPTIONS,
      synapseVisibilityOptions: SYNAPSE_VISIBLITY_OPTIONS,
      bgColorOptions: BG_COLOR_OPTIONS,
      connectionColorSchemeOptions: CONNECTION_COLOR_SCHEME_OPTIONS,
      showWormBodyOptions: SHOW_WORM_BODY_OPTIONS,

      // movable/resizable state
      showResizeHandles: false,
      width,
      height,
      x: 0,
      y: 0,
      showHandles: false,

      // legend item state
      showSynapses: true,
      showOpenEnds: true,
      showGapJunctions: true,

      // controls state
      bgColor: 0xffffff,
      showWormBody: false,
      synapseVisibility: 'All',
      neuronColorScheme: 'cb-Accent',
      connectionColorScheme: CONNECTION_COLOR_SCHEME_OPTIONS[0].value,
      selectedDataset: DataService.getDatasetInfo('head', 'SEM_adult').id,
      trajectoryWidth: 5,
      settingsOpen: false,
      isOpen: false,

      // data tooltip state
      trajectoryNodeHovered: false,
      showTooltip: false,
      tooltipX: 100,
      tooltipY: 100,
      tooltipData: {
        nodeInfo: [],
        connectedNeuronNames: []
      },

      // scale bar state
      scalebarMeasurement: 0,
      scalebarMinWidth: 0,
    },
    computed: {
      neuronColors: function() {
        let numColors =
          this.neuronColorScheme === 'mpn65'
            ? Math.min(65, this.validInput.length)
            : Math.min(8, this.validInput.length);

        let colors = pallete(this.neuronColorScheme, numColors);
        let neuronColors = {};

        // the mpn color scheme generates 65 colors, the other color schemes 8 colors
        // reuse the colors if there are more neurons than colors
        this.validInput.sort().forEach((neuronName, index) => {
          neuronColors[neuronName] = parseInt(colors[index % numColors], 16);
        });
        return neuronColors;
      },
      showAllSynapses: function() {
        return this.synapseVisibility === 'All';
      },
      validInput: function() {
        // only class member cells are sent to input
        let valid = this.input.filter(i => DataService.cellsMap.get(i).hasTrajectory);

        let invalid = difference(this.input, valid);
        if (invalid.length > 0) {
          this.controller.handleNeuronTrajectoryNotFound(invalid);
        }

        return Array.from(new Set(valid));
      },
      openEndColor: () => {
        return this.bgColor === 0xffffff ? 0x000000 : 0xffffff;
      },
      missingTrajectoryNeighbours: () => {
        let neuronNeighbours = this.tooltipData.connectedNeuronNames;
        let neuronsNotInVisualization = neuronNeighbours.filter(n => !this.validInput.includes(n));

        return neuronsNotInVisualization;
      },
      scalebarContent: () => {
        let width = 0;
        let scalebarDisplayVal = '';
        for (let i = 0; i < SCALE_BAR_SIZES.length; ++i) {
          scalebarDisplayVal = SCALE_BAR_SIZES[i];
          width = SCALE_BAR_SIZES[i] * this.scalebarMeasurement;
          if (width > Math.min(192, this.scalebarMinWidth)) {
            break;
          }
        }

        let ui = 0;
        while (scalebarDisplayVal >= 1000 && ui < SCALE_BAR_UNITS.length - 1) {
          scalebarDisplayVal /= 1000;
          ++ui;
        }

        return {
          width,
          scalebarDisplayVal: `${scalebarDisplayVal} ${SCALE_BAR_UNITS[ui]}`
        };
      }
    },
    watch: {
      bgColor: function(newVal) {
        this.controller.updateBgColor(newVal, this.openEndColor);
      },
      trajectoryWidth: function(newWidth) {
        this.controller.updateTrajectoryWidth(newWidth);
      },
      input: function() {
        let neuronClasses = unique(
          this.validInput.map(n => DataService.cellClass(n))
        );

        // if input consists of only one neuron or neuron class, show all synapses for that neuron
        this.validInput.length === 1 || neuronClasses.length === 1
          ? (this.synapseVisibility = 'All')
          : (this.synapseVisibility = 'Shared');

        // always unhide everything after input changes
        this.hidden = [];


        // close tooltips because their position will be stale
        this.showTooltip = false;
        this.updateTrajectoryVisualization();
      },
      showWormBody: () => {
        this.updateTrajectoryVisualization();
      },
      selectedDataset: () => {
        this.updateTrajectoryVisualization();
      },
      neuronColorScheme: () => {
        this.updateTrajectoryVisualization();
      },
      connectionColorScheme: () => {
        this.updateTrajectoryVisualization();
      },
      showSynapses: () => {
        this.updateTrajectoryVisualization();
      },
      showGapJunctions: () => {
        this.updateTrajectoryVisualization();
      },
      showOpenEnds: () => {
        this.updateTrajectoryVisualization();
      }
    },
    methods: {
      updateTrajectoryVisualization: () => {
        let {
          showWormBody,
          validInput: neuronNames,
          selectedDataset: datasetId,
          hidden,
          trajectoryWidth,
          connectionColorScheme,
          openEndColor,
          showAllSynapses,
          neuronColors,
          showGapJunctions,
          showSynapses,
          showOpenEnds
        } = this;

        let { preColor, postColor, gapJunctionColor } = connectionColorScheme;

        services
          .getNematodeNeuronTrajectories({ neuronNames, datasetId })
          .then(res => {
            let { trajectories, trajectorySynapses } = res;
            let neuronsThatHaveTrajectories = [];

            trajectories.forEach(t => {
              t.color = neuronColors[t.neuron_name];
              neuronsThatHaveTrajectories.push(t.neuron_name);
            });

            let wormBodyWidthModifier = DataService.getDatasetById(datasetId).time > 40 ? 1.1 : 1.3;

            let nonHiddenTrajectories = trajectories.filter(
              t => hidden.indexOf(t.neuron_name) == -1
            );

            let uniqueNeuronClasses = unique(nonHiddenTrajectories.map(t => DataService.cellClass(t.neuron_name)));

            if (nonHiddenTrajectories.length === 1 || uniqueNeuronClasses.length === 1) {
              showAllSynapses = true;
            }

            this.controller.loadNeuronTrajectories({
              neuronTrajectories: nonHiddenTrajectories,
              synapses: trajectorySynapses,
              trajectoryWidth: trajectoryWidth,
              showWormBody,
              preColor,
              postColor,
              gapJunctionColor,
              openEndColor,
              showAllSynapses,
              wormBodyWidthModifier,
              showGapJunctions,
              showSynapses,
              showOpenEnds

            });
          });
      },
      getLegendItemConnectorStyle: function({ color }) {
        return {
          'background-color': color === 0 ? '#000' : `#${color.toString(16)}`,
          width: '5px',
          height: '3px'
        };
      },
      getLegendItemStyle: function({
        color,
        isCircle = false,
        border = null,
        opacity = null
      }) {
        let opts = {
          'background-color': color === 0 ? '#000' : `#${color.toString(16)}`,
          width: '10px',
          height: '14px'
        };

        if (isCircle) {
          opts.width = '14px';
          opts['border-radius'] = '50%';
          border !== null ? (opts['border'] = '1px solid') : null;
          opacity !== null ? (opts['opacity'] = opacity) : null;
        } else {
          opts.margin = '0 2px';
        }

        return opts;
      },
      getScaleBarStyle: () => {
        let textColor = '#777';
        return {
          'width': `${this.scalebarContent.width}px`,
          'position': 'absolute',
          'left': '10px',
          'bottom': '10px',
          'padding': '5px',
          'border-left': `2px solid ${textColor}`,
          'border-bottom': `2px solid ${textColor}`,
          'color': textColor
        };
      },
      onResize: function(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.controller.updateVisualizationSize(width, height);
        this.showTooltip = false;
      },
      onDrag: function(x, y) {
        this.x = x;
        this.y = y;

        this.controller.updateVisualizationSize(this.width, this.height);
        this.showTooltip = false;
      },
      close: function() {
        this.isOpen = false;
        this.showTooltip = false;
        this.controller.clearTrajectoryVisualization();
      },
      toggleTrajectoryVisibility(neuronName) {
        let nameFound = this.hidden.indexOf(neuronName);
        if (nameFound != -1) {
          this.hidden.splice(nameFound, 1);
        } else {
          this.hidden.push(neuronName);
        }
        this.updateTrajectoryVisualization();
      },
      decreaseTrajectoryWidth(val) {
        this.trajectoryWidth = Math.max(1, this.trajectoryWidth - val);
      },
      increaseTrajectoryWidth(val) {
        this.trajectoryWidth = Math.min(10, this.trajectoryWidth + val);
      },
      toggleOpenSettings() {
        this.settingsOpen = !this.settingsOpen;
      },
      handleSynapseVisibilityChange() {
        this.updateTrajectoryVisualization();
      }
    }
  });
};

module.exports = createNeuronTrajectoryUi;
