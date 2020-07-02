const getDatasetTypes = (ds) => Array.from(ds.getDatabaseList());

const getRandom = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomCell = (ds) => getRandom(ds.cells);

const getRandomDatasetType = (ds) => getRandom(getDatasetTypes(ds));

const createModelStateSetUpFn = (ds) => {
  const randomDatasetType = getRandomDatasetType(ds);
  const datasets = ds.getDatasetList(randomDatasetType);

  return (opts) =>
    Object.assign(
      {
        database: randomDatasetType,
        datasets,
        input: [],
        selected: [],
        showLinked: true,
        showPostemb: true,
        showIndividual: false,
        split: [],
        joined: [],
        hidden: [],
        groups: {},
        nodeColor: 'type',
        showEdgeLabel: false,
        positions: {},
        lockedPositions: [],
      },
      opts
    );
};

module.exports = {
  getDatasetTypes,
  getRandom,
  getRandomCell,
  getRandomDatasetType,
  createModelStateSetUpFn,
};
