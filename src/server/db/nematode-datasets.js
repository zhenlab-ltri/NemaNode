let queryDatasets = connection => {
  let datasetsSql = `
    SELECT id, collection, name, description, time, visual_time 
    FROM datasets 
    ORDER BY id
  `;

  return connection.query(datasetsSql);
};

module.exports = queryDatasets;
