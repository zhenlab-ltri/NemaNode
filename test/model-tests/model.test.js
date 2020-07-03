/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const { getRandomDatasetType } = require('../test-util');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');

let connection;
let Model = require('../../src/client/js/model');
let DataService = require('../../src/client/js/data-service');

beforeAll(() => {
  return db
    .connect({ useTestDatabase: true })
    .then((c) => {
      connection = c;
      return connection;
    })
    .then((connection) => {
      return Promise.all([
        queryNematodeCells(connection),
        queryNematodeDatasets(connection),
      ]).then((data) => {
        let [cells, datasets] = data;
        DataService.load(cells, datasets);
      });
    });
});

afterAll(() => {
  return connection.end();
});

test('model.clear', function () {
  let m = new Model();

  m.clear();

  expect(m.input).toEqual([]);
});

test('mode.getState', function () {
  let m = new Model();

  const datasetType = getRandomDatasetType(DataService);
  const datasets = DataService.getDatasetList(datasetType);
  m.setDatabase(datasetType);

  m.setDatasets(datasets);

  m.setLayout('concentric');
  m.setNodeColor('type');
  m.setShowEdgeLabel(false);
  m.setShowIndividual(false);
  m.setShowLinked(false);
  m.setShowPostemb(true);
  m.setThresholdChemical(3);
  m.setThresholdElectrical(2);

  m.lockPositions({ AIY: { x: 1, y: 1 } });

  let gId = m.createGroup({ name: 'G' });

  m.addMembersToGroup(gId, ['AIY']);

  expect(m.getState(['AIY', '0'])).toEqual({
    database: datasetType,
    datasets: datasets,
    nodeColor: 'type',
    layout: 'concentric',
    thresholdChemical: 3,
    thresholdElectrical: 2,
    showLinked: false,
    showIndividual: false,
    showEdgeLabel: false,
    showPostemb: true,
    input: [],
    hidden: [],
    split: [],
    join: [],
    selected: [],
    legendItems: [],
    groups: [
      {
        id: '0',
        name: 'G',
        members: ['AIY'],
        open: false,
      },
    ],
    coordinates: [
      {
        id: 'AIY',
        x: 1,
        y: 1,
      },
    ],
  });
});
