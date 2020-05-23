/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const ini = require('ini');
const fs = require('fs');
const path = require('path');
const db = require('../../src/server/db');

const { getDatasetsThatContainNeuronTrajectories } = require('../../src/server/db/nematode-neuron-trajectories');


const DB_INI_FILE = '../../test_database_config.ini';
const dbIni = ini.parse(fs.readFileSync(path.join(__dirname, DB_INI_FILE), 'utf-8'));
const TEST_DB_OPTS = dbIni.mysql;

let connection;

beforeAll(() => {
  return db.connect(TEST_DB_OPTS).then( c => {
    connection = c;
    return connection;
  });
});

afterAll(() => {
   return connection.end();
});

test('empty neuron names input gives empty output', function(){
  let input = { neuronNames: [] };
  let expected = [];

  expect(getDatasetsThatContainNeuronTrajectories( connection, input )).resolves.toEqual(expected);
});

test('get the list of datasets that contain a neuron trajectory for the given neuron', function(){
  let input = { neuronNames: ['AQR'] };
  let expected = [
    "SEM_L1_2",
    "SEM_L2_2",
    "TEM_L3",
    "TEM_adult",
    "SEM_adult"
  ];

  expect(getDatasetsThatContainNeuronTrajectories( connection, input )).resolves.toEqual(expected);
});

test('get the list of datasets that contain a neuron trajectory for all of the given neuron names', function(){
  let input = { neuronNames: ['AQR', 'AIAR'] };
  let expected = [
    "SEM_L1_2",
    "SEM_L2_2",
    "TEM_L3",
    "TEM_adult",
    "SEM_adult"
  ];

  expect(getDatasetsThatContainNeuronTrajectories( connection, input )).resolves.toEqual(expected);
});


test('get the list of datasets that contain a neuron trajectory for all of the given neuron names', function(){
  let input = { neuronNames: ['AQR', 'AVM'] };
  let expected = [
    "SEM_L2_2",
    "TEM_L3",
    "TEM_adult",
    "SEM_adult"
  ];

  expect(getDatasetsThatContainNeuronTrajectories( connection, input )).resolves.toEqual(expected);
});