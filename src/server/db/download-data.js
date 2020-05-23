const downloadConnectivity = async (conn, opts) => {

  const {
    datasetId
  } = opts;

  // Only query individual cells.
  const neurons = await conn.query('SELECT name FROM neurons').map((n) => `"${n.name}"`);

  const sql = `
    SELECT pre, post, type, synapses
    FROM connections
    WHERE dataset_id = "${datasetId}"
    AND pre IN (${neurons})
    AND post IN (${neurons})
    ORDER BY pre, post, type
  `;

  return conn.query(sql);
};

module.exports = downloadConnectivity;
