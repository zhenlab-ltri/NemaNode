let getCell2ClassMap = async dbConn => {
  let cells = await dbConn.query(`SELECT name, class FROM neurons`);

  let cellClassesMap = {};
  cells.forEach(cell => {
    cellClassesMap[cell['name']] = cell['class'];
  });

  return cellClassesMap;
};

let getCellClass2MembersMap = async dbConn => {
  let cells = await dbConn.query(`SELECT name, class FROM neurons`);

  let cellClassesMembersMap = {};
  cells.forEach(cell => {
    if (cellClassesMembersMap[cell.class] == null) {
      cellClassesMembersMap[cell.class] = [];
    }
    cellClassesMembersMap[cell.class].push(cell.name);
  });

  return cellClassesMembersMap;
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
  let synapses = {};

  connectionsJSON.forEach(connection => {
    let { pre, post, typ, syn, datasetId } = connection;
    let type = typ === 0 ? 'chemical' : 'electrical';
    let weight = syn.length;

    let preClass = getClass(pre, connection);
    let postClass = getClass(post, connection);

    let edges = [[pre, post, weight]];

    if (preClass != postClass) {
      if (pre != preClass) {
        edges.push([preClass, post, weight]);
      }
      if (post != postClass) {
        edges.push([pre, postClass, weight]);
      }
    }
    if (pre != preClass && post != postClass) {
      if (type == 'electrical' && preClass == postClass) {
        edges.push([preClass, postClass, weight / 2]);
      } else {
        edges.push([preClass, postClass, weight]);
      }
    }

    edges.forEach(edge => {
      if (edge[0] == null || edge[1] == null) {
        return;
      }
      const connectionKey = [datasetId, edge[0], edge[1], type].toString()
      connections[connectionKey] = [
        datasetId,
        edge[0],
        edge[1],
        type,
        edge[2]
      ];
      /*let key = [edge[0], edge[1], type, datasetId].toString();
      if (!synapses.hasOwnProperty(key)) {
        synapses[key] = [edge[0], edge[1], type, datasetId, 0];
      }
      synapses[key][4] += edge[2];*/
    });
  });

  await dbConn.query(
    'INSERT INTO connections (dataset_id, pre, post, type, synapses) VALUES ?',
    [Object.values(connections)]
  );
  await dbConn.query(`
  CREATE TEMPORARY TABLE temp_synapses (
    pre VARCHAR(30) NOT NULL,
    post VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL,
    dataset_id VARCHAR(20) NOT NULL,
    synapses SMALLINT UNSIGNED NOT NULL
  )`);
  /*
  await dbConn.query(
    'INSERT INTO temp_synapses (pre, post, type, dataset_id, synapses) VALUES ?',
    [Object.values(synapses)]
  );
  await dbConn.query(`
  INSERT INTO synapses (dataset_id, connection_id, synapses)
  SELECT t.dataset_id, c.id, t.synapses
  FROM temp_synapses t
  LEFT JOIN connections c ON t.pre = c.pre AND t.post = c.post AND t.type = c.type
  `);

  return dbConn.query('DROP TABLE temp_synapses');*/
};

// head annotations are in the form of (pre, post)
let getHeadAnnotations = async (dbConn, annotations) => {

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

// legacy annotations are in the form of (pre class, post class)
// so we have to process them differently
let getLegacyAnnotations = async (dbConn, annotations) => {
  let cellClassMembersMap = await getCellClass2MembersMap(dbConn);

  let getCellClassMembers = cellClass => {
    if (cellClass == 'BodyWallMuscles') {
      return [
        'BWM-DL01',
        'BWM-DL02',
        'BWM-DL03',
        'BWM-DL04',
        'BWM-DL05',
        'BWM-DL06',
        'BWM-DL07',
        'BWM-DL08',
        'BWM-DL09',
        'BWM-DL10',
        'BWM-DL11',
        'BWM-DL12',
        'BWM-DL13',
        'BWM-DL14',
        'BWM-DL15',
        'BWM-DL16',
        'BWM-DL17',
        'BWM-DL18',
        'BWM-DL19',
        'BWM-DL20',
        'BWM-DL21',
        'BWM-DL22',
        'BWM-DL23',
        'BWM-DL24',
        'BWM-DR01',
        'BWM-DR02',
        'BWM-DR03',
        'BWM-DR04',
        'BWM-DR05',
        'BWM-DR06',
        'BWM-DR07',
        'BWM-DR08',
        'BWM-DR09',
        'BWM-DR10',
        'BWM-DR11',
        'BWM-DR12',
        'BWM-DR13',
        'BWM-DR14',
        'BWM-DR15',
        'BWM-DR16',
        'BWM-DR17',
        'BWM-DR18',
        'BWM-DR19',
        'BWM-DR20',
        'BWM-DR21',
        'BWM-DR22',
        'BWM-DR23',
        'BWM-DR24',
        'BWM-VL01',
        'BWM-VL02',
        'BWM-VL03',
        'BWM-VL04',
        'BWM-VL05',
        'BWM-VL06',
        'BWM-VL07',
        'BWM-VL08',
        'BWM-VL09',
        'BWM-VL10',
        'BWM-VL11',
        'BWM-VL12',
        'BWM-VL13',
        'BWM-VL14',
        'BWM-VL15',
        'BWM-VL16',
        'BWM-VL17',
        'BWM-VL18',
        'BWM-VL19',
        'BWM-VL20',
        'BWM-VL21',
        'BWM-VL22',
        'BWM-VL23',
        'BWM-VR01',
        'BWM-VR02',
        'BWM-VR03',
        'BWM-VR04',
        'BWM-VR05',
        'BWM-VR06',
        'BWM-VR07',
        'BWM-VR08',
        'BWM-VR09',
        'BWM-VR10',
        'BWM-VR11',
        'BWM-VR12',
        'BWM-VR13',
        'BWM-VR14',
        'BWM-VR15',
        'BWM-VR16',
        'BWM-VR17',
        'BWM-VR18',
        'BWM-VR19',
        'BWM-VR20',
        'BWM-VR21',
        'BWM-VR22',
        'BWM-VR23',
        'BWM-VR24'
      ];
    }
    return cellClassMembersMap[cellClass];
  };

  let annotationsMap = {};


  annotations.forEach(annotation => {
    // even though this is pre/post, it is actually pre class and post class
    let { pre: preClass, post: postClass, annotationType, datasetType } = annotation;
    let preClassMembers = getCellClassMembers(preClass);
    let postClassMembers = getCellClassMembers(postClass);

    preClassMembers.forEach(preClassMember => {
      postClassMembers.forEach(postClassMember => {
        let memberCombinations = [
          [preClassMember, postClassMember],
          [preClassMember, postClass],
          [preClass, postClassMember],
          [preClass, postClass]
        ];

        memberCombinations.forEach(e => {
          let key = [e[0], e[1], datasetType].toString();
          annotationsMap[key] = [
            e[0],
            e[1],
            'chemical',
            datasetType,
            annotationType
          ];
        });
      });
    });
  });

  return annotationsMap;
};

let populateAnnotations = async (dbConn, annotations) => {
  let legacyAnnotations = annotations.filter( a => a.datasetType === 'complete' ); // legacy datasets look at the complete worm
  let headAnnotations = annotations.filter( a => a.datasetType !== 'complete' ); // new datasets are only for the head

  let legacyAnnotationsMap = await getLegacyAnnotations(dbConn, legacyAnnotations);
  let headAnnotationsList = await getHeadAnnotations(dbConn, headAnnotations);

  await dbConn.query(
    'INSERT INTO annotations (pre, post, type, collection, annotation) VALUES ?',
    [Object.values(legacyAnnotationsMap)]
  );

  await dbConn.query(
    'INSERT INTO annotations (pre, post, type, collection, annotation) VALUES ?',
    [headAnnotationsList]
  );
};

let populateTrajectoryNodeData = async (dbConn, connectionsJSON) => {
  const TABLE = 'trajectory_node_data';
  const TABLE_FIELDS = [
    'pre_tid',
    'post_tid',
    'connection_type',
    'pre',
    'post'
  ];

  let values = [];

  connectionsJSON.forEach( c => {
    if( c['post_tid'] != null && c['pre_tid'] != null ){
      let { post_tid, pre_tid, post, pre, typ } = c;

      for ( let i = 0; i < post_tid.length; i++ ){
        let value = [
          pre_tid[i],
          post_tid[i],
          typ === 0 ? 'chemical synapse' : 'gap junction',
          pre,
          post
        ];

        values.push(value);
      }

    }

  });

  await dbConn.query(
    `INSERT INTO ${TABLE} ( ${TABLE_FIELDS.join(', ')} ) VALUES ?`,
    [values]
  );
};

module.exports = {
  populateAnnotations,
  populateConnections,
  populateTrajectoryNodeData
};
