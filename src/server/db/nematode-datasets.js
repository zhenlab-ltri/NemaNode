let queryDatasets = connection => {
  let datasetsSql = `
    SELECT id, collection, name, description, time, visual_time 
    FROM datasets 
    ORDER BY id
  `;

  return connection.query(datasetsSql);
};

let queryDatasetJson = (connection, { datasetId }) => {
  datasetId = connection.escape(datasetId);
  //TODO: this is broken
  let datasetsSql = `
    SELECT dataset_json  
    FROM datasets_json 
    WHERE dataset_id=${datasetId}
  `;

  return connection.query(datasetsSql);
};

module.exports = {
  queryDatasets,
  queryDatasetJson
};
