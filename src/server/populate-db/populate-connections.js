let getCell2ClassMap = async dbConn => {
  let [cells, ] = await dbConn.query(`SELECT name, class FROM neurons`);

  let cellClassesMap = {};
  cells.forEach(cell => {
    cellClassesMap[cell['name']] = cell['class'];
  });

  return cellClassesMap;
};

let populateConnections = async (dbConn, connectionsJSON) => {
  let cellClassesMap = await getCell2ClassMap(dbConn);

  let getClass = (cell, connection) => {
    let { datasetType } = connection;
    let isLegacyDataset = datasetType === 'complete';
    if (isLegacyDataset && cell.startsWith('BWM')) {
      return 'BodyWallMuscles';
    }
    return cellClassesMap[cell];
  };

  let connections = {};
  let synapses = [];

  let connectionCounter = 0;
  connectionsJSON.forEach(connection => {
    let { datasetId, pre, post, typ, syn, ids, pre_tid, post_tid } = connection;
    let type = typ === 0 ? 'chemical' : 'electrical';
    let synapseCount = syn.length;

    // Skip gap junctions already counted in the reverse direction.
    if (
      type == 'electrical' &&
      connections.hasOwnProperty([datasetId, post, pre, type].toString())
    ) {
      return;
    }

    // Add connections and class connections.
    const preClass = getClass(pre, connection);
    const postClass = getClass(post, connection);

    let edges = [[pre, post, synapseCount]];

    if (preClass != postClass) {
      if (pre != preClass) {
        edges.push([preClass, post, synapseCount]);
      }
      if (post != postClass) {
        edges.push([pre, postClass, synapseCount]);
      }
    }
    if (pre != preClass && post != postClass) {
      edges.push([preClass, postClass, synapseCount]);
    }

    edges.forEach((edge) => {
      if (edge[0] == null || edge[1] == null) {
        //legacy datasets with classes directly listed.
        return;
      }
      connectionCounter += 1;
      const edgeKey = [datasetId, edge[0], edge[1], type].toString();
      if (!connections.hasOwnProperty(edgeKey)) {
        connections[edgeKey] = {
          id: connectionCounter,
          datasetId,
          pre: edge[0],
          post: edge[1],
          type,
          synapseCount: 0
        };
      }
      connections[edgeKey].synapseCount += edge[2];
    });

    // Add individual synapses.
    if (typeof ids !== 'undefined') {
      ids.forEach((connectorId, i) => {
        synapses.push([
          connections[[datasetId, pre, post, type].toString()].id,
          connectorId,
          syn[i],
          pre_tid[i],
          post_tid[i]
        ]);
      });
    }

  });

  let connectionValues = Object.values(connections).map((connection) => {
    let { id, datasetId, pre, post, type, synapseCount } = connection;
    return [id, datasetId, pre, post, type, synapseCount];
  });

  await dbConn.query(
    'INSERT INTO connections (id, dataset_id, pre, post, type, synapses) VALUES ?',
    [connectionValues]
  );

  await dbConn.query(
    'INSERT INTO synapses (connection_id, connector_id, weight, pre_tid, post_tid) VALUES ?',
    [synapses]
  );

};

// Apply annotations to cell classes.
let getAnnotations = async (dbConn, annotations) => {

  let processedAnnotations = [];
  let annotationsSeen = new Set();

  let cellClassMap = await getCell2ClassMap(dbConn);

  annotations.forEach(annotation => {
    let { pre, post, annotationType, datasetType } = annotation;
    let preClass = cellClassMap[pre];
    let postClass = cellClassMap[post];

    let expandedAnnotationsData = [
      [pre, post],
      [preClass, post],
      [pre, postClass],
      [preClass, postClass]
    ];

    expandedAnnotationsData.forEach(pair => {
      let annotationKey = `${pair[0]}-${pair[1]}-${datasetType}-${annotationType}`;

      if( !annotationsSeen.has(annotationKey) ){
        processedAnnotations.push([pair[0], pair[1], 'chemical', datasetType, annotationType]);
        annotationsSeen.add(annotationKey);
      }
    });
  });

  return processedAnnotations;
};

let populateAnnotations = async (dbConn, annotations) => {
  const anotationsList = await getAnnotations(dbConn, annotations);

  await dbConn.query(
    'INSERT INTO annotations (pre, post, type, collection, annotation) VALUES ?',
    [anotationsList]
  );
};

module.exports = {
  populateAnnotations,
  populateConnections
};
