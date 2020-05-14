let populateCells = async (connection, cellsJSON) => {
  const TABLE = 'neurons';
  const TABLE_FIELDS = [
    'name',
    'class',
    'neurotransmitter',
    'type',
    'embryonic',
    'inhead',
    'intail'
  ];

  let values = cellsJSON.map(cell => {
    return [
      cell['name'],
      cell['classes'],
      cell['nt'],
      cell['typ'],
      cell['emb'],
      cell['inhead'],
      cell['intail']
    ];
  });
  connection.query(
    `INSERT INTO ${TABLE} ( ${TABLE_FIELDS.join(', ')} ) VALUES ?`,
    [values]
  );
};

module.exports = populateCells;
