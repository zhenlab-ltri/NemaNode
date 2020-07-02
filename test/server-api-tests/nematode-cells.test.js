/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const expectedCells = require('./nematode-cells.json');

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

test('get cells from the db', function () {
  return queryNematodeCells(connection).then((res) => {
    expect(res).toEqual(expectedCells);
  });
});
