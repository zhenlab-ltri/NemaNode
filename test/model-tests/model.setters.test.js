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


test('set database', function(){
  let m = new Model();

  m.setDatabase('head');

  expect( m.database ).toEqual( 'head' );
});

test('set datasets', function(){
  let m = new Model();

  m.setDatabase('complete');
  m.setDatasets(['adult', 'l1']);

  expect( m.datasets ).toEqual( ['l1', 'adult'] );
});

test('set node color', function(){
  let m = new Model();

  m.setNodeColor('nt');

  expect( m.nodeColor ).toEqual( 'nt' );
});

test('set layout', function(){
  let m = new Model();

  m.setLayout('dagre');

  expect( m.layout ).toEqual( 'dagre' );
});

test('set threshold chemical', function(){
  let m = new Model();

  m.setThresholdChemical(3);

  expect( m.thresholdChemical ).toEqual( 3 );
});

test('set threshold electrical', function(){
  let m = new Model();

  m.setThresholdElectrical(3);

  expect( m.thresholdElectrical ).toEqual( 3 );
});

test('set show linked', function(){
  let m = new Model();

  m.setShowLinked( false );

  expect( m.showLinked ).toEqual( false );
});

test('set show individual', function(){
  let m = new Model();

  m.setDatabase( 'complete' );
  m.setDatasets( ['adult', 'l1'] );
  m.setShowIndividual( false );

  expect( m.showIndividual ).toEqual( false );
});

test('set show edge label', function(){
  let m = new Model();

  m.setShowEdgeLabel( false );

  expect( m.showEdgeLabel ).toEqual( false );
});

test('set show post emb', function(){
  let m = new Model();

  m.setShowPostemb( false );

  expect( m.showPostemb ).toEqual( false );
});


test('set hidden', function(){
  let m = new Model();

  m.setHidden( ['ASE'] );

  expect( m.hidden ).toEqual( ['ASE'] );
});

test('set groups', function(){
  let m = new Model();

  m.parent = {
    ASE: '0'
  };

  m.groups[0] = {
    id: '0',
    name: 'g',
    open: true,
    members: ['ASE']
  };

  let newGroups = [{
    id: '1',
    name: '1',
    open: false,
    members: ['AIY']
  }];

  m.setGroups( newGroups );

  expect( m.groups[1] ).toEqual( newGroups[0] );
});

test('set group name', function(){
  let m = new Model();

  m.parent = {
    ASE: '0'
  };

  m.groups[0] = {
    id: '0',
    name: 'g',
    open: true,
    members: ['ASE']
  };

  let newName = 'a';

  m.setGroupName( 0, newName );

  expect( m.groups[0].name ).toEqual( newName );
});


test('set group name', function(){
  let m = new Model();

  m.parent = {
    ASE: '0'
  };

  m.groups[0] = {
    id: '0',
    name: 'g',
    open: true,
    members: ['ASE']
  };

  let newName = 'a';

  m.setGroupName( 0, newName );

  expect( m.groups[0].name ).toEqual( newName );
});


test('setting positions doesnt reset positions, it extends them', function(){
  let m = new Model();
  m.positions = {
    AIY: { x: 0, y: 0 }
  };

  let newPositions = {
    ASER: { x: 1, y: 1 }
  };

  m.setPositions( newPositions );

  expect( m.positions ).toEqual( {
    ASER: { x: 1, y: 1 },
    AIY: { x: 0, y: 0 }
  } );
});

test('set selected', function(){
  let m = new Model();
  m.selected = ['ASE', 'RIM'];

  let newSelected = ['AIY'];

  m.setSelected( newSelected );

  expect( m.selected ).toEqual( ['AIY'] );

  m.setSelected( newSelected );

  expect( m.selected ).toEqual( ['AIY'] );
});

test('set split', function(){
  let m = new Model();
  m.split = ['RIM'];

  let newSplit = ['ASE'];

  m.setSplit( newSplit );

  expect( m.split ).toEqual( ['ASE'] );
});

test('set joined', function(){
  let m = new Model();
  m.datasets = ['l1'];
  m.joined = ['ASER', 'ASEL'];

  let newJoined = ['AINL', 'AINR'];

  m.setJoined( newJoined );

  expect( m.joined ).toEqual( ['AINL', 'AINR'] );
});

test('classes specific to the adult complete dataset are automatically joined if the adult complete dataset is set', function(){
  let m = new Model();
  m.datasets = ['adult'];
  m.joined = ['ASER', 'ASEL'];

  let newJoined = [];

  m.setJoined( newJoined );

  expect( m.joined ).toEqual( [
    "PM2",
    "PM3",
    "PM5",
    "PM6",
    "PM7",
    "MC1",
    "MC2",
    "MC3",
    "G1",
    "G2",
    "DEFECATIONMUSCLES",
    "BODYWALLMUSCLES"
  ] );
});

test('setting positions from array resets positions and locks them', function(){
  let m = new Model();
  m.positions = {
    AIY: { x: 0, y: 0 }
  };

  let newPositions = [{ id: 'ASER', x: 1, y: 1 }];

  m.setPositionsFromArray( newPositions );

  expect( m.positions ).toEqual( {
    ASER: { x: 1, y: 1 }
  } );

  expect( m.lockedPositions ).toEqual(['ASER']);
});

test('set input', function(){
  let m = new Model();

  m.datasets = ['adult'];
  m.database = 'complete';
  m.setInput( ['ASE', 'AINL'] );

  expect( m.input ).toEqual( ['ASE', 'AINL'] );
});

test('set input branches', function(){
  let m = new Model();

  m.datasets = ['l1'];
  m.database = 'complete';
  m.setInput( ['ASE', 'AINL', 'AIN'] );

  expect( m.input ).toEqual( ['ASE', 'AIN'] );

  m.split = ['ASE'];

  m.setInput( ['ASE'] );

  expect( m.split ).toEqual( [] );
});


