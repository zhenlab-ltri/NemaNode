let queryCells = async connection => {
  let cellsSql = `
    SELECT name, class, type, neurotransmitter, embryonic, inhead, intail
    FROM neurons
    ORDER BY name
  `;

  /*let cellsTrajectorySql = `
    SELECT DISTINCT neuron_name from trajectories
  `;

  let cellsWithTrajectories = await connection.query(cellsTrajectorySql).map( 
    c => `${c.neuron_name}` 
  );
  let uniqueCellsWithTrajectories = new Set(cellsWithTrajectories);
  */

  const [rows, ] = await connection.query(cellsSql);

  return rows.map(cell => {
    cell.intail = !!cell.intail; // transform 1, 0 into booleans
    cell.inhead = !!cell.inhead;
    cell.embryonic = !!cell.embryonic;
    cell.name = `${cell.name}`;
    //cell.hasTrajectory = uniqueCellsWithTrajectories.has(cell.name);

    return cell;
  });
};

module.exports = queryCells;
