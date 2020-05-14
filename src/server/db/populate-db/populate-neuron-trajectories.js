let populateNeuronTrajectories = async (connection, trajectoriesJSON) => {
  const TABLE = 'trajectories';
  const TABLE_FIELDS = ['id', 'dataset_id', 'neuron_name', 'trajectory_json'];

  let sql = `INSERT INTO ${TABLE} ( ${TABLE_FIELDS.join(', ')} ) VALUES ?`;

  trajectoriesJSON.forEach(async trajectory => {
    let { trajectoryId, neuronName, datasetId, json } = trajectory;
    let value = [trajectoryId, datasetId, neuronName, JSON.stringify(json)];

    await connection.query(sql, [[value]]);
  });
};

let populateTrajectorySynapses = async (connection, trajectorySynapsesJSON) => {
  const TABLE = 'trajectory_synapses';
  const TABLE_FIELDS = [
    'id',
    'dataset_id',
    'post_node_id',
    'pre_node_id',
    'type'
  ];

  let sql = `INSERT INTO ${TABLE} ( ${TABLE_FIELDS.join(', ')} ) VALUES ?`;

  Object.entries(trajectorySynapsesJSON).forEach(
    ([datasetId, datasetSynapses]) => {
      Object.values(datasetSynapses).forEach(async synapse => {
        let { synapseId, postNodeId, preNodeId, type } = synapse;
        let value = [synapseId, datasetId, postNodeId, preNodeId, type];

        await connection.query(sql, [[value]]);
      });
    }
  );
};

module.exports = {
  populateNeuronTrajectories,
  populateTrajectorySynapses
};
