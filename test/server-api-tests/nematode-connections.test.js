/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeConnections = require('../../src/server/db/nematode-connections');

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
