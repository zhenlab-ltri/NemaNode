const BaseView = require('../base-view');


const NeuronTrajectoryVisualization = require('./trajectory-visualization');
const createNeuronTrajectoryUi = require('./trajectory-ui');

const { getTrajectoryNodeData } = require('../../services');

const { prettyPrintArray } = require('../../util');

class NeuronTrajectoryView extends BaseView {
  constructor(model) {
    super();

    this.model = model;

    this.visualization = null; // intialized after document ready

    this.minDimension = Math.min(window.innerHeight, window.innerWidth);

    this.width = this.minDimension;
    this.height = this.minDimension;

    this.view = createNeuronTrajectoryUi({
      width: this.width,
      height: this.height,
      controller: this
     });
  }

  initializeVisualization(){
    this.visualization = new NeuronTrajectoryVisualization({
      width: this.width,
      height: this.height,
      controller: this
    });

    this.visualization.renderer.domElement.addEventListener('click', e => {
      this.view.settingsOpen = false;
      this.view.showHandles = false;
      this.view.showTooltip = false;
      this.view.tooltipData = {
        nodeInfo: [],
        connectedNeuronNames: []
      };

      // place the tooltip to where the user clicked
      // and potentially show trajectory node data if
      // the user clicked on a trajectory node
      let bounds = e.target.getBoundingClientRect();
      let x = e.clientX - bounds.left;
      let y = e.clientY - bounds.top;

      this.view.tooltipX = x;
      this.view.tooltipY = y;

      let clicked3dObjects = this.visualization.getRaycastIntersection(e, this.view.x, this.view.y);

      if( clicked3dObjects.length > 0 ){
        this.view.showTooltip = true;

        getTrajectoryNodeData({ nodeIds: clicked3dObjects }).then( data => {
          this.view.tooltipData = data;
        });

      }
    });

    this.visualization.renderer.domElement.addEventListener('mousemove', e => {
      this.view.trajectoryNodeHovered = false;

      let clicked3dObjects = this.visualization.getRaycastIntersection(e, this.view.x, this.view.y);

      if( clicked3dObjects.length > 0 ){
        this.view.trajectoryNodeHovered = true;
      }
    });

    this.visualization.controls.addEventListener('change', () => {
      this.view.showTooltip = false;
      let { scalebarMeasurement, scalebarMinWidth } = this.computeScalebarMeasurement();
      this.view.scalebarMeasurement = scalebarMeasurement;
      this.view.scalebarMinWidth = scalebarMinWidth;
    });
  }

  handleNeuronTrajectoryNotFound(neuronsNotFound){
    let neuronMsgLabel = prettyPrintArray(neuronsNotFound);
    this.model.emit('warning', {
      id: `nt-notfound-${neuronsNotFound.sort().join('-')}`,
      message: 'Only neurons and muscle cells can be visualized in 3D.  ' + neuronMsgLabel + ' do not have a trajectory.',
      arr: []
    });
  }

  clearTrajectoryVisualization(){
    this.visualization.clear();
  }

  updateBgColor(newColor, newOpenEndColor){
    this.visualization.updateBgColor(newColor, newOpenEndColor);
  }

  updateTrajectoryWidth(newWidth){
    this.visualization.updateTrajectoryWidth(newWidth);
  }

  loadNeuronTrajectories(opts){
    this.visualization.loadNeuronTrajectories(opts);
  }

  updateVisualizationSize(w, h){
    this.visualization.updateVisualizationSize(w, h);
  }
  computeScalebarMeasurement(){
    return {
      scalebarMeasurement: (this.visualization.renderer.domElement.getBoundingClientRect().width * this.visualization.camera.zoom ) /
    (this.visualization.camera.right - this.visualization.camera.left),
      scalebarMinWidth: this.visualization.renderer.domElement.getBoundingClientRect().width / 5
    };
  }
}

module.exports = NeuronTrajectoryView;
