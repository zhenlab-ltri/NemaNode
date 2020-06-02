/* eslint no-console: "off" */

const { connect } = require('../db');
const { cellList, datasetList, loadConnectionData, loadAnnotationData, loadTrajectoryData } = require('./load-data');
const populateCells = require('./populate-cells');
const {
  populateDatasets
} = require('./populate-datasets');
const {
  populateConnections,
  populateAnnotations
} = require('./populate-connections');
const {
  populateNeuronTrajectories
} = require('./populate-neuron-trajectories');


const depopulateDb = (conn) => {
  return Promise.all([
    conn.query('SET FOREIGN_KEY_CHECKS = 0'),
    conn.query('TRUNCATE TABLE annotations'),
    conn.query('TRUNCATE TABLE synapses'),
    conn.query('TRUNCATE TABLE connections'),
    conn.query('TRUNCATE TABLE neurons'),
    conn.query('TRUNCATE TABLE datasets'),
    conn.query('TRUNCATE TABLE trajectories'),
    conn.query('SET FOREIGN_KEY_CHECKS = 1')
  ]);
};

const populateDb = async (conn) => {
  const connectionsJSON = loadConnectionData();
  const annotationsJSON = loadAnnotationData();
  const trajectoriesJSON = loadTrajectoryData();

  try {
    console.log('Clearing tables');
    await depopulateDb(conn);

    console.log('populating cells');
    await populateCells(conn, cellList);

    console.log('populating datasets');
    await populateDatasets(conn, datasetList);

    console.log('populating trajectories');
    await populateNeuronTrajectories(conn, trajectoriesJSON);

    console.log('populating connections');
    await populateConnections(conn, connectionsJSON);

    console.log('populating annotations');
    await populateAnnotations(conn, annotationsJSON);

  } catch (e) {
    console.log(e);
  }
};

const cleanPopulateDb = async (connection) => {
  await depopulateDb(connection);
  await populateDb(connection);
  await connection.destroy();
};


if (require.main === module) {
  (async () => {
    const connection = await connect();
    await cleanPopulateDb(connection);
  })();
}

module.exports = {
  cleanPopulateDb,
  depopulateDb
};