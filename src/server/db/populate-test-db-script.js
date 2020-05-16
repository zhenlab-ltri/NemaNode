const { connectTest } = require('./index');
const { populateDb, depopulateDb } = require('./populate-db');


(async () => {
  let connection = await connectTest();
  await depopulateDb(connection);
  await populateDb(connection);
  await connection.destroy();
})();