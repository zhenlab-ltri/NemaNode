const getDatasetTypes = (ds) => Array.from(ds.getDatabaseList());

const getRandom = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomCell = (ds) => getRandom(ds.cells);

const getRandomDatasetType = (ds) => getRandom(getDatasetTypes(ds));

module.exports = {
  getDatasetTypes,
  getRandom,
  getRandomCell,
  getRandomDatasetType,
};
