const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const ini = require('ini');

const queryCells = require('./nematode-cells');
const queryDatasets = require('./nematode-datasets');
const queryConnections = require('./nematode-connections');
const downloadConnectivity = require('./download-data');
/*const {
  queryTrajectoryNodeData,
  queryNeuronTrajectories,
  datasetsWithATrajectory,
  getDatasetsThatContainNeuronTrajectories
} = require('./nematode-neuron-trajectories');*/

const DB_INI_FILE = '../../../config.ini';
const dbIni = ini.parse(
  fs.readFileSync(path.join(__dirname, DB_INI_FILE), 'utf-8')
);


let connect = ({useTestDatabase = false} = {}) => {
  let { database, user, password } = dbIni.mysql;
  if (useTestDatabase) {
    database = dbIni.mysql.test_database;
  }

  return mysql
    .createConnection({
      host: 'localhost',
      user,
      password,
      database
    });
};

const queryNematodeCells = async () => {
  const connection = await connect();
  const cells = await queryCells(connection);
  await connection.destroy();
  return cells;
};

const queryNematodeDatasets = async () => {
  const connection = await connect();
  const datasets = await queryDatasets(connection);
  await connection.destroy();
  return datasets;
};

const queryNematodeConnections = async (opts) => {
  const connection = await connect();
  const connections = await queryConnections(connection, opts);
  await connection.destroy();
  return connections;
};

const downloadNematodeConnectivity = async (opts) => {
  const connection = await connect();
  const downloadFile = await downloadConnectivity(connection, opts);
  await connection.destroy();
  return downloadFile;
};

/*


let queryDatasetsWithATrajectory = async opts => {
  let connection = await connect();
  let datasets = await datasetsWithATrajectory(connection, opts);
  await connection.destroy();
  return datasets;
};
let queryNematodeNeuronTrajectories = async opts => {
  let connection = await connect();
  let trajectories = await queryNeuronTrajectories(connection, opts);
  await connection.destroy();

  return trajectories;
};

let queryDatasetTrajectories = async opts => {
  let connection = await connect();
  let datasetsWithNeuronTrajectories = await getDatasetsThatContainNeuronTrajectories(connection, opts);
  await connection.destroy();

  return datasetsWithNeuronTrajectories;
};

let queryNematodeTrajectoryNodeData = async opts => {
  let connection = await connect();
  let trajectoryNodeData = await queryTrajectoryNodeData(connection, opts);
  await connection.destroy();

  return trajectoryNodeData;
};*/

module.exports = {
  connect,
  queryNematodeCells,
  queryNematodeDatasets,
  queryNematodeConnections,
  downloadNematodeConnectivity
  //queryDatasetsWithATrajectory,
  //queryNematodeDatasetJson,
  //queryNematodeTrajectoryNodeData,
  //queryNematodeNeuronTrajectories,
  //queryDatasetTrajectories
};
