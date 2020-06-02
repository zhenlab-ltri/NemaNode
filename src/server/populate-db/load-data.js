const fs = require('fs');
const path = require('path');

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

const cellList = require('./raw-data/neurons.json');
const datasetList = require('./raw-data/datasets.json');

// take the files in ./raw-data/connections and combine them into one list
// appending dataset data to each connection
let loadConnectionData = () => {
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

  return connectionsJSON;
};

// take the files in ./raw-data/annotations and combine them into one list
// appending annotation type and dataset type to each annotation
let loadAnnotationData = () => {
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

let loadTrajectoryData = () => {
  let trajectories = [];

  let trajectoryAxes = {};

  datasetList.filter( d => d.axes != null ).forEach( d => {
    trajectoryAxes[d.id] = d.axes;
  });


  fs.readdirSync(TRAJECTORIES_DATA_PATH).forEach(filename => {
    let filepath = path.resolve(TRAJECTORIES_DATA_PATH, filename);
    let name = path.parse(filename).name;
    let datasetId = name.split('.')[0];
    let trajectoriesJson = JSON.parse(fs.readFileSync(filepath));

    trajectories = trajectories.concat(
      trajectoriesJson.map(s => {
        let axesInfo = trajectoryAxes[datasetId];

        Object.keys(s.coords).forEach( k => {
          let coord = s.coords[k];
          let transformedCoord = [];

          coord.forEach( (axisVal, index) => {
            let axisInfo = axesInfo[index];
            transformedCoord[axisInfo.axisIndex] = axisVal * axisInfo.axisTransform;
          });

          // Dataset 4 in particular has a unique rotation
          // manually fix it for this one by rotating it about the y axis
          // so that its position is consistent with the other datasets
          if (datasetId == 'witvliet_2020_4'){
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


module.exports = {
  cellList,
  datasetList,
  loadConnectionData,
  loadAnnotationData,
  loadTrajectoryData
};
