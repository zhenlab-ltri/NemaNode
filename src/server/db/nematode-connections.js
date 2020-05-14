const _ = require('lodash');
const hash = require('object-hash');
require('@babel/polyfill');

const getConnectionPrimaryKey = (pre, post, type) => hash({ pre, post, type });

let queryAnnotations = (connection, opts) => {
  let { cells, includeNeighboringCells, datasetType } = opts;

  let annotationsSql = `
    SELECT c.pre, c.post, c.type, a.annotation
    FROM annotations a
    INNER JOIN connections c ON a.connection_id = c.id
    WHERE (c.pre in (${cells}) ${
    includeNeighboringCells ? 'OR' : 'AND'
  } c.post in (${cells}))
      AND a.collection in (${datasetType})
  `;

  return connection.query(annotationsSql);
};

// a set of connections were not annotated in the adult complete dataset by John White
// to make the adult complete dataset and the l1 complete dataset more compatible for comparison
// a few 'pseudo edges' have been added under the annotation 'not-imaged' whenever the adult and l1
// complete datasets are compared
let queryNonImagedConnections = (connection, opts) => {
  let {
    cells,
    includeNeighboringCells,
    thresholdChemical,
    thresholdElectrical
  } = opts;

  let nonImagedSynapseSql = `
    SELECT c.pre, c.post, c.type, 'adult' as dataset_id, s.synapses
    FROM annotations a
    INNER JOIN connections c ON a.connection_id = c.id
    INNER JOIN synapses s ON s.connection_id = c.id
    WHERE (c.pre in (${cells}) ${
    includeNeighboringCells ? 'OR' : 'AND'
  } c.post in (${cells}))
      AND s.dataset_id = 'l1'
      AND (
        (c.type = 'chemical' && s.synapses >= ${thresholdChemical})
        OR (c.type = 'electrical' && s.synapses >= ${thresholdElectrical})
      )
      AND a.annotation = 'not-imaged';
  `;

  return connection.query(nonImagedSynapseSql);
};

let queryConnections = (connection, opts) => {
  let {
    cells,
    datasetIds,
    includeNeighboringCells,
    thresholdChemical,
    thresholdElectrical
  } = opts;

  let connectionsSql = `
    SELECT c.pre, c.post, c.type, s.dataset_id, s.synapses
    FROM (
      SELECT c.pre, c.post, c.type, c.id
      FROM synapses s
      INNER JOIN connections c ON s.connection_id = c.id
      WHERE (c.pre in (${cells}) ${
    includeNeighboringCells ? 'OR' : 'AND'
  } c.post in (${cells}))
        AND s.dataset_id in (${datasetIds})
        AND (
          (c.type = 'chemical' && s.synapses >= ${thresholdChemical})
          OR (c.type = 'electrical' && s.synapses >= ${thresholdElectrical})
        )
      GROUP BY c.pre, c.post, c.type
    ) AS c
    INNER JOIN synapses s ON s.connection_id = c.id
    WHERE s.dataset_id IN (${datasetIds})
    ORDER BY c.id;
  `;

  return connection.query(connectionsSql);
};

// cells -> array of strings,,
// datasetType -> enum
// datasetIds -> array of strings,
// thresholdChemical -> int
// thresholdElectrical -> int
// includeNeighboringCells -> bool
// includeAnnotatopns -> bool
let queryNematodeConnections = async (connection, opts) => {
  let cells = connection.escape(opts.cells);
  let datasetIds = connection.escape(opts.datasetIds);
  let datasetType = connection.escape(opts.datasetType);
  let thresholdChemical = !isNaN(parseInt(opts.thresholdChemical))
    ? opts.thresholdChemical
    : 3;
  let thresholdElectrical = !isNaN(parseInt(opts.thresholdElectrical))
    ? opts.thresholdElectrical
    : 3;
  let includeNeighboringCells =
    typeof opts.includeNeighboringCells === 'string'
      ? opts.includeNeighboringCells === 'true'
      : !!opts.includeNeighboringCells;
  let includeAnnotations =
    typeof opts.includeAnnotations === 'string'
      ? opts.includeAnnotations === 'true'
      : !!opts.includeAnnotations;

  let annotationsMap = new Map();
  let nonImagedConnections = [];
  let rawConnections = [];

  if (cells.length === 0) {
    return [];
  }

  let annotations = await queryAnnotations(connection, {
    cells,
    includeNeighboringCells,
    datasetType
  });
  annotations.forEach(annotation => {
    let { pre, post, type: connectionType, annotation: annotationType } = annotation;
    let key = getConnectionPrimaryKey(pre, post, connectionType);

    if( annotationsMap.has(key) ){
      annotationsMap.set(key, annotationsMap.get(key).concat(annotationType));
    } else {
      annotationsMap.set(key, [annotationType]);
    }
  });

  // add missing connections to the adult complete dataset
  // with the annotation 'not-imaged'
  if (opts.datasetType === 'complete' && opts.datasetIds.includes('adult')) {
    nonImagedConnections = await queryNonImagedConnections(connection, {
      cells,
      includeNeighboringCells,
      thresholdChemical,
      thresholdElectrical
    });
  }

  rawConnections = await queryConnections(connection, {
    cells,
    datasetIds,
    includeNeighboringCells,
    thresholdChemical,
    thresholdElectrical
  });

  nonImagedConnections.forEach(c => rawConnections.push(c));

  // for each connection, append the number of synapses that each dataset has for that connection
  let connections = Object.entries(
    _.groupBy(rawConnections, c =>
      getConnectionPrimaryKey(c.pre, c.post, c.type)
    )
  ).map(entry => {
    let [key, grouped] = entry;
    let { pre, post, type } = _.get(grouped, '0');
    let annotations = annotationsMap.has(key) ? annotationsMap.get(key) : [];
    let synapses = _.fromPairs(
      grouped.map(groupMember => [groupMember.dataset_id, groupMember.synapses])
    );

    return {
      pre,
      post,
      type,
      annotations: includeAnnotations ? annotations : [],
      synapses
    };
  });

  return connections;
};

module.exports = queryNematodeConnections;
