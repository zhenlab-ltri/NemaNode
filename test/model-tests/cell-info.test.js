/* global beforeAll, afterAll, test, expect */

const CellInfo = require('../../src/client/js/cell-info');
let ci;
beforeEach( () => {
  ci = new CellInfo();
} );

test('adding a cell registers cell class information', function(){
  ci.addCell('ASER', 'ASE', 'l', 's', true, true, false);

  expect(ci.cellClass['ASER']).toEqual( 'ASE' );
  expect(ci.cellClass['ASE']).toEqual( null );
  expect(ci.classMembers['ASE']).toEqual( ['ASER'] );
});

test('body wall muscles are special cases because there are incomaptibilities wiht how they are represented across datasets', function(){
  ci.addCell('BWM-DL01', 'BWM01', 'b', 'n', true, true, false);

  expect( ci.cellClassLegacy['BWM-DL01'] ).toEqual( 'BODYWALLMUSCLES' );
  expect( ci.cellClassNonLegacy['BWM-DL01'] ).toEqual( 'BWM01' );

  expect( ci.classMembersLegacy['BODYWALLMUSCLES'] ).toEqual( ['BWM-DL01'] );
  expect( ci.classMembersNonLegacy['BWM-DL01'] ).toEqual( [] );
  expect( ci.classMembersNonLegacy['BWM01'] ).toEqual( ['BWM-DL01'] );
});

test('VCN cell class info is hard coded', function(){
  ci.addCell('VC1', 'VCN', 'im', 'a', false, false, false);

  expect( ci.nt['VCN'] ).toEqual( 'as' );
  expect( ci.type['VCN'] ).toEqual( 'imn' );
});

test('adding a cell is categorized as a valid node base on its intail/inhead properties', function(){
  ci.addCell('VD12', 'VDN', 'm', 'g', false, false, true);

  expect( ci.validNodes.head.includes( 'VD12' ) ).toEqual( false );
  expect( ci.validNodes.tail.includes( 'VD12' ) ).toEqual( true );
});

test('set to legacy sets class info to be compatible for comparison with legacy datasts', function(){
  ci.addCell('BWM-DL01', 'BWM01', 'b', 'n', true, true, false);

  expect( ci.cellClassLegacy ).toEqual( {
    "BODYWALLMUSCLES": null,
    "BWM-DL01": "BODYWALLMUSCLES"
  } );
  expect( ci.cellClassNonLegacy ).toEqual( {
    "BWM-DL01": "BWM01",
    "BWM01": null
  } );

  ci.setToLegacy();

  expect( ci.cellClass ).toEqual( {
    "BODYWALLMUSCLES": null,
    "BWM-DL01": "BODYWALLMUSCLES"
  } );

  ci.setToNonLegacy();
  // expect( ci.cellClass ).toEqual( [] );

  expect( ci.cellClass ).toEqual( {
    "BODYWALLMUSCLES": null,
    "BWM-DL01": "BWM01",
    "BWM01": null,
  } );
});