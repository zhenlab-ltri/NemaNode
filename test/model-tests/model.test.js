/* global beforeAll, afterAll, test, expect */
const ini = require('ini');
const fs = require('fs');
const path = require('path');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');


const DB_INI_FILE = '../../test_database_config.ini';
const dbIni = ini.parse(fs.readFileSync(path.join(__dirname, DB_INI_FILE), 'utf-8'));
const TEST_DB_OPTS = dbIni.mysql;

let connection;
let Model = require('../../src/client/js/model');
let DataService = require('../../src/client/js/data-service');

beforeAll(() => {
  return db.connect(TEST_DB_OPTS).then( c => {
    connection = c;
    return connection;
  }).then( connection => {
    return Promise.all([
      queryNematodeCells( connection ),
      queryNematodeDatasets( connection )
    ]).then( data => {
      let [ cells, datasets ] = data;
      DataService.load( cells, datasets );
    });
  });
});

afterAll(() => {
   return connection.end();
});

test('model.clear', function(){
  let m = new Model();

  m.clear();

  expect(m.input).toEqual([]);
});



test('mode.getState', function(){
  let m = new Model();

  m.setDatabase('head');

  m.setDatasets(["SEM_adult", "SEM_L1_2", "SEM_L1_3", "SEM_L1_4", "SEM_L2_2", "TEM_adult", "TEM_L1_5", "TEM_L3", "white_ad", "white_l4"]);

  m.setLayout('concentric');
  m.setNodeColor('type');
  m.setShowEdgeLabel(false);
  m.setShowIndividual(false);
  m.setShowLinked(false);
  m.setShowPostemb(true);
  m.setThresholdChemical(3);
  m.setThresholdElectrical(2);

  m.lockPositions( { AIY: { x: 1, y: 1 } } );

  let gId = m.createGroup({ name: 'G' });

  m.addMembersToGroup( gId, ['AIY'] );

  expect( m.getState(['AIY', '0']) ).toEqual( {
    "database": "head",
    "datasets": [
      "SEM_L1_3",
      "TEM_L1_5",
      "SEM_L1_4",
      "SEM_L1_2",
      "SEM_L2_2",
      "TEM_L3",
      "white_l4",
      "TEM_adult",
      "SEM_adult",
      "white_ad",
    ],
    "nodeColor": "type",
    "layout": "concentric",
    "thresholdChemical": 3,
    "thresholdElectrical": 2,
    "showLinked": false,
    "showIndividual": false,
    "showEdgeLabel": false,
    "showPostemb": true,
    "input": [],
    "hidden": [],
    "split": [],
    "join": [],
    "selected": [],
    "legendItems": [],
    "groups": [
      {
        id: '0',
        name: 'G',
        members: ['AIY'],
        open: false
      }
    ],
    "coordinates": [
      {
        id: 'AIY',
        x: 1,
        y: 1
      }
    ]
  } );
});
