const { connect } = require('./index');
const { populateDb, depopulateDb } = require('./populate-db');


(async () => {
  let connection = await connect();
  await depopulateDb(connection);
  await populateDb(connection);
  await connection.destroy();
})();