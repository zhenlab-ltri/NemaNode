const qs = require('query-string');
const { unique } = require('./util');

let getNematodeCells = () => {
  return fetch('/api/cells').then(res => res.json());
};

let getNematodeDatasets = () => {
  return fetch('/api/datasets').then(res => res.json());
};

let getNematodeDatasetJson = ({ datasetId }) => {
  return fetch(`/api/dataset-json?${qs.stringify({datasetId})}`).then( res => res.json());
};

let getNematodeConnections = opts => {
  return fetch(`/api/connections?${qs.stringify(opts)}`)
    .then(res => res.json())
    .then(res => {
      // console.log(res);
      return res;
    });
};

let getNematodeNeuronTrajectories = ({ neuronNames, datasetId }) => {
  return fetch(
    `/api/neuron-trajectories?${qs.stringify({
      neuronName: neuronNames,
      datasetId
    })}`
  )
    .then(res => res.json())
    .then(tjson => {
      let { trajectories, trajectorySynapses } = tjson;
      trajectories.forEach(t => {
        t['trajectory_json'] = JSON.parse(t['trajectory_json']);
      });

      return { trajectorySynapses, trajectories };
    });
};

let getTrajectoryNodeData = ({ nodeIds }) => {
  let uniqueNodeIds = unique(nodeIds);
  return fetch(`/api/trajectory-node-data?${qs.stringify({ nodeIds: uniqueNodeIds })}`)
    .then(res => res.json())
    .then(res => {
      let uniqueNodeIdSet = new Set(uniqueNodeIds);
      let uniqueNodeIdsInChemicalSynapses = new Set();
      let uniqueNodeIdsInGapJunctions = new Set();
      let connectedNeuronNames = new Set();

      res.forEach(r => {
        connectedNeuronNames.add(r.pre);
        connectedNeuronNames.add(r.post);
      });

      let gapJunctions = res.filter(e => e.connection_type === 'gap junction');
      let chemSynapses = res.filter(e => e.connection_type === 'chemical synapse');


      chemSynapses.forEach( c => {
        if( uniqueNodeIdSet.has(c.pre_tid) ){
          uniqueNodeIdsInChemicalSynapses.add(`pre_tid-${c.pre_tid}`);
        }

        if( uniqueNodeIdSet.has(c.post_tid) ){
          uniqueNodeIdsInChemicalSynapses.add(`post_tid-${c.post_tid}`);
        }
      });

      gapJunctions.forEach( g => {
        if( uniqueNodeIdSet.has(g.post_tid) ){
          uniqueNodeIdsInGapJunctions.add(g.post_tid);
        }

        if( uniqueNodeIdSet.has(g.pre_tid) ){
          uniqueNodeIdsInGapJunctions.add(g.pre_tid);
        }
      });

      let nodeInfo = {};
      Array.from(uniqueNodeIdsInChemicalSynapses).forEach( nodeKey => {
        let typeKey = nodeKey.split('-')[0];
        let nodeId = parseInt(nodeKey.split('-')[1]);

        let relevantNodeIdConnections = res.filter( r => r[typeKey] === nodeId );
        let displayLabel = '';

        let useBracketsInDisplayLabel = relevantNodeIdConnections.length > 1;
        if( typeKey === 'pre_tid' ){
          let combinedPostLabels = `${relevantNodeIdConnections.map( r => r.post ).join(', ')}`;
          let postLabel = useBracketsInDisplayLabel ? `Post: (${combinedPostLabels})` : `Post: ${combinedPostLabels}`;

          displayLabel = `Pre: ${relevantNodeIdConnections[0].pre} - ${postLabel}`;
        }  else {
          let combinedPreLabels = `${relevantNodeIdConnections.map( r => r.pre ).join(', ')}`;
          let preLabel = useBracketsInDisplayLabel ? `Pre: (${combinedPreLabels})` : `Pre: ${combinedPreLabels}`;

          displayLabel = `${preLabel} - Post: ${relevantNodeIdConnections[0].post}`;
        }
        nodeInfo[nodeId] = {
          displayLabel,
          type: 'Chemical Synapse'
        };
      });

      Array.from(uniqueNodeIdsInGapJunctions).forEach( nodeId => {
        let relevantNodeIdConnections = res.filter( r => r.pre_tid === nodeId || r.post_tid === nodeId );
        let displayLabel = `${relevantNodeIdConnections[0].pre} - ${relevantNodeIdConnections[0].post}`;

        nodeInfo[nodeId] = {
          displayLabel,
          type: 'Gap Junction'
        };
      });

      return {
        nodeInfo,
        connectedNeuronNames: Array.from(connectedNeuronNames)
      };
    });
};

module.exports = {
  getNematodeCells,
  getNematodeDatasetJson,
  getNematodeConnections,
  getNematodeDatasets,
  getNematodeNeuronTrajectories,
  getTrajectoryNodeData
};
