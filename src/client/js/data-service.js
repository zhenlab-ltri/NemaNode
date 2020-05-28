const CellInfo = require('./cell-info');

const ADULT_COMPLETE_MUSCLE_CLASS = 'BODYWALLMUSCLES';

const { union, capitalizeFirstLetter, unique } = require('./util');

class DataService {
  constructor() {
    this.loaded = false;
  }

  load(cells, datasets) {
    this.loaded = true;
    this.legacyClasses = [];
    this.legacyCells = [];
    this.legacyCellToClass = {};

    this.cellsMap = new Map();
    this.datasets = datasets;
    this.cells = cells;

    this.datasetTypes = new Set();
    datasets.forEach(d => this.datasetTypes.add(d.collection));

    this.cellInfo = new CellInfo();
    cells.forEach(cell => {
      this.cellsMap.set(cell.name.toUpperCase(), cell);

      this.cellInfo.addCell(
        cell.name.toUpperCase(),
        cell.class.toUpperCase(),
        cell.neurotransmitter,
        cell.type,
        cell.embryonic,
        cell.inhead,
        cell.intail
      );
    });

    this.cellInfo.setToLegacy();
    this.legacyClasses = [
      'PM2',
      'PM3',
      'PM5',
      'PM6',
      'PM7',
      'MC1',
      'MC2',
      'MC3',
      'G1',
      'G2',
      'DEFECATIONMUSCLES',
      ADULT_COMPLETE_MUSCLE_CLASS
    ];

    this.adultCompleteDatasetSpecificClasses = [
      'PM2',
      'PM3',
      'PM5',
      'PM6',
      'PM7',
      'MC1',
      'MC2',
      'MC3',
      'G1',
      'G2',
      'DEFECATIONMUSCLES',
      ADULT_COMPLETE_MUSCLE_CLASS
    ];
    this.legacyClasses.forEach(cls => {
      let cells = this.classMembers(cls);

      this.legacyCells = this.legacyCells.concat(cells);
      cells.forEach(cell => {
        this.legacyCellToClass[cell] = cls;
      });
    });
  }

  getAdultCompleteDataset() {
    this.checkLoaded();
    return this.datasets.find(
      d => d.id === 'white_1986_whole' && d.collection === 'complete'
    );
  }

  getBodyWallMuscleClass(muscleCellName, datasets) {
    if (datasets.includes(this.getAdultCompleteDataset().id)) {
      return ADULT_COMPLETE_MUSCLE_CLASS;
    }

    return this.cells.find(c => c.name.toUpperCase() === muscleCellName).class;
  }

  checkLoaded() {
    if (!this.loaded) {
      throw new Error('Data service not loaded');
    }
  }

  getDatabaseList() {
    this.checkLoaded();
    return this.datasetTypes;
  }

  getDatasetList(datasetType) {
    this.checkLoaded();
    return this.datasets
      .filter(d => d.collection === datasetType)
      .map(d => d.id);
  }

  getDatasetInfo(datasetType, datasetId) {
    this.checkLoaded();
    return this.datasets.filter(
      d => d.collection === datasetType && d.id === datasetId
    )[0];
  }

  getDatasetById(datasetId){
    this.checkLoaded();
    return this.datasets.find( d => d.id === datasetId );
  }

  setDatasetType(databaseType) {
    if (databaseType == 'complete') {
      this.cellInfo.setToLegacy();
    } else {
      this.cellInfo.setToNonLegacy();
    }
  }

  exists(cellId, datasetType) {
    this.checkLoaded();
    return this.cellInfo.validNodes[datasetType].includes(cellId);
  }

  existsElsewhere(cellId) {
    this.checkLoaded();
    return this.cellInfo.type.hasOwnProperty(cellId);
  }

  hasConnectionsElsewhere(cellId, datasetType) {
    this.checkLoaded();
    return this.cellInfo.incompleteNodes[datasetType].includes(cellId);
  }

  isCell(cellId) {
    this.checkLoaded();
    return this.cellInfo.isCell[cellId];
  }

  isClass(cellId) {
    this.checkLoaded();
    return this.cellInfo.isClass[cellId];
  }

  isEmb(cellId) {
    this.checkLoaded();
    return this.cellInfo.emb[cellId];
  }

  cellClass(cellId) {
    this.checkLoaded();
    return this.cellInfo.cellClass[cellId] || cellId;
  }

  classMembers(cellId) {
    this.checkLoaded();
    return this.cellInfo.classMembers[cellId] || [];
  }

  typ(cellId) {
    this.checkLoaded();
    return this.cellInfo.type[cellId];
  }

  nt(cell) {
    this.checkLoaded();
    return this.cellInfo.nt[cell];
  }

  isMotorPseudonym(name) {
    return ['VC', 'AS', 'VD', 'VB', 'VA', 'DB', 'DA', 'DD'].includes(name);
  }

  getDisplayName(name) {
    const namesWithSpaces = {
      BODYWALLMUSCLES: 'Body wall muscles',
      DEFECATIONMUSCLES: 'Defecation muscles',
      INTMUL: 'int mu L',
      INTMUR: 'int mu R',
      SPHMU: 'sph mu',
      ANALDEP: 'anal dep'
    };

    if (namesWithSpaces[name] != null) {
      return namesWithSpaces[name];
    }

    if (
      ['DAN', 'DBN', 'DDN', 'VAN', 'VBN', 'VCN', 'VDN', 'ASN'].includes(name)
    ) {
      return name.replace('N', 'n');
    }

    if (['G1', 'G2'].includes(name)) {
      return name.replace('G', 'g');
    }

    if (name.includes('MC') && !['MC', 'MCL', 'MCR', 'HMC'].includes(name)) {
      return name.replace('MC', 'mc');
    }

    if (name.includes('PM')) {
      return name.replace('PM', 'pm');
    }

    if (name.includes('CEPSH')) {
      return name.replace('SH', 'sh');
    }

    return name;
  }

  getTypeDisplayNames(type) {
    if (type == 'b') {
      return 'Muscle';
    }
    if (type === '') {
      return 'Non-neuronal, non-muscle';
    }
    let typeDisplayNames = [];
    if (type.includes('s')) {
      typeDisplayNames.push('sensory');
    }
    if (type.includes('i')) {
      typeDisplayNames.push('interneuron');
    }
    if (type.includes('m')) {
      typeDisplayNames.push('motor');
    }
    if (type.includes('n')) {
      typeDisplayNames.push('neuromodulative');
    }
    return capitalizeFirstLetter(typeDisplayNames.join(', '));
  }

  getNeurotransmitterDisplayNames(nt) {
    if (nt === 'n') {
      return 'None';
    }
    if (nt === 'u') {
      return 'Unknown/peptidergic';
    }
    let neurotransmitterDisplayNames = [];
    if (nt.includes('a')) {
      neurotransmitterDisplayNames.push('acetylcholine');
    }
    if (nt.includes('d')) {
      neurotransmitterDisplayNames.push('dopamine');
    }
    if (nt.includes('g')) {
      neurotransmitterDisplayNames.push('GABA');
    }
    if (nt.includes('l')) {
      neurotransmitterDisplayNames.push('glutamate');
    }
    if (nt.includes('o')) {
      neurotransmitterDisplayNames.push('octopamine');
    }
    if (nt.includes('s')) {
      neurotransmitterDisplayNames.push('serotonin');
    }
    if (nt.includes('t')) {
      neurotransmitterDisplayNames.push('tyramine');
    }
    return capitalizeFirstLetter(neurotransmitterDisplayNames.join(', '));
  }
}

// export singleton

const ds = new DataService();

module.exports = ds;
