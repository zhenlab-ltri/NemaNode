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

module.exports = {
  populateNeuronTrajectories
};
