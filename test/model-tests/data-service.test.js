/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');

let connection;
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

test('dataservice.exists', function(){
  expect(DataService.exists('LEGACYBODYWALLMUSCLES', 'head')).toEqual( false );
  expect(DataService.exists('LEGACYBODYWALLMUSCLES', 'tail')).toEqual( false );
  expect(DataService.exists('LEGACYBODYWALLMUSCLES', 'complete')).toEqual( false );

  expect(DataService.exists('BODYWALLMUSCLES', 'head')).toEqual( true );
  expect(DataService.exists('BODYWALLMUSCLES', 'tail')).toEqual( false );
  expect(DataService.exists('BODYWALLMUSCLES', 'complete')).toEqual( true );

  expect(DataService.exists('BWM-VL20', 'head')).toEqual( false );
  expect(DataService.exists('BWM-VL20', 'tail')).toEqual( false );
  expect(DataService.exists('BWM-VL20', 'complete')).toEqual( true );
});


test('dataservice.getDatabaseList', function(){
  expect(Array.from(DataService.getDatabaseList())).toBeInstanceOf(Array);
});

test('dataservice throws error when calling a method before it has loaded', function(){
  DataService.loaded = false;

  expect(() => DataService.cellClass('BODYWALLMUSCLES')).toThrow();

  DataService.loaded = true;
});


test('dataservice should be able to provide the adult complete dataset', function(){
  expect( DataService.getAdultCompleteDataset() ).toBeDefined();
});

test('dataservice gets body wall muscle cells class as a function of the datasets it is given', function(){
  const completeDatasets = DataService.getDatasetList('complete');
  const nonCompleteDataset = DataService.getDatasetList('head')[0];

  expect( DataService.getBodyWallMuscleClass('BWM-DL01', [nonCompleteDataset])).toEqual('BWM01');

  expect( DataService.getBodyWallMuscleClass('BWM-DL01', completeDatasets)).toEqual('BODYWALLMUSCLES');
});

test('dataservice valid nodes are different depending on the dataset type', function(){
  const isIndividual = false;
  const completeDatasets = DataService.getDatasetList('complete');
  const headDatasets = DataService.getDatasetList('head');
  const completeDatasetsValidNodes = DataService.getValidNodes( isIndividual, 'complete', completeDatasets );
  const headDatasetsValidNodes = DataService.getValidNodes( isIndividual, 'head', headDatasets );

  // there should be head specific nodes, complete specific nodes
  expect(completeDatasetsValidNodes).not.toEqual(headDatasetsValidNodes);

  // valid nodes should not contain duplicates
  expect(completeDatasetsValidNodes.length).toEqual(new Set(completeDatasetsValidNodes).size);
  expect(headDatasetsValidNodes.length).toEqual(new Set(headDatasetsValidNodes).size);

});

test('dataservice can get the ids of all the datasets', function(){

  expect( DataService.getDatasetList('complete').length).toBeGreaterThan(0);

});
