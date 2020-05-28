const downloadConnectivity = async (conn, opts) => {

  const {
    datasetId
  } = opts;

  // Only query individual cells.
  const [neurons, ] = await conn.query('SELECT name FROM neurons')[0].map((n) => `"${n.name}"`);

  const sql = `
    SELECT pre, post, type, synapses
    FROM connections
    WHERE dataset_id = "${datasetId}"
    AND pre IN (${neurons})
    AND post IN (${neurons})
    ORDER BY pre, post, type
  `;

  const [rows, ] = await conn.query(sql);

  return rows;
};

module.exports = downloadConnectivity;
