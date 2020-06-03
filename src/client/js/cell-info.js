class CellInfo {
  constructor() {
    this.isCell = {};
    this.isClass = {};

    this.cellClass = {};
    this.classMembers = {};

    this.nt = {};
    this.type = {};
    this.emb = {};
    this.validNodes = { complete: [], head: [], tail: [] };
    this.incompleteNodes = {
      complete: [],
      head: [
        'ADA',
        'ADE',
        'ALA',
        'AQR',
        'AVA',
        'AVB',
        'AVD',
        'AVE',
        'AVF',
        'AVG',
        'AVH',
        'AVJ',
        'AVK',
        'AVL',
        'AVM',
        'BDU',
        'DVA',
        'DVC',
        'FLP',
        'HSN',
        'PLN',
        'PVC',
        'PVN',
        'PVP',
        'PVQ',
        'PVR',
        'PVT',
        'RID',
        'RIF',
        'RIG',
        'RIP',
        'RMG',
        'SDQ',
        'SIA',
        'SIB',
        'SMB',
        'SMD'
      ],
      tail: [
        'ASn',
        'AVA',
        'AVD',
        'AVF',
        'AVG',
        'AVH',
        'AVJ',
        'AVL',
        'DAn',
        'DDn',
        'DVA',
        'DVB',
        'DVC',
        'PDA',
        'PDB',
        'PLM',
        'PQR',
        'PVC',
        'PVN',
        'PVP',
        'PVQ',
        'PVR',
        'PVT',
        'PVW',
        'VAn',
        'VDn'
      ]
    };

    this.cellClassLegacy = {};
    this.cellClassNonLegacy = {};
    this.classMembersLegacy = {};
    this.classMembersNonLegacy = {};
  }

  addCell(cell, cls, nt, type, emb, inhead, intail) {
    // Special circumstance for legacy complete dataset:
    // Individual muscles were never annotated, so all muscles have to be grouped into one class.
    let cellClass = this.cellClass;
    let classMembers = this.classMembers;

    if (cls.startsWith('BWM')) {
      cellClass = this.cellClassNonLegacy;
      classMembers = this.classMembersNonLegacy;
      this.addCell(cell, 'BODYWALLMUSCLES', nt, type, emb, inhead, intail);
    }

    if (cls == 'BODYWALLMUSCLES') {
      cellClass = this.cellClassLegacy;
      classMembers = this.classMembersLegacy;
    }

    // Set cell properties.
    this.nt[cell] = nt;
    this.nt[cls] = nt;
    this.type[cell] = type;
    this.type[cls] = type;
    this.emb[cell] = emb;
    this.emb[cls] = this.emb[cls] || emb;

    if (inhead) {
      this.validNodes['head'].push(cell);
      this.validNodes['head'].push(cls);
    }

    if (intail) {
      this.validNodes['tail'].push(cell);
      this.validNodes['tail'].push(cls);
    }

    if (!cls.startsWith('BWM')) {
      if (cell != 'LEGACYBODYWALLMUSCLES') {
        this.validNodes['complete'].push(cell);
      }

      this.validNodes['complete'].push(cls);
    }

    // Set VCn class info manually, as individual neurons are different.
    if (cls == 'VCN') {
      this.nt[cls] = 'as';
      this.type[cls] = 'imn';
    }

    // Set which cells are also classes (e.g. DVC)
    this.isCell[cell] = true;
    this.isCell[cls] = cell == cls;
    this.isClass[cls] = true;
    this.isClass[cell] = cell == cls;

    // Set cell classes.
    cellClass[cell] = cls;
    classMembers[cell] = [];

    if (classMembers[cls] === undefined) {
      classMembers[cls] = [];
    }

    classMembers[cls].push(cell);
  }

  // when this function is called:
  //-  all body wall muscle class members annotated at zhen lab will have their 
  // class become the generic 'body wall muscles' class instead of BWM01, BWM02,
  // etc. to make it compatible for comparison with the John White dataset
  // all other legacy classes will have no class members to make it compatible 
  // for comparison
  setToLegacy() {
    Object.entries(this.cellClassLegacy).forEach(entry => {
      let [cls, legacyCellClass] = entry;

      this.cellClass[cls] = legacyCellClass;
    });

    Object.entries(this.classMembersLegacy).forEach(entry => {
      let [cls, legacyClassMembers] = entry;

      this.classMembers[cls] = legacyClassMembers;
    });
  }

  // the inverse function of setToLegacy
  // - zhen lab specific body wall muscle cells will revert to their correct 
  // class
  // - legacy classes will have their class members registered again
  setToNonLegacy() {
    Object.entries(this.cellClassNonLegacy).forEach(entry => {
      let [cls, nonLegacyClass] = entry;

      this.cellClass[cls] = nonLegacyClass;
    });

    Object.entries(this.classMembersNonLegacy).forEach(entry => {
      let [cls, nonLegacyClassMembers] = entry;

      this.classMembers[cls] = nonLegacyClassMembers;
    });
  }
}

module.exports = CellInfo;
