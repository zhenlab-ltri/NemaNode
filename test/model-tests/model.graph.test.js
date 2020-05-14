/* global  test, expect */

let Graph = require('../../src/client/js/model/graph');



test('add a node to a graph', function(){
  let g = new Graph();

  g.addNode('ASE', { a: 1} );

  expect( g.nodes() ).toEqual( ['ASE'] );
});

test('you can only add a node once', function(){
  let g = new Graph();

  g.addNode('ASE', { a: 1 } );

  expect( g.nodes() ).toEqual( ['ASE'] );

  expect( g.node.get( 'ASE' ) ).toEqual( { a: 1 } );

  g.addNode('ASE', { b: 1 });

  expect( g.node.get( 'ASE' ) ).toEqual( { a: 1 } );
});


test('removing a node that is not in the graph does nothing', function(){
  let g = new Graph();

  g.addNode( 'AIY' );

  g.removeNode('ASE');

  expect( g.nodes() ).toEqual( [ 'AIY' ] );
});

test('remove a node', function(){
  let g = new Graph();

  g.addNode( 'AIY' );
  g.addNode( 'ASE' );

  g.removeNode('ASE');

  expect( g.nodes() ).toEqual( [ 'AIY' ] );
});

test('a isolated node has no connections ', function(){
  let g = new Graph();

  g.addNode( 'AIY' );

  expect( g.isIsolated( 'AIY' ) ).toEqual( true );
});

test('source and target do not need to be added before adding an edge', function(){
  let g = new Graph();

  g.addEdge('ASE', 'AIY');

  expect( g.nodes() ).toEqual( ['ASE', 'AIY'] );
});

test('you can specify whether the edge is chemical or electrical', function(){
  let g = new Graph();

  g.addEdge('ASE', 'AIY', 'electrical');

  expect( g.nodes() ).toEqual( ['ASE', 'AIY'] );
});
