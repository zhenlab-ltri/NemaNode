const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/api/cells', (req, res) => {
  db.queryNematodeCells().then(cells => res.json(cells));
});

router.get('/api/datasets', async (req, res) => {
  const datasets = await db.queryNematodeDatasets();
  /*let datasetsWithATrajectory = new Set(
    await db.queryDatasetsWithATrajectory()
  );

  datasets.forEach(d => {
    if (datasetsWithATrajectory.has(d.id)) {
      d.hasTrajectory = true;
    } else {
      d.hasTrajectory = false;
    }
  });*/

  return res.json(datasets);
});




router.get('/api/download-connectivity', (req, res) => {
  const {datasetId} = req.query;
  const opts = {
    datasetId
  };
  db.downloadNematodeConnectivity(opts).then((connections) => res.json(connections));
});

router.get('/api/connections', (req, res) => {
  const {
    cells,
    datasetIds,
    datasetType,
    thresholdChemical,
    thresholdElectrical,
    includeNeighboringCells,
    includeAnnotations
  } = req.query;

  const opts = {
    cells,
    datasetIds,
    datasetType,
    thresholdChemical,
    thresholdElectrical,
    includeNeighboringCells,
    includeAnnotations
  };

  db.queryNematodeConnections(opts).then((connections) => res.json(connections));
});

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */
router.get('*', (req, res /*, next*/) => {
  res.render('index.html');
});


/*
router.get('/api/neuron-trajectories', (req, res) => {
  let { neuronName, datasetId } = req.query;
  let neuronNames = [].concat(neuronName);

  db.queryNematodeNeuronTrajectories({ neuronNames, datasetId }).then(
    trajectories => res.json(trajectories)
  );
});

router.get('/api/trajectory-ids', (req, res) => {
  db.queryNematodeNeuronTrajectories().then(ids => res.json(ids));
});

router.get('/api/dataset-trajectories', (req, res) => {
  let neuronNames = [].concat(req.query.neuronNames);

  db.queryDatasetTrajectories({ neuronNames }).then(r => res.json(r));
});

router.get('/api/trajectory-node-data', (req, res) => {
  let nodeIds = [].concat(req.query.nodeIds);

  db.queryNematodeTrajectoryNodeData({nodeIds}).then(r => res.json(r));
});*/


module.exports = router;
