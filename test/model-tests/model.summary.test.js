/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

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

test('a set of nodes can only be renamed if there is exactly one group', function () {
  let m = new Model();

  let gId = m.createGroup();

  expect(m.canBeRenamed([gId])).toEqual(true);

  let gId1 = m.createGroup();

  expect(m.canBeRenamed([gId, gId1])).toEqual(false);
});

test('a set of nodes can only be closed if there is atleast one open group', function () {
  let m = new Model();
  let gId = m.createGroup({ open: true });

  expect(m.canBeClosed([gId])).toEqual(true);

  m.closeGroup(gId);

  expect(m.canBeClosed([gId])).toEqual(false);
});

test('a set of nodes can only be opened if there is atleast one closed group', function () {
  let m = new Model();
  let gId = m.createGroup({ open: false });

  m.setPosition(gId, { x: 0, y: 0 });

  expect(m.canBeOpened([gId])).toEqual(true);

  m.openGroup(gId);

  expect(m.canBeOpened([gId])).toEqual(false);
});

test('a set of nodes can be ungrouped when there is atleast one group member', function () {
  let m = new Model();

  let gId = m.createGroup({ open: false });
  m.addMembersToGroup(gId, ['ASE']);
  m.setPosition(gId, { x: 0, y: 0 });

  expect(m.canBeUngrouped(['ASE'])).toEqual(true);

  m.ungroup('ASE');

  expect(m.canBeUngrouped(['ASE'])).toEqual(false);
});

test('a set of nodes can be grouped when it has less than two groups and more node that is not a group member', function () {
  let m = new Model();
  let gId = m.createGroup({ open: false });
  m.addMembersToGroup(gId, ['ASE']);
  m.setPosition(gId, { x: 0, y: 0 });

  expect(m.canBeGrouped(['ASE', gId])).toEqual(false);

  m.ungroup('ASE');

  expect(m.canBeGrouped(['ASE', gId])).toEqual(true);

  let gId1 = m.createGroup();
  let gId2 = m.createGroup();

  expect(m.canBeGrouped(['ASE', gId1, gId2])).toEqual(false);
});

test('a set of nodes can be split when there is atleast one class cell', function () {
  let m = new Model();

  expect(m.canBeSplit(['ASE', 'ASER'])).toEqual(true);

  expect(m.canBeSplit(['ASER'])).toEqual(false);
});

test('a set of nodes can be joined when there is atleast one class member cell', function () {
  let m = new Model();

  expect(m.canBeJoined(['ASER'])).toEqual(true);

  expect(m.canBeJoined(['ASE'])).toEqual(false);
});

// TODO this function should return false when set to complete adult dataset, for
// body wall muscles

// calling model.split, should return split and unsplit cells
// controller should check if the split cells contains body wall muscles and
// if the selected datasets contain adult legacy
// if these conditions are true, then you emit the notification
// remove responsibility of model from emitting logic about body wall muscle cells being split

test('even though body wall muscles should not be able to be split, this function still returns true', function () {
  let m = new Model();

  DataService.setDatasetType('complete');
  expect(m.canBeSplit(['BODYWALLMUSCLES'])).toEqual(true);
});
