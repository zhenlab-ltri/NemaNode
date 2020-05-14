let populateDatasets = async (connection, datasets) => {
  const TABLE = 'datasets';
  const TABLE_FIELDS = [
    'id',
    'collection',
    'name',
    'description',
    'time',
    'visual_time'
  ];

  let values = datasets.map(dataset => {
    let { id, type, name, description, time, visualTime } = dataset;
    return [id, type, name, description, time, visualTime];
  });

  await connection.query(
    `INSERT INTO ${TABLE} ( ${TABLE_FIELDS.join(', ')} ) VALUES ?`,
    [values]
  );
};

// map dataset id to dataset connections (chem synapses, gap junctions) json
let populateDatasetJson = async (connection, datasetsJSON) => {
  const TABLE = 'datasets_json';
  const TABLE_FIELDS = [
    'dataset_id',
    'dataset_json'
  ];

  let values = Object.entries(datasetsJSON).map( ([id, json]) => {
    return [id, JSON.stringify(json)];
  });

  await connection.query(
    `INSERT INTO ${TABLE} ( ${TABLE_FIELDS.join(', ')} ) VALUES ?`,
    [values]
  );
};

module.exports = {
  populateDatasets,
  populateDatasetJson
};
