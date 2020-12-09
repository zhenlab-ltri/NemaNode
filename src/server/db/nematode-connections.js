const groupBy = require('lodash.groupby');
const get = require('lodash.get');
const fromPairs = require('lodash.frompairs');
const hash = require('object-hash');

const getConnectionPrimaryKey = (pre, post, type) => hash({ pre, post, type });


// gap junctions are unordered but sometimes we have entries for both pairs
// e.g. 'AIA-ASI' has entries and 'ASI-AIA' has entries
// merge them before returning them
// input: list of gap junction objects containing pre, post, type, annotations, and synapses
const mergeGapJunctions = gapJunctions => {
  const gapJunctionsKeyMap = {};

  gapJunctions.forEach(gj => {
    const { pre, post, synapses } = gj;
    const key = [pre, post].sort().join('$');

    if (gapJunctionsKeyMap[key] === undefined) {
      gapJunctionsKeyMap[key] = gj;
    } else {
      Object.keys(synapses).forEach(dataset => {
        if (gapJunctionsKeyMap[key]['synapses'][dataset] !== undefined) {
          gapJunctionsKeyMap[key]['synapses'][dataset] += synapses[dataset];
        } else {
          gapJunctionsKeyMap[key]['synapses'][dataset] = synapses[dataset];
        }
      });
    }
  });

  const merged = Object.entries(gapJunctionsKeyMap).map(([gjKey, gj]) => {
    const [pre, post] = gjKey.split('$');
    const { type, synapses, annotations } = gj;

    return {
      pre,
      post,
      type,
      synapses,
      annotations
    };
  });

  return merged;
};


let queryAnnotations = async (connection, opts) => {
  const { cells, includeNeighboringCells, datasetType } = opts;

  const annotationsSql = `
    SELECT pre, post, type, annotation
    FROM annotations
    WHERE (pre in (${cells})
    ${includeNeighboringCells ? 'OR' : 'AND'} post in (${cells}))
      AND collection in (${datasetType})
  `;

  const [rows, ] = await connection.query(annotationsSql);

  return rows;
};


let queryConnections = async (connection, opts) => {
  const {
    cells,
    datasetIds,
    includeNeighboringCells,
    thresholdChemical,
    thresholdElectrical
  } = opts;

  // First, get all connections matching the threshold, then fetch the synapse number for these
  // connections in all appropriate datasets (even if they are below the threshold).
  const connectionsSql = `
    SELECT c.pre, c.post, c.type, c.dataset_id, c.synapses from (
      SELECT pre, post, type
      FROM connections
      WHERE (pre IN (${cells})
      ${includeNeighboringCells ? 'OR' : 'AND'} post IN (${cells}))
        AND dataset_id IN (${datasetIds})
        AND (
          (type = 'chemical' && synapses >= ${thresholdChemical})
          OR (type = 'electrical' && synapses >= ${thresholdElectrical})
        )
      GROUP BY pre, post, type
    ) f
    LEFT JOIN connections c ON f.pre = c.pre AND f.post = c.post AND f.type = c.type
    WHERE c.dataset_id IN (${datasetIds})
  `;

  const [rows, ] = await connection.query(connectionsSql);

  return rows;
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

  let rawConnections = [];

  if (cells.length === 0) {
    return [];
  }

  let annotationsMap = new Map();
  if (includeAnnotations) {
    const annotations = await queryAnnotations(connection, {
      cells,
      includeNeighboringCells,
      datasetType
    });
    annotations.forEach(annotation => {
      let { pre, post, type: connectionType, annotation: annotationType } = annotation;
      let key = getConnectionPrimaryKey(pre, post, connectionType);

      if (annotationsMap.has(key)) {
        annotationsMap.set(key, annotationsMap.get(key).concat(annotationType));
      } else {
        annotationsMap.set(key, [annotationType]);
      }
    });
  }

  rawConnections = await queryConnections(connection, {
    cells,
    datasetIds,
    includeNeighboringCells,
    thresholdChemical,
    thresholdElectrical
  });

  // for each connection, append the number of synapses that each dataset has for that connection
  let connections = Object.entries(
    groupBy(rawConnections, c =>
      getConnectionPrimaryKey(c.pre, c.post, c.type)
    )
  ).map(entry => {
    let [key, grouped] = entry;
    let { pre, post, type } = get(grouped, '0');
    let annotations = annotationsMap.has(key) ? annotationsMap.get(key) : [];
    let synapses = fromPairs(
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

  const gapJunctions = connections.filter(c => c.type == 'electrical');
  const chemicalSynapses = connections.filter(c => c.type == 'chemical');

  const mergedGapJunctions = mergeGapJunctions(gapJunctions);
  return [...mergedGapJunctions, ...chemicalSynapses];
};

module.exports = {
  queryNematodeConnections,
  mergeGapJunctions
};
