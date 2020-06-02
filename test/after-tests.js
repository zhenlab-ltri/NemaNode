/* eslint no-console: "off" */

require('regenerator-runtime');

const db = require('../src/server/db');
const { depopulateDb } = require('../src/server/populate-db');

module.exports = async () => {
  console.log('depopulating test db');
  const connection = await db.connect({ useTestDatabase: true });
  await depopulateDb(connection);
  process.exit();
};