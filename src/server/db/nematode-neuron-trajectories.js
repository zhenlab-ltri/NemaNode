let queryTrajectoryNodeData = async (connection, opts) => {
  let nodeIds = connection.escape(opts.nodeIds);

  let nodeDataSql = `
    SELECT *
    FROM trajectory_node_data
    WHERE pre_tid in (${nodeIds}) OR post_tid in (${nodeIds})
  `;

  let nodeData = await connection.query(nodeDataSql);

  return nodeData;
};

let queryNeuronTrajectories = async (connection, opts) => {
  let datasetId = connection.escape(opts.datasetId);
  let neuronNames = connection.escape(opts.neuronNames);

  let trajectoriesSql = `
    SELECT *
    FROM trajectories
    WHERE dataset_id=${datasetId} AND neuron_name in (${neuronNames})
  `;

  let trajectorySynapsesSql = `
    SELECT id, post_node_id, pre_node_id, type
    FROM trajectory_synapses
    WHERE dataset_id=${datasetId}
  `;

  let trajectories = await connection.query(trajectoriesSql);
  let trajectorySynapses = await connection.query(trajectorySynapsesSql);

  return {
    trajectories,
    trajectorySynapses
  };
};

let datasetsWithATrajectory = connection => {
  let sql = `SELECT DISTINCT dataset_id FROM trajectories`;

  return connection.query(sql).map(r => r.dataset_id);
};

// cache the neurons that each dataset has a trajectory for
// e.g.
//  SEM_adult -> ['AWAR', ...]
//  TEM_adult -> [..., ...]
let datasetNeuronTrajectoryMap = new Map();

let populateDatasetNeuronTrajectoryMap = connection => {
  let neuronDatasetIdPairsSql = `SELECT neuron_name, dataset_id FROM trajectories`;

  return connection.query(neuronDatasetIdPairsSql).then(neuronDatasets => {
    neuronDatasets.forEach(({ neuron_name, dataset_id }) => {
      if (datasetNeuronTrajectoryMap.has(dataset_id)) {
        datasetNeuronTrajectoryMap.get(dataset_id).add(neuron_name);
      } else {
        datasetNeuronTrajectoryMap.set(dataset_id, new Set().add(neuron_name));
      }
    });
  });
};

let getDatasetsThatContainNeuronTrajectories = (
  connection,
  { neuronNames }
) => {
  let getDatasetsContainingNeuronTrajectories = () => {
    if (neuronNames.length === 0) {
      return [];
    }

    return Array.from(datasetNeuronTrajectoryMap.keys()).filter(datasetId => {
      return neuronNames
        .map(neuronName =>
          datasetNeuronTrajectoryMap.get(datasetId).has(neuronName)
        )
        .reduce((acc, curVal) => acc && curVal, true);
    });
  };

  if (datasetNeuronTrajectoryMap.size === 0) {
    return populateDatasetNeuronTrajectoryMap(connection).then(() => {
      return getDatasetsContainingNeuronTrajectories();
    });
  } else {
    return Promise.resolve().then(() => {
      return getDatasetsContainingNeuronTrajectories();
    });
  }
};

module.exports = {
  queryTrajectoryNodeData,
  queryNeuronTrajectories,
  datasetsWithATrajectory,
  getDatasetsThatContainNeuronTrajectories
};
