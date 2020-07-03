/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');

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
    res.forEach((cell) => {
      expect(cell).toHaveProperty('name');
      expect(cell).toHaveProperty('class');
      expect(cell).toHaveProperty('type');
      expect(cell).toHaveProperty('neurotransmitter');
      expect(cell).toHaveProperty('embryonic');
      expect(cell).toHaveProperty('inhead');
      expect(cell).toHaveProperty('intail');
    });
  });
});
