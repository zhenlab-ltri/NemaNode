const mysql = require('promise-mysql');
const fs = require('fs');
const path = require('path');
const ini = require('ini');

const queryCells = require('./nematode-cells');
const {
  queryDatasets,
  queryDatasetJson
} = require('./nematode-datasets');
const queryConnections = require('./nematode-connections');
const {
  queryTrajectoryNodeData,
  queryNeuronTrajectories,
  datasetsWithATrajectory,
  getDatasetsThatContainNeuronTrajectories
} = require('./nematode-neuron-trajectories');

const DB_INI_FILE = '../../../database_config.ini';
const TEST_DB_INI_FILE = '../../../test_database_config.ini';
const dbIni = ini.parse(
  fs.readFileSync(path.join(__dirname, DB_INI_FILE), 'utf-8')
);
const testDbIni = ini.parse(
  fs.readFileSync(path.join(__dirname, TEST_DB_INI_FILE), 'utf-8')
);
const DEFAULT_DB_OPTS = dbIni.mysql;
const TEST_DB_OPTS = testDbIni.mysql;

let connect = opts => {
  let { database, user, password } = Object.assign(DEFAULT_DB_OPTS, opts);

  return mysql
    .createConnection({
      host: 'localhost',
      user,
      password,
      database
    });
};

let connectTest = () => connect(TEST_DB_OPTS);

let queryNematodeCells = async () => {
  let connection = await connect();
  let cells = await queryCells(connection);
  await connection.destroy();

  return cells;
};

let queryNematodeDatasets = async () => {
  let connection = await connect();
  let datasets = await queryDatasets(connection);
  await connection.destroy();

  return datasets;
};

let queryNematodeDatasetJson = async opts => {
  let connection = await connect();
  let datasetJSON = await queryDatasetJson(connection, opts);
  await connection.destroy();

  return datasetJSON;
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
};

let queryDatasetsWithATrajectory = async opts => {
  let connection = await connect();
  let datasets = await datasetsWithATrajectory(connection, opts);
  await connection.destroy();

  return datasets;
};

let queryNematodeConnections = async opts => {
  let connection = await connect();
  let connections = await queryConnections(connection, opts);
  await connection.destroy();

  return connections;
};

module.exports = {
  connect,
  connectTest,
  queryNematodeCells,
  queryNematodeDatasets,
  queryNematodeDatasetJson,
  queryNematodeConnections,
  queryNematodeTrajectoryNodeData,
  queryNematodeNeuronTrajectories,
  queryDatasetsWithATrajectory,
  queryDatasetTrajectories
};
