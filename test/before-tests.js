/* eslint no-console: "off" */

require('regenerator-runtime');

const db = require('../src/server/db');
const { cleanPopulateDb } = require('../src/server/populate-db');


module.exports = async () => {
  console.log('populating test db');
  const connection = await db.connect({ useTestDatabase: true });
  await cleanPopulateDb(connection);
};