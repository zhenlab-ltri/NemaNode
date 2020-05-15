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


test('get selected', function(){
  let m = new Model();

  m.setSelected(['ASE', 'AIY']);

  expect( m.getSelected() ).toEqual( ['ASE', 'AIY'] );

  m.setSelected(['ASE']);

  expect( m.getSelected() ).toEqual( ['ASE'] );
});

test('getting selected includes the group members of selected groups but not the group itself', function(){
  let m = new Model();

  let gId = m.createGroup();

  m.addMembersToGroup( gId, ['ASE']);

  m.setSelected( [gId, 'AIY'] );

  expect( m.getSelected() ).toEqual( ['ASE', 'AIY'] );
});

test('split selected cells', function(){
  let m = new Model();

  m.setSelected(['ASE']);
  m.setDatabase('head');
  m.setDatasets([]);
  m.splitSelected();
  expect( m.getSplit() ).toEqual( ['ASE'] );
  expect( m.getSelected() ).toEqual( ['ASEL', 'ASER'] );
});

test('you cant split classes of cells specific to the adult complete dataset', function(){
  let m = new Model();
  let classesSpecificToAdultCompleteDataset = [
    'BODYWALLMUSCLES',
    'PM2',
    'PM3',
    'PM5',
    'PM6',
    'PM7',
    'MC1',
    'MC2',
    'MC3',
    'G1',
    'G2',
    'DEFECATIONMUSCLES'
  ];

  m.setSelected([
    ...classesSpecificToAdultCompleteDataset,
    'ASE'
  ]);

  m.on('warning', o => {
    let { id, arr } = o;
    expect( id ).toEqual( 'legacySplitAttempt');
    expect( arr ).toEqual( classesSpecificToAdultCompleteDataset );
  });

  m.setDatabase('complete');
  m.setDatasets(['adult']);

  m.splitSelected();

  expect( m.getSplit() ).toEqual( ['ASE'] );
});

test('if a class is in a group, its class members are added to the group', function(){
  let m = new Model();
  let gId = m.createGroup();
  m.addMembersToGroup( gId, ['ASE']);
  m.setPosition( gId, { x: 0, y: 0 } );
  m.setPosition( 'ASE', { x: 0, y: 0 } );

  m.select(['ASE']);
  m.setDatabase('head');
  m.setDatasets([]);

  m.splitSelected();

  expect( m.getGroupById( gId ).members ).toEqual( ['ASEL', 'ASER'] );
  expect( m.isGroupMember( 'ASE' ) ).toEqual( false );
  expect( m.isGroupMember( 'ASER') ).toEqual( true );
  expect( m.isGroupMember( 'ASEL') ).toEqual( true );
});


test('class members are positioned in a circle around the class to split', function(){
  let m = new Model();

  m.lockPositions( {ASE: { x: 100, y: 100 } } );
  m.select('ASE');
  m.setDatabase('head');
  m.setDatasets([]);

  m.splitSelected();

  expect( m.positionExists( 'ASER' ) ).toEqual( true );
  expect( m.positionExists( 'ASEL' ) ).toEqual( true );
  expect( m.nodePositionIsLocked( 'ASER' ) ).toEqual( true );
  expect( m.nodePositionIsLocked( 'ASEL' ) ).toEqual( true );

});


test('classes in the input are replaced by their members', function(){
  let m = new Model();

  m.setDatabase('head');
  m.setDatasets([]);
  m.select(['ASE']);
  m.addInput(['ASE']);

  m.splitSelected();

  expect( m.getInput().includes( 'ASER' ) ).toEqual( true );
  expect( m.getInput().includes( 'ASEL' ) ).toEqual( true );
});

test('members joined', function(){
  let m = new Model();

  m.select(['ASER', 'ASEL']);
  m.setDatabase('head');
  m.setDatasets([]);

  m.joinSelected();

  expect( m.getJoined().includes( 'ASE' ) ).toEqual( true );
  expect( m.getSplit().includes( 'ASE' ) ).toEqual( false );
});

test('members joined', function(){
  let m = new Model();

  m.select(['ASER', 'ASEL']);
  m.setDatabase('head');
  m.setDatasets([]);

  m.joinSelected();

  expect( m.getJoined().includes( 'ASE' ) ).toEqual( true );
  expect( m.getSplit().includes( 'ASE' ) ).toEqual( false );
});

test('joined class will have the mean position of its members', function(){
  let m = new Model();

  m.select(['ASER', 'ASEL']);
  m.setPositions( {
    ASER: { x: 0, y: 0 },
    ASEL: { x: 100, y: 100 }
  });

  m.setDatabase('head');
  m.setDatasets([]);

  m.joinSelected();

  expect( m.getJoined().includes( 'ASE' ) ).toEqual( true );
  expect( m.getSplit().includes( 'ASE' ) ).toEqual( false );

  expect( m.getPosition( 'ASE' ) ).toEqual( { x: 50, y: 50 } );
});


test('joined class will have its position locked if there are more than one locked positions', function(){
  let m = new Model();

  m.select(['ASER', 'ASEL']);
  m.lockPositions( {
    ASER: { x: 0, y: 0 },
    ASEL: { x: 100, y: 100 }
  });

  m.setDatabase('head');
  m.setDatasets([]);

  m.joinSelected();

  expect( m.getJoined().includes( 'ASE' ) ).toEqual( true );
  expect( m.getSplit().includes( 'ASE' ) ).toEqual( false );

  expect( m.getPosition( 'ASE' ) ).toEqual( { x: 50, y: 50 } );
  expect( m.nodePositionIsLocked('ASE') ).toEqual( true );
});

test(`
  class members are ungrouped before joining,
  class is added to the first group that contains a member,
  groups with 0 members after these operations are removed`, function(){
  let m = new Model();

  m.select(['ASER', 'ASEL']);

  let g0 = m.createGroup();
  m.addMembersToGroup( g0, ['ASER'] );
  let g1 = m.createGroup();
  m.addMembersToGroup( g1, ['ASEL'] );

  m.setDatabase('head');
  m.setDatasets([]);

  m.setPositions( {
    [g0]: { x: 1, y: 1},
    [g1]: { x: 0, y: 0}
  });

  expect( m.getGroups().length ).toEqual( 2 );

  m.joinSelected();

  expect( m.getGroups().length ).toEqual( 1 );
  expect( m.getGroupById( g1 ).members.includes('ASE')).toEqual( true );
  expect( () => m.getGroupById( g0 ) ).toThrow();
});

test('input is updated after joining', function(){
  let m = new Model();
  m.setDatabase('head');
  m.setDatasets([]);

  m.addInput(['ASER', 'ASEL']);
  m.select(['ASER', 'ASEL']);

  m.joinSelected();

  expect( m.getInput() ).toEqual( ['ASE'] );
});

test(`class members that are hidden are unhidden before joining`, function(){
  let m = new Model();

  m.setDatabase('head');
  m.setDatasets([]);
  m.select(['ASER']);

  m.hide(['ASEL']);

  m.joinSelected();

  expect( m.getHidden() ).toEqual( [] );
  expect( m.getSelected() ).toEqual( ['ASE'] );
});