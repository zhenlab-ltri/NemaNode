/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');

let connection;
let Model = require('../../src/client/js/model');
let DataService = require('../../src/client/js/data-service');

beforeAll(() => {
  return db.connect({ useTestDatabase: true }).then( c => {
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


test('grow selected when showLinked set to true', function(){
  let m = new Model();

  m.setDatabase('head');
  m.setShowLinked(true);
  m.select(['ASE']);
  m.addInput(['AIY']);
  m.hide(['ASE']);

  m.growSelected();

  expect( m.getInput() ).toEqual( ['AIY', 'ASE'] );
  expect( m.getHidden() ).toEqual( [] );
});

test('grow network ( note: not sure how this code is ever hit, cant hit this code path through the ui )', function(){
  let m = new Model();

  m.setDatabase('head');
  m.setShowLinked(false);
  m.select(['ASE']);
  m.addInput(['AIY']);
  m.hide(['ASE']);

  let toAdd = ['ASE', 'AIY'];
  let connections = [
    { pre: 'RIM', post: 'RIA' } ,
    { pre: 'SAA', post: 'ASH' }
  ];

  m.growNetwork( toAdd, connections );

  expect( m.getInput() ).toEqual( ['AIY', 'RIM', 'RIA', 'SAA', 'ASH'] );
  expect( m.getHidden() ).toEqual( ['ASE'] );
});
