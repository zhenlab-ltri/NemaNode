/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const { createGrid, createCircle } = require('../../src/client/js/model/layout');


test('grid layout has parameters, x, y, rows, and spacing', function(){

  let nodes = ['ASE', 'AIY', 'ADA'];

  let params = {
    x: 0, y: 0, rows: 3, spacing: 100
  };

  let positions = createGrid( nodes, params );

  expect( Object.keys(positions) ).toEqual( ['ASE', 'AIY', 'ADA']);
});

test('grid layout with long name', function(){

  let nodes = ['ASEASEASE', 'AIY', 'ADA'];

  let params = {
    x: 2, y: 0, rows: 3, spacing: 100
  };

  let positions = createGrid( nodes, params );

  expect( Object.keys(positions) ).toEqual( ['ASEASEASE', 'AIY', 'ADA']);
});


test('circle layout changes depending on the number of nodes', function(){

  let nodes = ['RMED', 'AIY', 'ADA', 'SAA', 'RIM', 'RIA', 'AWA'];
  let nodesWithoutRMED = ['ASE', 'AIY', 'ADA', 'SAA', 'RIM', 'RIA', 'AWA'];

  let params = {
    x: 0, y: 0
  };


  Array.from(Array(7)).forEach( (_, index) => {
    let nodeSet = nodes.slice(0, index);
    let nodeSet2 = nodesWithoutRMED.slice( 0, index );
    let positions = createCircle( nodeSet, params );
    let positions2 = createCircle( nodeSet2, params );

    expect( Object.keys(positions).length ).toEqual( index );
    expect( Object.keys(positions2).length ).toEqual( index );

  });
});

