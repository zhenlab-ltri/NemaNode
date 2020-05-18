const fs = require('fs');
const path = require('path');

const populateCells = require('./populate-cells');
const {
  populateDatasets
} = require('./populate-datasets');
const {
  populateAnnotations,
  populateConnections
} = require('./populate-connections');
const {
  populateNeuronTrajectories
} = require('./populate-neuron-trajectories');

const CONNECTIONS_DATA_PATH = path.resolve(
  __dirname,
  './raw-data/connections/'
);
const ANNOTATIONS_DATA_PATH = path.resolve(
  __dirname,
  './raw-data/annotations/'
);
const TRAJECTORIES_DATA_PATH = path.resolve(
  __dirname,
  './raw-data/trajectories/'
);

const cellsJSON = require('./raw-data/neurons.json');
let datasetsJSON = require('./raw-data/datasets.json');

let depopulateDb = connection => {
  return Promise.all([
    connection.query('SET FOREIGN_KEY_CHECKS = 0'),
    connection.query('TRUNCATE TABLE annotations'),
    connection.query('TRUNCATE TABLE synapses'),
    connection.query('TRUNCATE TABLE connections'),
    connection.query('TRUNCATE TABLE neurons'),
    connection.query('TRUNCATE TABLE datasets'),
    connection.query('TRUNCATE TABLE trajectories'),
    connection.query('SET FOREIGN_KEY_CHECKS = 1')
  ]);
};

// take the files in ./raw-data/connections and combine them into one list
// appending dataset data to each connection
let processConnectionsDataFiles = () => {
  let connectionsJSON = [];

  fs.readdirSync(CONNECTIONS_DATA_PATH).forEach(filename => {
    const filepath = path.resolve(CONNECTIONS_DATA_PATH, filename);
    const name = path.parse(filename).name;
    const datasetId = name.split('.')[0];

    let connectionsJSON_raw = JSON.parse(fs.readFileSync(filepath));

    connectionsJSON_raw.forEach(c => {
      c.datasetId = datasetId;
    });

    connectionsJSON = connectionsJSON.concat(connectionsJSON_raw);
  });

  return {
    connectionsJSON
  };
};

// take the files in ./raw-data/annotations and combine them into one list
// appending annotation type and dataset type to each annotation
let processAnnotationsDataFiles = () => {
  let annotations = [];

  fs.readdirSync(ANNOTATIONS_DATA_PATH).forEach(filename => {
    const filepath = path.resolve(ANNOTATIONS_DATA_PATH, filename);
    const name = path.parse(filename).name;
    let [datasetType] = name.split('.');

    let parsedAnnotations = JSON.parse(fs.readFileSync(filepath));

    Object.entries(parsedAnnotations).forEach(
      ([annotationType, annotationsOfType]) => {
        let processedAnnotations = annotationsOfType.map(a => {
          let [pre, post] = a;

          return {
            pre,
            post,
            annotationType,
            datasetType
          };
        });

        annotations = annotations.concat(processedAnnotations);
      }
    );
  });

  return annotations;
};

let processTrajectoriesDataFiles = () => {
  let trajectories = [];

  let trajectoryAxes = {};

  datasetsJSON.filter( d => d.axes != null ).forEach( d => {
    trajectoryAxes[d.id] = d.axes;
  });

  fs.readdirSync(TRAJECTORIES_DATA_PATH).forEach(filename => {
    let filepath = path.resolve(TRAJECTORIES_DATA_PATH, filename);
    let name = path.parse(filename).name;
    let [datasetId] = name.split('.');
    let trajectoriesJson = JSON.parse(fs.readFileSync(filepath));

    trajectories = trajectories.concat(
      trajectoriesJson.map(s => {
        let nodeIds = Object.keys(s.coords).map(k => parseInt(k));

        let axesInfo = trajectoryAxes[datasetId];

        Object.keys(s.coords).forEach( k => {
          let coord = s.coords[k];
          let transformedCoord = [];

          coord.forEach( (axisVal, index) => {
            let axisInfo = axesInfo[index];
            transformedCoord[axisInfo.axisIndex] = axisVal * axisInfo.axisTransform;
          });

          // SEM L1 2 in particular has a unique rotation
          // manually fix it for this one by rotating it about the y axis
          // so that its position is consistent with the other datasets
          if( datasetId === 'SEM_L1_2' ){
            let radRotation = axesInfo[1].rotation * ( Math.PI / 180 );
            let [x0, y0, z0] = transformedCoord;

            let x1 = x0 *  Math.cos(radRotation) + z0 * Math.sin(radRotation);
            let y1 = y0;
            let z1 =  (x0 * ( -1 ) * Math.sin(radRotation)  ) + ( z0 *  Math.cos(radRotation) );

            transformedCoord = [x1, y1, z1];
          }

          s.coords[k] = transformedCoord;
        });

        return {
          trajectoryId: s.skid,
          neuronName: s.name,
          datasetId,
          json: s
        };
      })
    );
  });

  return trajectories;
};

let populateDb = async (conn, opts = {}) => {
  let { publishedDataOnly = false } = opts;
  if (publishedDataOnly) {
    datasetsJSON = datasetsJSON.filter(dataset => dataset.published);
  }

  let {
    connectionsJSON
  } = processConnectionsDataFiles();

  let annotationsJSON = processAnnotationsDataFiles();
  let trajectoriesJSON = processTrajectoriesDataFiles();

  try {
    console.log('Clearing tables');
    await depopulateDb(conn);

    console.log('populating datasets');
    await populateDatasets(conn, datasetsJSON);

    console.log('populating cells');
    await populateCells(conn, cellsJSON);

    console.log('populating trajectories');
    await populateNeuronTrajectories(conn, trajectoriesJSON);

    console.log('populating connections');
    await populateConnections(conn, connectionsJSON);

    console.log('populating annotations');
    await populateAnnotations(conn, annotationsJSON);

  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  populateDb,
  depopulateDb,
  populateDatasets,
  populateCells,
  populateConnections,
  populateAnnotations
};
