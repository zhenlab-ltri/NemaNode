/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

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


test('hide selected nodes', function(){
  let m = new Model();

  m.select(['ASE']);

  m.hideSelected();

  expect( m.getSelected() ).toEqual( [] );
  expect( m.getHidden() ).toEqual( ['ASE'] );

});


test('selected group members are removed from their group before being hidden', function(){
  let m = new Model();

  m.select(['ASE']);

  let g0 = m.createGroup({ open: true });
  m.addMembersToGroup( g0, ['ASE', 'ASER']);

  m.setPosition( g0, { x: 0, y: 0 } );

  m.hideSelected();

  expect( m.getSelected() ).toEqual( [] );
  expect( m.getHidden() ).toEqual( ['ASE'] );
  expect( m.getGroupById( g0 ).members ).toEqual( ['ASER'] );
  expect( m.isGroupMember( 'ASE') ).toEqual( false );
});

test('selected group nodes are closed before being hidden', function(){
  let m = new Model();
  let g0 = m.createGroup();

  m.select([g0]);
  m.setPosition( {[g0]: { x: 0, y: 0 }} );

  m.hideSelected();

  expect( m.getSelected() ).toEqual( [] );
  expect( m.getHidden() ).toEqual( [g0] );
  expect( m.getGroupById( g0 ).open ).toEqual( false );
});

test('unhide', function(){
  let m = new Model();

  m.setHidden(['ASE', 'ASER']);

  m.unhide( ['ASER'] );

  expect( m.getHidden() ).toEqual(['ASE']);
});


test('hiding the only group member in a group will properly hide the group member and remove the group', function(){
  let m = new Model();
  let g0 = m.createGroup( { open: true });
  m.addMembersToGroup( g0, ['ASE'] );
  m.select(['ASE']);

  m.setPosition( g0, { x: 0, y: 0 } );

  m.hideSelected();

  expect( m.getSelected() ).toEqual( [] );
  expect( m.getHidden() ).toEqual( ['ASE'] );
});


