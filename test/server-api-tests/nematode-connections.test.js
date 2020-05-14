/* global beforeAll, afterAll, test, expect */

const ini = require('ini');
const fs = require('fs');
const path = require('path');

const db = require('../../src/server/db');

const queryNematodeConnections = require('../../src/server/db/nematode-connections');

const fixture1 = require('./nematode-connections-1.json');
const fixture2 = require('./nematode-connections-2.json');
const fixture3 = require('./nematode-connections-3.json');

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

test('get no connections when cells option is empty', function(){
  let expected = [];

  let opts = {
    cells: [],
    "datasetType": "head",
    "datasetIds": [
      "SEM_adult", "SEM_L1_2", "SEM_L1_3", "SEM_L1_4", "SEM_L2_2", "TEM_adult", "TEM_L1_5", "TEM_L3", "white_ad", "white_l4"
    ],
    "thresholdChemical": 3,
    "thresholdElectrical": 2,
    "includeNeighboringCells": true,
    "includeAnnotations": true
  };

  return expect(queryNematodeConnections( connection, opts )).resolves.toEqual(expected);
});

test('gets non-imaged connections when legacy datasets are included in options', function(){
  let expected = fixture3;

  let opts = {
    cells: ['BODYWALLMUSCLES'],
    datasetType: 'complete',
    datasetIds: ['l1', 'adult'],
    includeAnnotations: true,
    includeNeighboringCells: true,
    thresholdChemical: 3,
    thresholdElectrical: 2
  };

  return queryNematodeConnections( connection, opts ).then( res => {
    expect( res ).toEqual( expected );
  });
});

test('returns no annotations when includeAnnotations is set to false', function(){
  let opts = {
    cells: [],
    "datasetType": "head",
    "datasetIds": [ "SEM_adult", "SEM_L1_2", "SEM_L1_3", "SEM_L1_4", "SEM_L2_2", "TEM_adult", "TEM_L1_5", "TEM_L3", "white_ad", "white_l4"],
    "thresholdChemical": 3,
    "thresholdElectrical": 2,
    "includeNeighboringCells": true,
    "includeAnnotations": false
  };

  return queryNematodeConnections( connection, opts ).then( res => {
    res.forEach( connection => {
      expect(connection.annotations).toEqual( [] );
    });
  });
});