const downloadConnectivity = async (conn, opts) => {

  const {
    datasetId
  } = opts;

  // Only query individual cells.
  const [neurons, ] = await conn.query('SELECT name FROM neurons');

  const neuronNames = neurons.map((n) => `"${n.name}"`);

  const sql = `
    SELECT pre, post, type, synapses
    FROM connections
    WHERE dataset_id = "${datasetId}"
    AND pre IN (${neuronNames})
    AND post IN (${neuronNames})
    ORDER BY pre, post, type
  `;

  const [rows, ] = await conn.query(sql);

  return rows;
};

module.exports = downloadConnectivity;
