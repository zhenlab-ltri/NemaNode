/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');

const testUtil = require('../test-util');

let connection;
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

test('dataservice.exists should return false when invalid data is given as arguments', function () {
  const randomCell = testUtil.getRandomCell(DataService);
  const randomDatasetType = testUtil.getRandomDatasetType(DataService);
  expect(
    typeof DataService.exists(randomCell, randomDatasetType) === 'boolean'
  ).toBe(true);
});

test('dataservice.exists should throw an error if dataset type does not exist', function () {
  const randomCell = testUtil.getRandomCell(DataService);
  const invalidCell = 'some_cell_that_does_not_exist';
  const invalidDatasetType = 'some_dataset_that_does_not_exist';

  expect(() => DataService.exists(randomCell, invalidDatasetType)).toThrow();
  expect(() => DataService.exists(invalidCell, invalidDatasetType)).toThrow();
});

test('dataservice.getDatasetList should get a list of datasets by a given dataset type', function () {
  const datasetTypes = testUtil.getDatasetTypes(DataService);

  datasetTypes.forEach((type) => {
    const datasets = DataService.getDatasetList(type);
    expect(datasets).toBeInstanceOf(Array);
    expect(datasets.length).toBeGreaterThan(0);
  });
});

test('dataservice throws an error when calling a method before it has loaded', function () {
  DataService.loaded = false;

  expect(() => DataService.cellClass('some junk')).toThrow();
  expect(() => DataService.cellClass('AVA')).toThrow();

  DataService.loaded = true;

  const randomCell = testUtil.getRandomCell(DataService);
  expect(() => DataService.cellClass(randomCell)).not.toThrow();
});

test('dataservice has a dedicated function for getting the data of the adult complete dataset', function () {
  expect(DataService.getAdultCompleteDataset()).toBeDefined();
});
