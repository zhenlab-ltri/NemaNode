/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');

const util = require('../test-util');

let connection;
let DataService = require('../../src/client/js/data-service');
let Model = require('../../src/client/js/model');

let getTestModelState;

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
        getTestModelState = util.createModelStateSetUpFn(DataService);
      });
    });
});

afterAll(() => {
  return connection.end();
});

test('model cytoscape node creation', function () {
  let m = new Model();
  let n = 'ASE';
  let modelState = getTestModelState({
    input: [n],
  });

  const node = m.makeCytoscapeNode(n, modelState);

  expect(node.data.id).toEqual(n);
  expect(node.group).toEqual('nodes');
  expect(node.data.name).toEqual(n);

  modelState.showLinked = false;

  expect(
    m.makeCytoscapeNode(n, modelState).classes.includes('nolinked')
  ).toEqual(true);

  modelState.hidden = modelState.hidden.concat([n]);

  expect(m.makeCytoscapeNode(n, modelState).classes.includes('hidden')).toEqual(
    true
  );
});

test('model cytoscape edge creation', function () {
  let m = new Model();
  let u = 'ASE';
  let v = 'AIY';
  let type = 0;
  let attrs = {
    synapses: {},
    annotations: [],
  };

  let modelState = getTestModelState({
    input: [u],
  });

  const edge = m.makeCytoscapeEdge(u, v, type, attrs, modelState);
  expect(edge.data.source).toEqual(u);
  expect(edge.data.target).toEqual(v);
});

test('model cytoscape group node creation', function () {
  let m = new Model();

  let group = '0';
  let members = ['AIZ'];
  let modelState = getTestModelState({
    input: ['ASE'],
    selected: [group],
    groups: {
      [group]: {
        id: group,
        name: 'Group',
        open: false,
        members: members,
      },
    },
    positions: {
      [group]: {
        x: 720,
        y: 79,
      },
      ASE: {
        x: 720,
        y: 399,
      },
      AIZ: {
        x: 720,
        y: 79,
      },
    },
  });

  const groupNode = m.makeCytoscapeNode(group, modelState);
  expect(groupNode.data.id).toEqual(group);
  expect(groupNode.classes.includes('parentNode')).toEqual(true);
  expect(groupNode.selected).toEqual(true);

  expect(m.makeCytoscapeNode(members[0], modelState).data.parent).toEqual('0');
});

test('joined cells are removed', function () {
  let m = new Model();
  let connections = [
    {
      pre: 'ASER',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    joined: ['ASE'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR']);
});

test('class cells are removed', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'ASER',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    split: ['ASE'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR', 'ASER']);
});

test('showIndividual removes class cells', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'ASER',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showIndividual: true,
    split: ['ASE'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR', 'ASER']);
});

test('post embryonic cells are removed when showPostEmbryonic is false', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'AQR',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    split: ['ASE'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR']);
});

test('groups without members are not added', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'AQR',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    split: ['ASE'],
    groups: {
      '0': {
        id: '0',
        name: 'Group',
        open: false,
        members: [],
      },
    },
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR']);
});

test('closed groups with members inherit the edges of their members and the edge annotations and synapses are unioned', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'RIA',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    groups: {
      '0': {
        id: '0',
        name: 'Group',
        open: false,
        members: ['ASE', 'RIA'],
      },
    },
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.edges)).toEqual(['0-0-AIYR']);
});

test('hidden nodes are removed', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'RIA',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showLinked: true,
    showPostemb: false,
    hidden: ['ASE'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR', 'RIA']);
});

test('hidden group nodes are removed', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'RIA',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: ['increase'],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    hidden: ['0'],
    groups: {
      '0': {
        id: '0',
        name: 'Group',
        open: true,
        members: ['RIA'],
      },
    },
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(Object.keys(res.nodes)).toEqual(['AIYR', 'ASE']);
});

test('nodes that have locked positions have the same position', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'RIA',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    positions: {
      ASE: { x: 0, y: 1 },
      RIA: { x: 5, y: 5 },
    },
    lockedPositions: ['ASE', 'RIA'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(res.positions['ASE']).toEqual(modelState.positions['ASE']);
  expect(res.positions['RIA']).toEqual(modelState.positions['RIA']);
});

test('open groups are not positioned', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'RIA',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = undefined;

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    groups: {
      '0': {
        id: '0',
        name: 'Group',
        open: true,
        members: ['ASE', 'RIA'],
      },
    },
    positions: {
      ASE: { x: 0, y: 1 },
      RIA: { x: 5, y: 5 },
    },
    lockedPositions: ['ASE', 'RIA'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(res.positions['ASE']).toEqual(modelState.positions['ASE']);
  expect(res.positions['RIA']).toEqual(modelState.positions['RIA']);
});

test('minor update type keeps locked positions', function () {
  let m = new Model();

  let connections = [
    {
      pre: 'RIA',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
    {
      pre: 'ASE',
      post: 'AIYR',
      type: 'chemical',
      synapses: {},
      annotations: [],
    },
  ];

  let updateType = 'minor';

  let modelState = getTestModelState({
    input: ['AIYR'],
    showPostemb: false,
    groups: {
      '0': {
        id: '0',
        name: 'Group',
        open: true,
        members: ['ASE', 'RIA'],
      },
    },
    positions: {
      ASE: { x: 0, y: 1 },
    },
    lockedPositions: ['ASE'],
  });

  let res = m.convertModelToCytoscape(connections, updateType, modelState);

  expect(res.positions['ASE']).toEqual(modelState.positions['ASE']);
  expect(res.nodes['RIA'].classes.includes('unpositioned')).toEqual(true);
});
