/* global beforeAll, afterAll, test, expect */
require('regenerator-runtime');

const ini = require('ini');
const fs = require('fs');
const path = require('path');

const db = require('../../src/server/db');

const queryNematodeCells = require('../../src/server/db/nematode-cells');
const queryNematodeDatasets = require('../../src/server/db/nematode-datasets');


const DB_INI_FILE = '../../test_database_config.ini';
const dbIni = ini.parse(fs.readFileSync(path.join(__dirname, DB_INI_FILE), 'utf-8'));
const TEST_DB_OPTS = dbIni.mysql;

let connection;
let DataService = require('../../src/client/js/data-service');
let Model = require('../../src/client/js/model');

beforeAll(() => {

  return db.connect(TEST_DB_OPTS).then( c => {
    connection = c;
    return connection;
  }).then( connection => {
    return Promise.all([
      queryNematodeCells( connection ),
      queryNematodeDatasets( connection )
    ]).then( data => {
      let [ cells, datasets ] = data;
      DataService.load( cells, datasets );
    });
  });
});

afterAll(() => {
   return connection.end();
});

test('model cytoscape node creation', function(){
  let m = new Model();
  let n = 'ASE';
  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "ASE"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {},
    "lockedPositions": []
  };

  let expected = {
    "group": "nodes",
    "classes": "searchedfor",
    "data": {
      "id": "ASE",
      "name": "ASE",
      "color": "type",
      "l": 1,
      "sensory": 1
    },
    "selected": false
  };

  expect( m.makeCytoscapeNode( n, modelState) ).toEqual( expected );

  modelState.showLinked = false;

  expect( m.makeCytoscapeNode( n, modelState ).classes.includes('nolinked') ).toEqual( true );

  modelState.hidden = modelState.hidden.concat(['ASE']);

  expect( m.makeCytoscapeNode( n, modelState ).classes.includes('hidden') ).toEqual( true );
});

test('model cytoscape edge creation', function(){
  let m = new Model();
  let u = 'ASE';
  let v = 'AIY';
  let type = 0;

  let attrs = {
    "synapses": {
      "white_l4": 32,
      "tem5": 15,
      "sem2": 20,
      "white_ad": 37,
      "sem_l2": 37,
      "tem_l3": 32,
      "sem3": 18,
      "sem4": 18,
      "tem_ad": 46
    },
    "annotations": [
      "stable"
    ]
  };

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "ASE"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {},
    "lockedPositions": []
  };

  attrs.annotations = ['decrease', 'increase'];

  expect( m.makeCytoscapeEdge( u, v, type, attrs, modelState ).classes.includes('juvenile mature') ).toEqual( true );

});

test('model cytoscape group node creation', function(){
  let m = new Model();

  let n = '0';
  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "ASE"
    ],
    "selected": [
      "0"
    ],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {
      "0": {
        "id": "0",
        "name": "Group",
        "open": false,
        "members": [
          "AIZ"
        ]
      }
    },
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
      "0": {
        "x": 720,
        "y": 79
      },
      "ASE": {
        "x": 720,
        "y": 399
      },
      "AIY": {
        "x": 720,
        "y": 719
      },
      "AWC": {
        "x": 400,
        "y": 399
      },
      "AIB": {
        "x": 1040,
        "y": 399.00000000000006
      },
      "AIZ": {
        "x": 720,
        "y": 79
      }
    },
    "lockedPositions": []
  };

  let expected = {
    "group": "nodes",
    "classes": "parentNode",
    "data": {
      "id": "0",
      "name": "Group",
      "color": "type",
      "l": 1,
      "inter": 1
    },
    "selected": true
  };

  expect( m.makeCytoscapeNode( n, modelState) ).toEqual( expected );

  n = 'AIZ';


  expect( m.makeCytoscapeNode( n, modelState ).data.parent ).toEqual( '0' );
});

test('model cytoscape adaptor converts the model to a format that cytoscape understand', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIY",
      "type": "chemical",
      "synapses": {
        "white_ad": 37,
        "sem2": 20,
        "sem_l2": 37,
        "tem_l3": 32,
        "tem_ad": 46,
        "sem3": 18,
        "sem4": 18,
        "white_l4": 32,
        "tem5": 15
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AWCR",
      "type": "chemical",
      "synapses": {
        "tem_l3": 3,
        "white_l4": 14,
        "sem4": 1,
        "tem5": 3,
        "sem2": 6,
        "sem_l2": 9,
        "tem_ad": 1,
        "white_ad": 2,
        "sem3": 2
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AWC",
      "type": "chemical",
      "synapses": {
        "sem_l2": 13,
        "tem_ad": 8,
        "white_ad": 7,
        "sem3": 3,
        "white_l4": 14,
        "tem_l3": 4,
        "tem5": 4,
        "sem4": 4,
        "sem2": 6
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIBL",
      "type": "chemical",
      "synapses": {
        "tem5": 8,
        "sem4": 10,
        "sem2": 12,
        "sem_l2": 14,
        "white_ad": 9,
        "tem_l3": 12,
        "tem_ad": 22,
        "sem3": 5,
        "white_l4": 14
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIB",
      "type": "chemical",
      "synapses": {
        "tem5": 14,
        "white_ad": 23,
        "sem_l2": 24,
        "tem_l3": 22,
        "tem_ad": 37,
        "sem3": 14,
        "sem4": 18,
        "sem2": 18,
        "white_l4": 22
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYL",
      "type": "chemical",
      "synapses": {
        "tem_l3": 14,
        "tem_ad": 24,
        "sem3": 7,
        "sem2": 10,
        "white_l4": 13,
        "tem5": 8,
        "sem4": 9,
        "sem_l2": 19,
        "white_ad": 17
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIBR",
      "type": "chemical",
      "synapses": {
        "tem_ad": 15,
        "sem3": 9,
        "sem4": 8,
        "white_l4": 8,
        "tem5": 6,
        "sem2": 6,
        "white_ad": 14,
        "sem_l2": 10,
        "tem_l3": 10
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIZL",
      "type": "electrical",
      "synapses": {
        "sem2": 1,
        "sem_l2": 2,
        "tem_l3": 3,
        "tem_ad": 2
      },
      "annotations": []
    },
    {
      "pre": "ASE",
      "post": "AIZ",
      "type": "electrical",
      "synapses": {
        "tem_ad": 2,
        "sem2": 1,
        "sem_l2": 5,
        "tem_l3": 4
      },
      "annotations": []
    },
    {
      "pre": "AIZL",
      "post": "ASE",
      "type": "electrical",
      "synapses": {
        "tem_ad": 2,
        "sem_l2": 2,
        "tem_l3": 3,
        "sem2": 1
      },
      "annotations": []
    },
    {
      "pre": "AIZ",
      "post": "ASE",
      "type": "electrical",
      "synapses": {
        "sem_l2": 5,
        "tem_l3": 4,
        "sem2": 1,
        "tem_ad": 2
      },
      "annotations": []
    },
    {
      "pre": "ASE",
      "post": "AIZR",
      "type": "electrical",
      "synapses": {
        "sem_l2": 3,
        "tem_l3": 1
      },
      "annotations": []
    },
    {
      "pre": "AIZR",
      "post": "ASE",
      "type": "electrical",
      "synapses": {
        "sem_l2": 3,
        "tem_l3": 1
      },
      "annotations": []
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "ASE"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
      "ASE": {
        "x": 720,
        "y": 399
      },
      "AWC": {
        "x": 400,
        "y": 399
      },
      "AWB": {
        "x": 720,
        "y": 79
      },
      "AIN": {
        "x": 404.86151903609345,
        "y": 343.43258314658226
      },
      "AIY": {
        "x": 720,
        "y": 719
      },
      "AFD": {
        "x": 492.68769158863427,
        "y": 407.779619300228
      },
      "AIB": {
        "x": 1040,
        "y": 399.00000000000006
      },
      "AIZ": {
        "x": 720,
        "y": 79
      },
      "AWA": {
        "x": 507.42900378069277,
        "y": 160.16918472068375
      },
      "AVH": {
        "x": 400,
        "y": 398.9999999999999
      },
      "ADL": {
        "x": 720,
        "y": 79
      },
      "AIA": {
        "x": 578.4122498242444,
        "y": 615.9863947165453
      },
      "RIA": {
        "x": 859.2531054886764,
        "y": 681.8975523015133
      },
      "ASI": {
        "x": 428.9177614865541,
        "y": 266.06719583939633
      },
      "BAG": {
        "x": 842.4586983568286,
        "y": 694.6414504036118
      },
      "HSN": {
        "x": 597.5413016431711,
        "y": 694.6414504036117
      },
      "ASK": {
        "x": 493.7258300203048,
        "y": 172.72583002030473
      }
    },
    "lockedPositions": []
  };

  let expected = {
    "nodes": {
      "ASE": {
        "group": "nodes",
        "classes": "searchedfor",
        "data": {
          "id": "ASE",
          "name": "ASE",
          "color": "type",
          "l": 1,
          "sensory": 1
        },
        "selected": false
      },
      "AIY": {
        "group": "nodes",
        "classes": "",
        "data": {
          "id": "AIY",
          "name": "AIY",
          "color": "type",
          "a": 1,
          "inter": 1
        },
        "selected": false
      },
      "AWC": {
        "group": "nodes",
        "classes": "",
        "data": {
          "id": "AWC",
          "name": "AWC",
          "color": "type",
          "l": 1,
          "sensory": 1
        },
        "selected": false
      },
      "AIB": {
        "group": "nodes",
        "classes": "",
        "data": {
          "id": "AIB",
          "name": "AIB",
          "color": "type",
          "l": 1,
          "inter": 1
        },
        "selected": false
      },
      "AIZ": {
        "group": "nodes",
        "classes": "",
        "data": {
          "id": "AIZ",
          "name": "AIZ",
          "color": "type",
          "l": 1,
          "inter": 1
        },
        "selected": false
      }
    },
    "edges": {
      "ASEtyp0AIY": {
        "group": "edges",
        "classes": "",
        "data": {
          "id": "ASEtyp0AIY",
          "source": "ASE",
          "target": "AIY",
          "type": 0,
          "width": 7.1457742737708365,
          "label": "18,15,18,20,37,32,32,37,46",
          "label_long": "L1A: 18\nL1B: 15\nL1C: 18\nL1D: 20\nL2A: 37\nL3A: 32\nJSH: 32\nN2U: 37\nAdA: 46"
        }
      },
      "ASEtyp0AWC": {
        "group": "edges",
        "classes": "",
        "data": {
          "id": "ASEtyp0AWC",
          "source": "ASE",
          "target": "AWC",
          "type": 0,
          "width": 3.738793548317167,
          "label": "3,4,4,6,13,4,14,7,8",
          "label_long": "L1A: 3\nL1B: 4\nL1C: 4\nL1D: 6\nL2A: 13\nL3A: 4\nJSH: 14\nN2U: 7\nAdA: 8"
        }
      },
      "ASEtyp0AIB": {
        "group": "edges",
        "classes": "",
        "data": {
          "id": "ASEtyp0AIB",
          "source": "ASE",
          "target": "AIB",
          "type": 0,
          "width": 6.320335292207616,
          "label": "14,14,18,18,24,22,22,23,37",
          "label_long": "L1A: 14\nL1B: 14\nL1C: 18\nL1D: 18\nL2A: 24\nL3A: 22\nJSH: 22\nN2U: 23\nAdA: 37"
        }
      },
      "ASEtyp2AIZ": {
        "group": "edges",
        "classes": "",
        "data": {
          "id": "ASEtyp2AIZ",
          "source": "ASE",
          "target": "AIZ",
          "type": 2,
          "width": 2,
          "label": "0,0,0,1,5,4,0,0,2",
          "label_long": "L1A: 0\nL1B: 0\nL1C: 0\nL1D: 1\nL2A: 5\nL3A: 4\nJSH: 0\nN2U: 0\nAdA: 2"
        }
      }
    },
    "hidden": {},
    "hiddenPositions": {},
    "positions": {}
  };


  expect( m.convertModelToCytoscape( connections, updateType, modelState) );
});

test('joined cells are removed', function(){
  let m = new Model();
  let connections = [
    {
      "pre": "ASER",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": false,
    "split": [],
    "joined": ['ASE'],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.nodes) ).toEqual( ['AIYR'] );
});

test('class cells are removed', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "ASER",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": false,
    "split": ['ASE'],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.nodes) ).toEqual( ['AIYR', 'ASER'] );
});


test('showIndividual removes class cells', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "ASER",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": true,
    "showIndividual": true,
    "split": ['ASE'],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.nodes) ).toEqual( ['AIYR', 'ASER'] );
});

test('post embryonic cells are removed when showPostEmbryonic is false', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "AQR",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": ['ASE'],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.nodes) ).toEqual( ['AIYR'] );
});

test('groups without members are not added', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "AQR",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 19,
        "tem5": 7,
        "white_ad": 20,
        "sem2": 10,
        "sem_l2": 18,
        "tem_l3": 18,
        "tem_ad": 22,
        "sem3": 11,
        "sem4": 9
      },
      "annotations": [
        "stable"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": ['ASE'],
    "joined": [],
    "hidden": [],
    "groups": {
      '0': {
        id: '0',
        name: 'Group',
        open: false,
        members: []
      }
    },
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.nodes) ).toEqual( ['AIYR'] );
});

test('closed groups with members inherit the edges of their members and the edge annotations and synapses are unioned', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "RIA",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "increase"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "decrease"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {
      '0': {
        id: '0',
        name: 'Group',
        open: false,
        members: ['ASE', 'RIA']
      }
    },
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.edges) ).toEqual( ['0-0-AIYR'] );
  expect( res.edges['0-0-AIYR'].classes ).toEqual( 'mature juvenile' );
});


test('hidden nodes are removed', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "RIA",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "increase"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "decrease"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": ['ASE'],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( Object.keys(res.nodes) ).toEqual( [ 'AIYR', 'RIA'] );

});

test('hidden group nodes are removed', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "RIA",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "increase"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "decrease"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": ['0'],
    "groups": {
      '0': {
        id: '0',
        name: 'Group',
        open: true,
        members: ['RIA']
      }
    },
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
    },
    "lockedPositions": []
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState );

  expect( Object.keys(res.nodes) ).toEqual( [ 'AIYR', 'ASE'] );

});


test('nodes that have locked positions have the same position', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "RIA",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "increase"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "decrease"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {},
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
      ASE: { x: 0, y: 1 },
      RIA: { x: 5, y: 5 }
    },
    "lockedPositions": ['ASE', 'RIA']
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( res.positions['ASE'] ).toEqual( modelState.positions['ASE'] );
  expect( res.positions['RIA'] ).toEqual( modelState.positions['RIA'] );

});

test('open groups are not positioned', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "RIA",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "increase"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "decrease"
      ]
    }
  ];

  let updateType = undefined;

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {
      '0': {
        id: '0',
        name: 'Group',
        open: true,
        members: ['ASE', 'RIA']
      }
    },
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
      ASE: { x: 0, y: 1 },
      RIA: { x: 5, y: 5 }
    },
    "lockedPositions": ['ASE', 'RIA']
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( res.positions['ASE'] ).toEqual( modelState.positions['ASE'] );
  expect( res.positions['RIA'] ).toEqual( modelState.positions['RIA'] );

});

test('minor update type keeps locked positions', function(){
  let m = new Model();

  let connections = [
    {
      "pre": "RIA",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "increase"
      ]
    },
    {
      "pre": "ASE",
      "post": "AIYR",
      "type": "chemical",
      "synapses": {
        "white_l4": 1,
        "tem5": 1,
        "white_ad": 1,
        "sem2": 1,
        "sem_l2": 1,
        "tem_l3": 1,
        "tem_ad": 1,
        "sem3": 1,
        "sem4": 1
      },
      "annotations": [
        "decrease"
      ]
    }
  ];

  let updateType = 'minor';

  let modelState = {
    "database": "head",
    "datasets": DataService.getDatasetList('head'),
    "input": [
      "AIYR"
    ],
    "selected": [],
    "showLinked": true,
    "showPostemb": false,
    "showIndividual": false,
    "split": [],
    "joined": [],
    "hidden": [],
    "groups": {
      '0': {
        id: '0',
        name: 'Group',
        open: true,
        members: ['ASE', 'RIA']
      }
    },
    "nodeColor": "type",
    "showEdgeLabel": false,
    "positions": {
      ASE: { x: 0, y: 1 },
    },
    "lockedPositions": ['ASE']
  };

  let res = m.convertModelToCytoscape( connections, updateType, modelState);

  expect( res.positions['ASE'] ).toEqual( modelState.positions['ASE'] );
  expect( res.nodes['RIA'].classes.includes('unpositioned') ).toEqual( true );

});