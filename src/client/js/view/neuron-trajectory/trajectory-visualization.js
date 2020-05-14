const THREE = require('three');
require('three/OrbitControls');
require('three/LineSegmentsGeometry');
require('three/LineSegments2');
require('three/LineMaterial');
require('three/GLTFLoader');
require('./orthographic-trackball-controls');

const TRAJECTORIES_OBJ_KEY = 'trajectories';
const SYNASPES_OBJ_KEY = 'synapses';
const OPEN_ENDS_OBJ_KEY = 'openEnds';
const WORM_BODY_OBJ_KEY = 'wormBody';
const CELL_BODIES_OBJ_KEY = 'cellBodies';
const DIRECTION_AXES_OBJ_KEY = 'directionAxes';

class NeuronTrajectoryVisualization {
  constructor({ bgColor = 0xffffff, width, height, controller }) {
    let renderer;
    let camera;
    let directionalityCamera;
    let controls;
    let raycaster;
    let scene = new THREE.Scene();
    let mouse;

    // initialize renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: document.getElementById('ntv-canvas')
    });
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(bgColor));
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('ntv').appendChild(renderer.domElement);

    // initialize camera
    let domEleBB = renderer.domElement.getBoundingClientRect();
    let aspectRatio = domEleBB.width / domEleBB.height;
    let frustumSize = 30000;
    camera = new THREE.OrthographicCamera(
      (frustumSize * aspectRatio) / -2,
      (frustumSize * aspectRatio) / 2,
      (frustumSize * aspectRatio) / 2,
      (frustumSize * aspectRatio) / -2,
      0,
      400000
    );
    camera.lookAt(scene.position);
    camera.target = scene.position.clone();

    // initialize mini camera at the bottom of the screen
    directionalityCamera = new THREE.OrthographicCamera(
      -700, 700,
      700, -700,
      -700, 700
    );
    scene.add(directionalityCamera);
    directionalityCamera.layers.enable(1);
    directionalityCamera.position.set(-100000, -100000, -100000);

    let loader = new THREE.GLTFLoader();

    loader.load( '3d-models/ntv-direction-axis.glb',
      gltf => {
        let directionAxes = gltf.scene.children[0].children[0];
        let material = new THREE.MeshBasicMaterial({color: 0x000000 });
        directionAxes.name = DIRECTION_AXES_OBJ_KEY;
        directionAxes.material = material;
        directionAxes.scale.set(6, 6, 6);
        directionAxes.opacity = 1;
        directionAxes.renderOrder = 1;
        directionAxes.layers.set(1);

        directionalityCamera.add(directionAxes);
        directionalityCamera.children.forEach( child => {
          child.translateZ(-200);
          child.translateX(50);
          child.setRotationFromEuler(this.directionalityCamera.rotation);
        });

      },
      undefined,
      ( error ) => {}
    );
    // initialize mouse controls
    controls = new THREE.OrthographicTrackballControls(
      camera,
      renderer.domElement
    );
    controls.maxZoom = 15.0;
    controls.minZoom = 0.0;
    controls.dynamicDampingFactor = 0.4;
    controls.noRoll = true;
    controls.noPan = false;


    // initialize raycaster/mouse clicking behaviour
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;
    this.scene = scene;
    this.currCenterPt = [0, 0, 0];
    this.raycaster = raycaster;
    this.mouse = mouse;
    this.directionalityCamera = directionalityCamera;
    this.frustumSize = frustumSize;

    this.controls.addEventListener('change', () => {
      this.directionalityCamera.rotation = this.camera.rotation;
      this.directionalityCamera.children.forEach( child => {
        child.setRotationFromEuler(this.directionalityCamera.rotation);
      });
    });

    requestAnimationFrame(() => this.render());
  }

  removeGroupObj(objName) {
    let { scene } = this;
    let obj = scene.getObjectByName(objName);

    if (obj != null) {
      for (let i = obj.children.length - 1; i >= 0; i--) {
        let child = obj.children[i];
        child.material.dispose();
        child.geometry.dispose();
        obj.remove(child);
      }

      scene.remove(obj);
    }
  }

  clear(){
    this.removeGroupObj(TRAJECTORIES_OBJ_KEY);
    this.removeGroupObj(SYNASPES_OBJ_KEY);
    this.removeGroupObj(OPEN_ENDS_OBJ_KEY);
    this.removeGroupObj(WORM_BODY_OBJ_KEY);
    this.removeGroupObj(CELL_BODIES_OBJ_KEY);
    this.scene.dispose();
  }

  loadNeuronTrajectories({
    neuronTrajectories,
    trajectoryWidth,
    synapses,
    preColor,
    postColor,
    gapJunctionColor,
    openEndColor,
    showAllSynapses,
    wormBodyWidthModifier,
    showGapJunctions,
    showSynapses,
    showOpenEnds,
    showWormBody
  }) {
    this.clear();

    if (neuronTrajectories.length === 0) {
      return;
    }

    let preprocessNeuronTrajectoryData = neuronTrajectories => {
      let allPostSynapticNodes = new Set();
      let allPreSynapticNodes = new Set();
      let allCoordinates = {};
      let nodeId2NeuronNameMap = {};

      let [initialX, initialY, initialZ] = Object.values(neuronTrajectories[0].trajectory_json['coords'])[0];
      let maxYVec = new THREE.Vector3(initialX, initialY, initialZ);
      let maxZVec = new THREE.Vector3(initialX, initialY, initialZ);

      let minYVec = new THREE.Vector3(initialX, initialY, initialZ);
      let minZVec = new THREE.Vector3(initialX, initialY, initialZ);

      neuronTrajectories.forEach(nt => {
        let coordinates = nt.trajectory_json['coords'];
        let preSynapticNodes = nt.trajectory_json.preSynapticNodes;
        let postSynapticNodes = nt.trajectory_json.postSynapticNodes;

        Object.entries(coordinates).forEach(([nodeId, coordinate]) => {
          let [x, y, z] = coordinate;

          allCoordinates[nodeId] = new THREE.Vector3(x, y, z);

          if( y > maxYVec.y ){
            maxYVec.set(x, y, z);
          }

          if( z > maxZVec.z ){
            maxZVec.set(x, y, z);
          }

          if( y < minYVec.y ){
            minYVec.set(x, y, z);
          }

          if( z < minZVec.z ){
            minZVec.set(x, y, z);
          }

          nodeId2NeuronNameMap[nodeId] = nt.neuron_name;
        });

        preSynapticNodes.forEach(nodeId => allPreSynapticNodes.add(nodeId));
        postSynapticNodes.forEach(nodeId => allPostSynapticNodes.add(nodeId));
      });

      return {
        allPostSynapticNodes,
        allPreSynapticNodes,
        allCoordinates,
        nodeId2NeuronNameMap,
        minYVec,
        maxYVec,
        minZVec,
        maxZVec
      };
    };

    let createTrajectoriesVisualization = ({
      neuronTrajectories,
      allCoordinates,
      resolutionVector
    }) => {
      let trajectoryVisualization = new THREE.Group();
      trajectoryVisualization.name = TRAJECTORIES_OBJ_KEY;

      neuronTrajectories.forEach(nt => {
        let trajectorySegments = nt.trajectory_json['arbor'];
        let color = nt.color;

        let segments = [];
        Object.entries(trajectorySegments).forEach(([segStart, segEnd]) => {
          let segStartPos = allCoordinates[segStart];
          let segEndPos = allCoordinates[segEnd];

          if( segStartPos != null && segEndPos != null ){
            segments.push(segStartPos.x, segStartPos.y, segStartPos.z);
            segments.push(segEndPos.x, segEndPos.y, segEndPos.z);  
          }
        });

        let material = new THREE.LineMaterial({
          color,
          linewidth: trajectoryWidth, // in pixels
          resolution: resolutionVector,
          dashed: false
        });
        let geometry = new THREE.LineSegmentsGeometry();
        geometry.setPositions(segments);

        let line = new THREE.LineSegments2(geometry, material);

        line.name = nt.neuron_name;
        trajectoryVisualization.add(line);
      });

      return trajectoryVisualization;
    };

    let createOpenEndsVisualization = ({neuronTrajectories, showOpenEnds}) => {
      let openEndsVisualization = new THREE.Group();
      openEndsVisualization.name = OPEN_ENDS_OBJ_KEY;
      const openEndGeometry = new THREE.SphereGeometry(150, 32, 32);
      const openEndMaterial = new THREE.MeshBasicMaterial();
      openEndMaterial.color.setHex(openEndColor);
      openEndMaterial.transparent = true;
      openEndMaterial.opacity = 0.4;

      if( showOpenEnds ){
        neuronTrajectories.forEach(nt => {
          nt.trajectory_json.open_ends.forEach(openEndNodeId => {
            let coordinate = allCoordinates[openEndNodeId];

            if( coordinate != null ){
              let openEnd = new THREE.Mesh(openEndGeometry, openEndMaterial);
              openEnd.position.copy(coordinate);
  
              openEndsVisualization.add(openEnd);  
            }
          });
        });
      }

      return openEndsVisualization;
    };

    let createCellBodiesVisualization = neuronTrajectories => {
      let cellBodiesVisualization = new THREE.Group();
      cellBodiesVisualization.name = CELL_BODIES_OBJ_KEY;

      neuronTrajectories.forEach(nt => {
        nt.trajectory_json.nuclei.forEach(([nucleousNodeId, nucleousRadius]) => {
          let coordinate = allCoordinates[nucleousNodeId];

          if( coordinate != null ){
            let nucleousGeometry = new THREE.SphereGeometry(nucleousRadius, 32, 32);
            let nucleousMaterial = new THREE.MeshBasicMaterial({
              color: nt.color
            });
            let cellBody = new THREE.Mesh(nucleousGeometry, nucleousMaterial);
            cellBody.position.copy(coordinate);
  
            openEndsVisualization.add(cellBody);
          }
        });
      });

      return cellBodiesVisualization;
    };

    let createSynapsesVisualization = ({
      showAllSynapses,
      allPostSynapticNodes,
      allPreSynapticNodes,
      synapses,
      linewidth,
      resolutionVector,
      nodeId2NeuronNameMap,
      showGapJunctions,
      showSynapses
    }) => {
      let synapseVisualization = new THREE.Group();
      synapseVisualization.name = SYNASPES_OBJ_KEY;
      const synapseNodeGeometry = new THREE.SphereGeometry(150, 32, 32);

      const postNodeMaterial = new THREE.MeshBasicMaterial({
        color: postColor
      });
      const preNodeMaterial = new THREE.MeshBasicMaterial({ color: preColor });
      const gapJunctionNodeMaterial = new THREE.MeshBasicMaterial({
        color: gapJunctionColor
      });

      const synapsePreLineMaterial = new THREE.LineMaterial({
        color: preColor,
        linewidth, // in pixels
        resolution: resolutionVector,
        dashed: false
      });
      const synapsePostLineMaterial = new THREE.LineMaterial({
        color: postColor,
        linewidth, // in pixels
        resolution: resolutionVector,
        dashed: false
      });
      const gapJunctionLineMaterial = new THREE.LineMaterial({
        color: gapJunctionColor,
        linewidth, // in pixels
        resolution: resolutionVector,
        dashed: false
      });

      // a valid synapse is a synapse where both post node and pre node
      // exist in the current neuron trajectories
      let validConnections = showAllSynapses
        ? synapses
        : synapses.filter(synapse => {
            return (
              (allPreSynapticNodes.has(synapse.pre_node_id) &&
                allPostSynapticNodes.has(synapse.post_node_id)) ||
              (allPreSynapticNodes.has(synapse.post_node_id) &&
                allPostSynapticNodes.has(synapse.pre_node_id))
            );
          });

      let addNode = (nodeId, material) => {
        let nodePos = allCoordinates[nodeId];

        if (nodePos == null) {
          return {
            nodeMesh: null,
            nodePos: null,
            exists: false
          };
        }

        let nodeMesh = new THREE.Mesh(synapseNodeGeometry, material);
        nodeMesh.position.copy(nodePos);

        return {
          nodeMesh,
          nodePos,
          exists: true
        };
      };

      let addSynapse = synapse => {
        let { id, pre_node_id, post_node_id } = synapse;
        let postNode = addNode(post_node_id, postNodeMaterial);
        let preNode = addNode(pre_node_id, preNodeMaterial);

        if (preNode.exists && postNode.exists) {
          let connectionMetadata = {
            preNeuron: nodeId2NeuronNameMap[pre_node_id],
            postNeuron: nodeId2NeuronNameMap[post_node_id],
            type: 'chemical synapse'
          };

          preNode.nodeMesh.userData = Object.assign( {}, connectionMetadata, { nodeId: pre_node_id } );
          postNode.nodeMesh.userData = Object.assign( {}, connectionMetadata, { nodeId: post_node_id } );

          let midPoint = new THREE.Vector3();
          midPoint.add(preNode.nodePos);
          midPoint.add(postNode.nodePos);
          midPoint.divideScalar(2);

          let preLineSegments = [
            preNode.nodePos.x,
            preNode.nodePos.y,
            preNode.nodePos.z,
            midPoint.x,
            midPoint.y,
            midPoint.z
          ];

          let postLineSegments = [
            midPoint.x,
            midPoint.y,
            midPoint.z,
            postNode.nodePos.x,
            postNode.nodePos.y,
            postNode.nodePos.z
          ];

          let synapsePreLineGeometry = new THREE.LineSegmentsGeometry();
          synapsePreLineGeometry.setPositions(preLineSegments);

          let synapsePostLineGeometry = new THREE.LineSegmentsGeometry();
          synapsePostLineGeometry.setPositions(postLineSegments);

          let synapsePreLine = new THREE.LineSegments2(
            synapsePreLineGeometry,
            synapsePreLineMaterial
          );
          let synapsePostLine = new THREE.LineSegments2(
            synapsePostLineGeometry,
            synapsePostLineMaterial
          );

          synapseVisualization.add(synapsePreLine);
          synapseVisualization.add(synapsePostLine);
        }

        if (preNode.exists) {
          preNode.nodeMesh.userData =  { nodeId: pre_node_id };
          synapseVisualization.add(preNode.nodeMesh);
        }

        if (postNode.exists) {
          postNode.nodeMesh.userData = { nodeId: post_node_id };
          synapseVisualization.add(postNode.nodeMesh);
        }
      };

      let addGapJunction = gapJunction => {
        let { id, pre_node_id, post_node_id } = gapJunction;
        let postNode = addNode(post_node_id, gapJunctionNodeMaterial);
        let preNode = addNode(pre_node_id, gapJunctionNodeMaterial);

        if (preNode.exists && postNode.exists) {

          let gapJunctionLineSegments = [
            preNode.nodePos.x,
            preNode.nodePos.y,
            preNode.nodePos.z,
            postNode.nodePos.x,
            postNode.nodePos.y,
            postNode.nodePos.z
          ];
          let gapJunctionLineGeometry = new THREE.LineSegmentsGeometry();
          gapJunctionLineGeometry.setPositions(gapJunctionLineSegments);

          let gapJunctionLine = new THREE.LineSegments2(
            gapJunctionLineGeometry,
            gapJunctionLineMaterial
          );
          synapseVisualization.add(gapJunctionLine);
        }

        if (preNode.exists) {
          preNode.nodeMesh.userData =  { nodeId: pre_node_id };
          synapseVisualization.add(preNode.nodeMesh);
        }

        if (postNode.exists) {
          postNode.nodeMesh.userData = { nodeId: post_node_id };
          synapseVisualization.add(postNode.nodeMesh);
        }
      };

      let gapJunctions = validConnections.filter( c => c.type === 'electrical' );
      let chemSynapses = validConnections.filter( c => c.type !== 'electrical' );

      if( showGapJunctions ){ gapJunctions.forEach( gj => addGapJunction(gj) ); }
      if( showSynapses ){ chemSynapses.forEach( cs => addSynapse(cs) ); }

      return synapseVisualization;
    };

    let getAverageCenterPointOfTrajectories = tVis => {
      let numTrajectories = tVis.children.length;
      let avgCenterPt = tVis.children
        .map(t => {
          t.geometry.computeBoundingBox();
          let center = t.geometry.boundingBox.getCenter();
          t.localToWorld(center);

          return center;
        })
        .reduce(
          (acc, cur) => {
            acc[0] = acc[0] + cur.x;
            acc[1] = acc[1] + cur.y;
            acc[2] = acc[2] + cur.z;

            return acc;
          },
          [0, 0, 0]
        );

      avgCenterPt[0] = avgCenterPt[0] / numTrajectories;
      avgCenterPt[1] = avgCenterPt[1] / numTrajectories;
      avgCenterPt[2] = avgCenterPt[2] / numTrajectories;

      return avgCenterPt;
    };

    let {
      allPostSynapticNodes,
      allPreSynapticNodes,
      allCoordinates,
      nodeId2NeuronNameMap,
      minYVec,
      maxYVec,
      minZVec,
      maxZVec
    } = preprocessNeuronTrajectoryData(neuronTrajectories);

    let {
      width,
      height
    } = this.renderer.domElement.getBoundingClientRect();
    let resolutionVector = new THREE.Vector2(width, height);


    let trajectoriesVisualization = createTrajectoriesVisualization({
      neuronTrajectories,
      allCoordinates,
      resolutionVector
    });
    let synapseVisualization = createSynapsesVisualization({
      showAllSynapses,
      allPostSynapticNodes,
      allPreSynapticNodes,
      synapses,
      linewidth: trajectoryWidth,
      resolutionVector,
      nodeId2NeuronNameMap,
      showSynapses,
      showGapJunctions
    });
    let openEndsVisualization = createOpenEndsVisualization({neuronTrajectories, showOpenEnds});
    let cellBodiesVisualization = createCellBodiesVisualization(neuronTrajectories);

    let avgCenterPt = getAverageCenterPointOfTrajectories(
      trajectoriesVisualization
    );

    let cameraIsInitialized = (
      this.currCenterPt[0] !== 0 &&
      this.currCenterPt[1] !== 0 &&
      this.currCenterPt[2] !== 0
    );

    let currPtWithinDelta =
      Math.abs(avgCenterPt[0] - this.currCenterPt[0]) < 5000 &&
      Math.abs(avgCenterPt[1] - this.currCenterPt[1]) < 5000 &&
      Math.abs(avgCenterPt[2] - this.currCenterPt[2]) < 5000;

    // if the new center point distance is greater than some threshold, re-center the controls
    // on the new center
    if (!currPtWithinDelta) {
      this.controls.target.set(avgCenterPt[0], avgCenterPt[1], avgCenterPt[2]);
      this.currCenterPt = avgCenterPt;
    }

    if( !cameraIsInitialized ){
      // set camera to default c. elegans view if this is the visualization is loading for the first time
      // e.g. https://www.wormatlas.org/SulstonNeuronalCellLineages/art/FIG1L.jpg
      // see https://github.com/TorontoZhen/nemanode/issues/13#issuecomment-521675579
      this.camera.position.set(avgCenterPt[0], avgCenterPt[1], avgCenterPt[2] * 5);
    }

    let createWormBodyVisualization = ({ wormBodyWidthModifier, showWormBody, center, maxYVec, minYVec, minZVec, maxZVec}) => {
      let radius = (Math.max( maxYVec.distanceTo(minYVec), maxZVec.distanceTo(minZVec)) / 2) * wormBodyWidthModifier;
      let geometry = new THREE.CylinderGeometry( radius, radius * 1.2, 50000, 32 );
      let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
      material.transparent = true;
      material.opacity = 0.2;

      let cylinder = new THREE.Mesh( geometry, material );
      cylinder.rotation.z = 1.5;
      cylinder.renderOrder = 10;

      let wormBodyObj = new THREE.Group();
      wormBodyObj.name = WORM_BODY_OBJ_KEY;
      wormBodyObj.position.set(center[0], center[1], center[2]);

      if(showWormBody){
        wormBodyObj.add(cylinder);
      }

      return wormBodyObj;
    };

    let wormBodyObj = createWormBodyVisualization({
      wormBodyWidthModifier,
      center: this.currCenterPt,
      showWormBody,
      maxYVec,
      minYVec,
      maxZVec,
      minZVec
    });

    this.scene.add( wormBodyObj );
    this.scene.add(trajectoriesVisualization);
    this.scene.add(synapseVisualization);
    this.scene.add(openEndsVisualization);
    this.scene.add(cellBodiesVisualization);
  }

  destroy() {
    // TODO
  }

  render() {
    this.controls.update();
    let { width, height } = this.renderer.domElement.getBoundingClientRect();
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.setScissor( 0, 0, width, height );
    this.renderer.setScissorTest( true );
    this.renderer.render(this.scene, this.camera);

    const directionalityWidth = 125;
    const directionalityHeight = 125;
    this.renderer.setViewport(width - 10 - directionalityWidth, 10, directionalityWidth, directionalityHeight);
    this.renderer.setScissor(width - 10 - directionalityWidth, 10, directionalityWidth, directionalityHeight);
    this.renderer.setScissorTest( true );
    this.renderer.render(this.scene, this.directionalityCamera);

    requestAnimationFrame(() => this.render());
  }

  updateVisualizationSize(w, h) {
    let aspect = w / h;

    this.camera.left = this.frustumSize * aspect / - 2;
    this.camera.right = this.frustumSize * aspect / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = - this.frustumSize / 2;

    this.renderer.setSize(w, h);
    this.camera.updateProjectionMatrix();
    this.directionalityCamera.updateProjectionMatrix();
    this.controls.update();

    let trajectoryObj = this.scene.getObjectByName(TRAJECTORIES_OBJ_KEY);

    if (trajectoryObj != null) {
      trajectoryObj.children.forEach(trajectory => {
        trajectory.material.resolution = new THREE.Vector2(w, h);
      });
    }

    this.controls.handleResize();
  }

  updateTrajectoryWidth(newWidth) {
    let { scene } = this;

    let trajectoryObj = scene.getObjectByName(TRAJECTORIES_OBJ_KEY);

    if (trajectoryObj != null) {
      trajectoryObj.children.forEach(trajectory => {
        trajectory.material.linewidth = newWidth;
      });
    }

    let synapsesObj = scene.getObjectByName(SYNASPES_OBJ_KEY);

    if (synapsesObj != null) {
      synapsesObj.children.forEach(s => {
        if (s.material.type === 'LineMaterial') {
          s.material.linewidth = newWidth;
        }
      });
    }
  }

  updateBgColor(newBgColor, newOpenEndColor) {
    let { renderer, scene } = this;
    renderer.setClearColor(new THREE.Color(newBgColor));

    let openEndsObj = scene.getObjectByName(OPEN_ENDS_OBJ_KEY);
    let directionAxesObj = scene.getObjectByName(DIRECTION_AXES_OBJ_KEY);

    if (openEndsObj != null) {
      openEndsObj.children.forEach(child => {
        child.material.color.set(newOpenEndColor);
      });
    }

    if (directionAxesObj != null ){
      directionAxesObj.material.color.set(newOpenEndColor);
    }


  }

  getRaycastIntersection(e, xOffset, yOffset){
    e.preventDefault();
    let x = ((e.clientX - xOffset) / (this.renderer.domElement.clientWidth)) * 2 - 1;
    let y = -((e.clientY - yOffset) / (this.renderer.domElement.clientHeight)) * 2 + 1;
    let intersects = [];

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    // use this for debugging
    // this.scene.add(new THREE.ArrowHelper(this.raycaster.ray.direction, this.raycaster.ray.origin, 50000, 0xff0000, 3000, 500) );

    let synapseObj = this.scene.getObjectByName(SYNASPES_OBJ_KEY);

    if( synapseObj != null ){
      let clickableObjects = this.scene.getObjectByName(SYNASPES_OBJ_KEY).children.filter( c => c.type === 'Mesh');
      intersects = this.raycaster.intersectObjects( clickableObjects, true ).map( i => {
        return i.object.userData.nodeId;
    });

    }

    return intersects;
  }
}

module.exports = NeuronTrajectoryVisualization;
