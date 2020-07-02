/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeConnections = require('../../src/server/db/nematode-connections');

const fixture1 = require('./nematode-connections-1.json');
const fixture2 = require('./nematode-connections-2.json');
const fixture3 = require('./nematode-connections-3.json');

let connection;

beforeAll(() => {
  return db.connect({ useTestDatabase: true }).then((c) => {
    connection = c;
    return connection;
  });
});

afterAll(() => {
  return connection.end();
});

test('get no connections when cells option is empty', function () {
  let expected = [];

  let opts = {
    cells: [],
    datasetType: 'head',
    datasetIds: [
      'SEM_adult',
      'SEM_L1_2',
      'SEM_L1_3',
      'SEM_L1_4',
      'SEM_L2_2',
      'TEM_adult',
      'TEM_L1_5',
      'TEM_L3',
      'white_ad',
      'white_l4',
    ],
    thresholdChemical: 3,
    thresholdElectrical: 2,
    includeNeighboringCells: true,
    includeAnnotations: true,
  };

  return expect(queryNematodeConnections(connection, opts)).resolves.toEqual(
    expected
  );
});

test('returns no annotations when includeAnnotations is set to false', function () {
  let opts = {
    cells: [],
    datasetType: 'head',
    datasetIds: [
      'SEM_adult',
      'SEM_L1_2',
      'SEM_L1_3',
      'SEM_L1_4',
      'SEM_L2_2',
      'TEM_adult',
      'TEM_L1_5',
      'TEM_L3',
      'white_ad',
      'white_l4',
    ],
    thresholdChemical: 3,
    thresholdElectrical: 2,
    includeNeighboringCells: true,
    includeAnnotations: false,
  };

  return queryNematodeConnections(connection, opts).then((res) => {
    res.forEach((connection) => {
      expect(connection.annotations).toEqual([]);
    });
  });
});
