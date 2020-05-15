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
  expect(Array.from(DataService.getDatabaseList())).toEqual( ['complete', 'tail', 'head']);
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
  expect( DataService.getBodyWallMuscleClass( 'BWM-DL01', ['l1'] ) ).toEqual( 'BWM01' );

  expect( DataService.getBodyWallMuscleClass( 'BWM-DL01', ['l1', 'adult'] ) ).toEqual( 'BODYWALLMUSCLES' );
});

test('dataservice get valid nodes found in the adult complete dataset', function(){
  let isIndividual = false;
  let database = 'complete';
  let datasets = ['adult', 'l1'];

  expect( DataService.getValidNodes( isIndividual, database, datasets ) ).toEqual( [
      "ADA",
      "ADE",
      "ADF",
      "ADL",
      "AFD",
      "AIA",
      "AIB",
      "AIM",
      "AIN",
      "AIY",
      "AIZ",
      "ALA",
      "ALM",
      "ALN",
      "DEFECATIONMUSCLES",
      "AQR",
      "ASN",
      "ASE",
      "ASG",
      "ASH",
      "ASI",
      "ASJ",
      "ASK",
      "AUA",
      "AVA",
      "AVB",
      "AVD",
      "AVE",
      "AVF",
      "AVG",
      "AVH",
      "AVJ",
      "AVK",
      "AVL",
      "AVM",
      "AWA",
      "AWB",
      "AWC",
      "BAG",
      "BDU",
      "BODYWALLMUSCLES",
      "CAN",
      "CEP",
      "CEPSH",
      "DAN",
      "DBN",
      "DDN",
      "DVA",
      "DVB",
      "DVC",
      "EXC",
      "FLP",
      "G1",
      "G2",
      "GLR",
      "HMC",
      "HSN",
      "HYP",
      "I1",
      "I2",
      "I3",
      "I4",
      "I5",
      "I6",
      "IL1",
      "IL2",
      "LUA",
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "MC1",
      "MC2",
      "MC3",
      "MC",
      "MI",
      "NSM",
      "OLL",
      "OLQ",
      "PDA",
      "PDB",
      "PDE",
      "PHA",
      "PHB",
      "PHC",
      "PLM",
      "PLN",
      "PM1",
      "PM2",
      "PM3",
      "PM4",
      "PM5",
      "PM6",
      "PM7",
      "PM8",
      "PQR",
      "PVC",
      "PVD",
      "PVM",
      "PVN",
      "PVP",
      "PVQ",
      "PVR",
      "PVT",
      "PVW",
      "RIA",
      "RIB",
      "RIC",
      "RID",
      "RIF",
      "RIG",
      "RIH",
      "RIM",
      "RIP",
      "RIR",
      "RIS",
      "RIV",
      "RMD",
      "RME",
      "RMF",
      "RMG",
      "RMH",
      "SAA",
      "SAB",
      "SDQ",
      "SIA",
      "SIB",
      "SMB",
      "SMD",
      "URA",
      "URB",
      "URX",
      "URY",
      "VAN",
      "VBN",
      "VCN",
      "VDN"
  ] );
});

test('dataservice can get the ids of all the datasets', function(){
  expect( DataService.getDatasetList('complete') ).toEqual( ['adult', 'l1'] );
});

test('dataservice get valid nodes without the adult complete dataset', function(){
  let isIndividual = false;
  let database = 'head';
  let datasets = [];

  expect( DataService.getValidNodes( isIndividual, database, datasets ) ).toEqual( [
    "ADA",
    "ADA",
    "ADE",
    "ADE",
    "ADF",
    "ADF",
    "ADL",
    "ADL",
    "AFD",
    "AFD",
    "AIA",
    "AIA",
    "AIB",
    "AIB",
    "AIM",
    "AIM",
    "AIN",
    "AIN",
    "AIY",
    "AIY",
    "AIZ",
    "AIZ",
    "ALA",
    "ALA",
    "ALM",
    "ALM",
    "ALN",
    "ALN",
    "AQR",
    "AQR",
    "ASE",
    "ASE",
    "ASG",
    "ASG",
    "ASH",
    "ASH",
    "ASI",
    "ASI",
    "ASJ",
    "ASJ",
    "ASK",
    "ASK",
    "AUA",
    "AUA",
    "AVA",
    "AVA",
    "AVB",
    "AVB",
    "AVD",
    "AVD",
    "AVE",
    "AVE",
    "AVF",
    "AVF",
    "AVH",
    "AVH",
    "AVJ",
    "AVJ",
    "AVK",
    "AVK",
    "AVL",
    "AVL",
    "AVM",
    "AVM",
    "AWA",
    "AWA",
    "AWB",
    "AWB",
    "AWC",
    "AWC",
    "BAG",
    "BAG",
    "BDU",
    "BDU",
    "BWM01",
    "BWM02",
    "BWM03",
    "BWM04",
    "BWM05",
    "BWM06",
    "BWM07",
    "BWM08",
    "BWM01",
    "BWM02",
    "BWM03",
    "BWM04",
    "BWM05",
    "BWM06",
    "BWM07",
    "BWM08",
    "BWM01",
    "BWM02",
    "BWM03",
    "BWM04",
    "BWM05",
    "BWM06",
    "BWM07",
    "BWM08",
    "BWM01",
    "BWM02",
    "BWM03",
    "BWM04",
    "BWM05",
    "BWM06",
    "BWM07",
    "BWM08",
    "CAN",
    "CAN",
    "CEP",
    "CEP",
    "CEPSH",
    "CEPSH",
    "CEPSH",
    "CEPSH",
    "CEP",
    "CEP",
    "DVA",
    "DVA",
    "DVC",
    "DVC",
    "EXC",
    "FLP",
    "FLP",
    "GLR",
    "GLR",
    "GLR",
    "GLR",
    "GLR",
    "GLR",
    "HSN",
    "HSN",
    "HYP",
    "HYP",
    "IL1",
    "IL1",
    "IL1",
    "IL1",
    "IL1",
    "IL1",
    "IL2",
    "IL2",
    "IL2",
    "IL2",
    "IL2",
    "IL2",
    "OLL",
    "OLL",
    "OLQ",
    "OLQ",
    "OLQ",
    "OLQ",
    "PLN",
    "PLN",
    "PVC",
    "PVC",
    "PVN",
    "PVN",
    "PVP",
    "PVP",
    "PVQ",
    "PVQ",
    "PVR",
    "PVR",
    "PVT",
    "PVT",
    "RIA",
    "RIA",
    "RIB",
    "RIB",
    "RIC",
    "RIC",
    "RID",
    "RID",
    "RIF",
    "RIF",
    "RIG",
    "RIG",
    "RIH",
    "RIH",
    "RIM",
    "RIM",
    "RIP",
    "RIP",
    "RIR",
    "RIR",
    "RIS",
    "RIS",
    "RIV",
    "RIV",
    "RMD",
    "RMD",
    "RMD",
    "RMD",
    "RMD",
    "RMD",
    "RME",
    "RME",
    "RME",
    "RME",
    "RMF",
    "RMF",
    "RMG",
    "RMG",
    "RMH",
    "RMH",
    "SAA",
    "SAA",
    "SAA",
    "SAA",
    "SDQ",
    "SDQ",
    "SIA",
    "SIA",
    "SIA",
    "SIA",
    "SIB",
    "SIB",
    "SIB",
    "SIB",
    "SMB",
    "SMB",
    "SMB",
    "SMB",
    "SMD",
    "SMD",
    "SMD",
    "SMD",
    "URA",
    "URA",
    "URA",
    "URA",
    "URB",
    "URB",
    "URX",
    "URX",
    "URY",
    "URY",
    "URY",
    "URY"
  ] );
});