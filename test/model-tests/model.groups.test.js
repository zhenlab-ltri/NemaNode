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


test('close all groups', function(){
  let m = new Model();

  m.select(['ASE']);

  let g0 = m.createGroup({ open: true });
  m.addMembersToGroup( g0, ['ASER', 'ASEL'] );

  m.setPositions({
    ASER: { x: 0, y: 0 },
    ASEL: { x: 100, y: 100 }
  });

  m.closeAllGroups();

  expect( m.getGroupById( g0 ).open ).toEqual( false );
  expect( m.getPosition( g0 ) ).toEqual( { x: 50, y: 50 });

  m.closeAllGroups();

  expect( m.getGroupById( g0 ).open ).toEqual( false );
});

test('close selected groups', function(){
  let m = new Model();

  let g0 = m.createGroup({ open: true });
  m.addMembersToGroup( g0, ['ASER', 'ASEL'] );
  m.select([g0]);

  let g1 = m.createGroup({ open: true });
  m.addMembersToGroup( g1, ['RIM', 'SAA'] );

  m.setPositions({
    ASER: { x: 0, y: 0 },
    ASEL: { x: 100, y: 100 }
  });


  m.closeSelectedGroups();

  expect( m.getGroupById( g0 ).open ).toEqual( false );
  expect( m.getPosition( g0 ) ).toEqual( { x: 50, y: 50 });

  expect(  m.getGroupById( g1).open  ).toEqual( true );
});

test('open selected groups', function(){
  let m = new Model();

  let g0 = m.createGroup({ open: false });
  m.addMembersToGroup( g0, ['ASER', 'ASEL'] );
  m.select([g0]);

  let g1 = m.createGroup({ open: false });
  m.addMembersToGroup( g1, ['RIM', 'SAA'] );


  m.setPositions({
    [g0]: { x: 0, y: 0 },
    ASER: { x: 0, y: 0 },
    ASEL: { x: 100, y: 100 }
  });

  m.openSelectedGroups();

  expect( m.getGroupById( g0 ).open ).toEqual( true );
  expect( m.getGroupById( g1 ).open ).toEqual( false );

  m.select([g0]);
  m.openSelectedGroups();

  expect(  m.getGroupById( g0 ).open).toEqual( true );
});

test('ungrouping a group with one member removes the group', function(){
  let m = new Model();

  m.select(['ASE']);
  let g0 = m.createGroup({ open: true });
  m.addMembersToGroup( g0, ['ASE'] );

  m.setPositions({
    [g0]: { x: 0, y: 0 },
    ASE: { x: 0, y: 0 }
  });

  m.ungroupSelected();

  expect( () => m.getGroupById( g0 ) ).toThrow();
});

test('ungrouping a group', function(){
  let m = new Model();

  let g0 = m.createGroup({ open: false });
  m.addMembersToGroup( g0, ['ASE'] );
  m.select([ g0 ]);


  m.setPositions({
    [g0]: { x: 0, y: 0 },
    ASE: { x: 0, y: 0 }
  });

  m.ungroupSelected();

  expect( () => m.getGroupById( g0 ) ).toThrow();
  expect( m.getSelected() ).toEqual( ['ASE'] );
  expect( m.isGroupMember( 'ASE' ) ).toEqual( false );
});


test('group selected', function(){
  let m = new Model();

  m.select(['ASE', 'AIY']);

  m.lockPositions({
    ASE: { x: 0, y: 0 },
    AIY: { x: 0, y: 0 }
  });

  let g0 = m.groupSelected();

  expect( m.getGroupById( g0 ) ).toBeDefined();
  expect( m.getGroupById( g0 ).members ).toEqual( ['ASE', 'AIY'] );
  expect( m.isGroupMember( 'ASE' ) ).toEqual( true );
  expect( m.nodePositionIsLocked( g0 ) ).toEqual( true );

});


test('group selected with one group', function(){
  let m = new Model();
  let g0 = m.createGroup( { open: false });
  m.addMembersToGroup( g0, ['ASE'] );

  m.setPositions({
    [g0]: { x: 0, y: 0 },
    ASE: { x: 0, y: 0 },
    AIY: { x: 0, y: 0 }
  });

  m.select([g0, 'AIY']);


  m.groupSelected();

  expect( m.getRawSelected() ).toEqual( [g0] );
  expect( m.isGroupMember( 'AIY' ) ).toEqual( true );
});


test('group selected with only one group and nothing to group does nothing', function(){
  let m = new Model();
  let g0 = m.createGroup( { open: false } );
  m.addMembersToGroup( g0, ['ASE'] );

  m.select(['0']);

  m.setPositions({
    0: { x: 0, y: 0 },
    ASE: { x: 0, y: 0 },
    AIY: { x: 0, y: 0 }
  });

  m.groupSelected();

  expect( m.getGroupById( g0 ).members ).toEqual( ['ASE'] );
});


test('group selected with a group member', function(){
  let m = new Model();

  m.select(['ASE', 'AIY']);

  let g0 = m.createGroup({
    open: false
  });

  m.addMembersToGroup( g0, ['ASE'] );

  m.setPositions({
    0: { x: 0, y: 0 },
  });

  m.groupSelected();

  expect( m.getGroupById( g0 ).members.includes('AIY') ).toEqual( true );
  expect( m.isGroupMember( 'AIY' ) ).toEqual( true );
});