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


test(`
  group AWA, AWC
  hide group,
  add AWC to input
  group should be unhidden and open
`, function(){
  let m = new Model();

  m.setDatabase('head');
  let gId = m.createGroup();
  m.addMembersToGroup( gId, ['AWA', 'AWC'] );

  m.closeGroup( gId );
  m.setSelected( [gId ]);
  m.hideSelected();

  m.setPositions({
    [gId]: {
      x: 0,
      y: 0
    },
    AWA: {
      x: 0,
      y: 0
    },
    AWC: {
      x: 0,
      y: 0
    }
  });

  expect( m.getHidden() ).toEqual( [ gId ] );

  m.setInput( ['AWC'] );

  expect( m.getHidden() ).toEqual( [] );
  expect( m.getGroupById( gId ).open ).toEqual( true );
});

