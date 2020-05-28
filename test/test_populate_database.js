const mocha = require('mocha');
const { expect } = require('chai');

const db = require('../src/server/db/');

const {
  depopulateDb,
  populateAnnotations,
  populateConnections,
  populateDatasets,
  populateCells
 } = require('../src/server/db/populate-db/');

describe('populate database', function(){

  let connection;
  before(async () => {
    connection = await db.connect({ useTestDatabase: true });
  });

  after(async () => {
    await connection.end();
  });

  beforeEach(async () => {
    await depopulateDb(connection);
  });

  it('adds c. elegans datasets to the db', function(){
    let expected = [
      {'id': 'adult', 'collection': 'complete', 'name': 'Adult', 'description': '', 'time': 45, 'visual_time': 45},
      {'id': 'l1', 'collection': 'complete', 'name': 'L1 larva', 'description': '', 'time': 0, 'visual_time': 0}
    ];
    let input = [
      {
        "id":"l1",
        "name":"L1 larva",
        "type":"complete",
        "time":0,
        "visualTime":0,
        "description": "",
        "published":false
     },
     {
        "id":"adult",
        "name":"Adult",
        "type":"complete",
        "time":45,
        "visualTime":45,
        "description":"",
        "published":true
     }];


    return populateDatasets(connection, input)
    .then( () => db.queryNematodeDatasets() )
    .then( result => {
      expect(JSON.parse(JSON.stringify(result))).to.deep.equal(expected);
    });
  }).timeout(5000);

  it('adds c. elegans cells to the db', function(){
    let expected = [
      {'name': 'ADAL', 'class': 'ADA', 'type': 'i', 'neurotransmitter': 'l', 'embryonic': true, intail: false, inhead: true},
      {'name': 'ADAR', 'class': 'ADA', 'type': 'i', 'neurotransmitter': 'l', 'embryonic': true, intail: false, inhead: true},
    ];

    let input = [
      {'name': 'ADAL', 'classes': 'ADA', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
      {'name': 'ADAR', 'classes': 'ADA', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0}
    ];

    return populateCells(connection, input)
    .then( () => db.queryNematodeCells() )
    .then( res => expect(JSON.parse(JSON.stringify(res))).to.deep.equal(expected));
  });

  it('adds c. elegans connections to the db', async function(){

    await populateDatasets(connection, [
      {'id': 'adult', 'type': 'complete', 'name': 'Adult', 'description': '', 'time': 45, 'visualTime': 45}
    ]);

    await populateCells( connection, [
        {'name': 'ADAL', 'classes': 'ADA', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
        {'name': 'ADAR', 'classes': 'ADA', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
        {'name': 'AIBL', 'classes': 'AIB', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
        {'name': 'AIBR', 'classes': 'AIB', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
        {'name': 'RIH', 'classes': 'RIH', 'typ': 'in', 'nt': 'as', 'emb': 1, 'inhead': 1, 'intail': 0},
        {'name': 'DVC', 'classes': 'DVC', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 1}
    ]);

    let expected = [
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'ADAL', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'ADAR', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADA', 'post': 'ADA', 'synapses': 2},

      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'ADAL', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'ADAR', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADAR', 'post': 'ADAL', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADA', 'post': 'ADA', 'synapses': 2},

      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'AIBL', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADAR', 'post': 'AIBR', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'AIB', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADAR', 'post': 'AIB', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADA', 'post': 'AIBL', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADA', 'post': 'AIBR', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'ADA', 'post': 'AIB', 'synapses': 2},

      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADAL', 'post': 'RIH', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'ADAL', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADAR', 'post': 'RIH', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'ADAR', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'ADA', 'post': 'RIH', 'synapses': 2},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'ADA', 'synapses': 2},

      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'RIH', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'RIH', 'synapses': 1},

      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'DVC', 'synapses': 1},
      {'type': 'electrical', 'dataset_id': 'adult', 'pre': 'DVC', 'post': 'RIH', 'synapses': 1}
    ];

    await populateConnections( connection, [
      {'pre': 'ADAL', 'post': 'ADAL', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'ADAL', 'post': 'ADAR', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},

      {'pre': 'ADAL', 'post': 'ADAL', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'ADAL', 'post': 'ADAR', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'ADAR', 'post': 'ADAL', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},

      {'pre': 'ADAL', 'post': 'AIBL', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'ADAR', 'post': 'AIBR', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},

      {'pre': 'ADAL', 'post': 'RIH', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'RIH', 'post': 'ADAL', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'ADAR', 'post': 'RIH', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'RIH', 'post': 'ADAR', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},

      {'pre': 'RIH', 'post': 'RIH', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'RIH', 'post': 'RIH', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},

      {'pre': 'RIH', 'post': 'DVC', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'},
      {'pre': 'DVC', 'post': 'RIH', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'complete'}

    ]);

    let result = await connection.query(`
    SELECT c.type, s.dataset_id, c.pre, c.post, s.synapses
    FROM connections c LEFT JOIN synapses s ON c.id = s.connection_id`);

    expect(result.length).to.equal(expected.length);

    expected.forEach(function(expectedEdge) {
      let filteredResult = result.filter( edge =>  {
        return ['pre', 'post', 'type', 'dataset_id'].every( key => {
          return expectedEdge[key] === edge[key];
        });
      });
      expect(filteredResult).to.deep.equal([expectedEdge]);
    });
  });


  it('transforms old c. elegans dataset connections to be consistent with the new datasets', async function(){

    await populateDatasets(connection, [
      {
        "id":"adult",
        "name":"Adult",
        "type":"complete",
        "time":45,
        "visualTime":45,
        "description":"",
        "published":true
     },
     {
        "id":"adult_legacy",
        "name":"Adult legacy",
        "type":"complete",
        "time":45,
        "visualTime":45,
        "description":"",
        "published":true
     }

    ]);

    await populateCells(connection, [
      {'name': 'RIH', 'classes': 'RIH', 'typ': 'in', 'nt': 'as', 'emb': 1, 'inhead': 1, 'intail': 0},
      {'name': 'BWM-DL01', 'classes': 'BWM01', 'typ': 'b', 'nt': 'n', 'emb': 1, 'inhead': 1, 'intail': 0},
      {'name': 'BWM-DL02', 'classes': 'BWM02', 'typ': 'b', 'nt': 'n', 'emb': 1, 'inhead': 1, 'intail': 0}
    ]);


    let expected = [
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'BWM-DL01', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'BWM-DL02', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'BWM01', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult', 'pre': 'RIH', 'post': 'BWM02', 'synapses': 1},

      {'type': 'chemical', 'dataset_id': 'adult_legacy', 'pre': 'RIH', 'post': 'BWM-DL01', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult_legacy', 'pre': 'RIH', 'post': 'BWM-DL02', 'synapses': 1},
      {'type': 'chemical', 'dataset_id': 'adult_legacy', 'pre': 'RIH', 'post': 'BodyWallMuscles', 'synapses': 2},
    ];

    await populateConnections(connection, [
      {'pre': 'RIH', 'post': 'BWM-DL01', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'head'},
      {'pre': 'RIH', 'post': 'BWM-DL02', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'head'}
    ]);

    await populateConnections(connection, [
      {'pre': 'RIH', 'post': 'BWM-DL01', 'typ': 0, 'syn': [1], datasetId: 'adult_legacy', datasetType: 'complete'},
      {'pre': 'RIH', 'post': 'BWM-DL02', 'typ': 0, 'syn': [1], datasetId: 'adult_legacy', datasetType: 'complete'}

    ]);

    return connection.query(`
      SELECT c.type, s.dataset_id, c.pre, c.post, s.synapses
      FROM connections c LEFT JOIN synapses s ON c.id = s.connection_id`)
      .then( result => {
        expect(result.length).to.equal(expected.length);

        expected.forEach( expectedEdge => {
          var filteredResult = result.filter( resultingEdge => {
            return ['pre', 'post', 'type', 'dataset_id'].every(key => {
              return expectedEdge[key] === resultingEdge[key];
            });
          });
          expect(filteredResult, [expectedEdge]);
        });

      });
  });

  it('adds connection annotations', async function(){

    await populateDatasets(connection, [
      {'id': 'adult', 'type': 'head', 'name': 'Adult', 'description': '', 'time': 45, 'visualTime': 45},
    ]);
    await populateCells(connection, [
      {'name': 'ADAL', 'classes': 'ADA', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
      {'name': 'ADAR', 'classes': 'ADA', 'typ': 'i', 'nt': 'l', 'emb': 1, 'inhead': 1, 'intail': 0},
      {'name': 'RIH', 'classes': 'RIH', 'typ': 'in', 'nt': 'as', 'emb': 1, 'inhead': 1, 'intail': 0}
    ]);
    await populateConnections(connection, [
      {'pre': 'ADAL', 'post': 'RIH', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'head'},
      {'pre': 'RIH', 'post': 'RIH', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'head'},
      {'pre': 'RIH', 'post': 'RIH', 'typ': 2, 'syn': [1], datasetId: 'adult', datasetType: 'head'},
      {'pre': 'ADAL', 'post': 'ADAL', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'head'},
      {'pre': 'ADAL', 'post': 'ADAR', 'typ': 0, 'syn': [1], datasetId: 'adult', datasetType: 'head'}
    ]);

    let expected = [
      {'annotation': 'annotation1', 'collection': 'head', 'pre': 'ADAL', 'post': 'RIH', 'type': 'chemical'},
      {'annotation': 'annotation1', 'collection': 'head', 'pre': 'ADA', 'post': 'RIH', 'type': 'chemical'},
      {'annotation': 'annotation1', 'collection': 'head', 'pre': 'RIH', 'post': 'RIH', 'type': 'chemical'},
      {'annotation': 'annotation2', 'collection': 'head', 'pre': 'ADAL', 'post': 'ADAL', 'type': 'chemical'},
      {'annotation': 'annotation2', 'collection': 'head', 'pre': 'ADA', 'post': 'ADA', 'type': 'chemical'},
      {'annotation': 'annotation2', 'collection': 'head', 'pre': 'ADAL', 'post': 'ADAR', 'type': 'chemical'}
    ];

    await populateAnnotations(connection, [
      {
        preClass: 'ADA',
        postClass: 'RIH',
        annotationType: 'annotation1',
        datasetType: 'head'
      },
      {
        preClass: 'RIH',
        postClass: 'RIH',
        annotationType: 'annotation1',
        datasetType: 'head'
      },
      {
        preClass: 'ADA',
        postClass: 'ADA',
        annotationType: 'annotation2',
        datasetType: 'head'
      }
    ]);

    let result = await connection.query(`
      SELECT a.annotation, a.collection, c.pre, c.post, c.type
      FROM annotations a LEFT JOIN connections c ON c.id = a.connection_id
    `);

    expect(JSON.parse(JSON.stringify(result))).to.deep.equal(expected);
  });



});

