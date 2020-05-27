require('regenerator-runtime');

const ini = require('ini');
const fs = require('fs');
const path = require('path');
const db = require('../src/server/db');
const { cleanPopulateDb } = require('../src/server/populate-db');

const DB_INI_FILE = '../test_database_config.ini';
const dbIni = ini.parse(fs.readFileSync(path.join(__dirname, DB_INI_FILE), 'utf-8'));
const TEST_DB_OPTS = dbIni.mysql;

module.exports = async () => {
  console.log('populating test db');
  const connection = await db.connect(TEST_DB_OPTS);
  await cleanPopulateDb(connection);
};