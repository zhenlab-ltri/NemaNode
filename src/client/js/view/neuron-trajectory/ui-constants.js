  /** Known scale bar sizes in nanometers. */
  const SCALE_BAR_SIZES = [
    10,
    20,
    25,
    50,
    100,
    200,
    250,
    500,
    1000,
    2000,
    2500,
    5000,
    10000,
    20000,
    25000,
    50000,
    100000,
    200000,
    250000,
    500000,
    1000000,
    2000000,
    2500000,
    5000000,
    10000000,
    20000000,
    25000000,
    50000000,
    100000000,
    200000000,
    250000000,
    500000000,
    1000000000,
    2000000000,
    2500000000,
    5000000000,
    10000000000,
    20000000000,
    25000000000,
    50000000000,
    100000000000,
    200000000000,
    250000000000,
    500000000000];

/** Known scale bar units (SI). */
const SCALE_BAR_UNITS = [
    "nm",
    unescape("%u03BCm"),
    "mm",
    "m"];

const BG_COLOR_OPTIONS = [
  {
    value: 0xffffff,
    label: 'White'
  },
  {
    value: 0x000000,
    label: 'Black'
  }
];

const SHOW_WORM_BODY_OPTIONS = [
  {
    value: true,
    label: 'Show'
  },
  {
    value: false,
    label: 'Hide'
  }
];

const SYNAPSE_VISIBLITY_OPTIONS = ['All', 'Shared'];

const NEURON_COLOR_SCHEME_OPTIONS = [
  {
    value: 'cb-Dark2',
    label: 'Dark'
  },
  {
    value: 'mpn65',
    label: 'Large qualitative'
  },
  {
    value: 'tol',
    label: 'Small qualitative'
  },
  {
    value: 'tol-rainbow',
    label: 'Rainbow'
  },
  {
    value: 'tol-dv',
    label: 'Diverging'
  },
  {
    value: 'cb-Accent',
    label: 'Accent'
  },
  {
    value: 'cb-Paired',
    label: 'Paired'
  },
  {
    value: 'cb-Pastel2',
    label: 'Pastel'
  },
  {
    value: 'sol-accent',
    label: 'Solarized'
  }
];

const CONNECTION_COLOR_SCHEME_OPTIONS = [
  {
    value: {
      preColor: 0xff0000,
      postColor: 0x2ad1c9,
      gapJunctionColor: 0x9f25c2
    },
    label: 'CATMAID'
  },
  {
    value: {
      preColor: 0xf5793a,
      postColor: 0xa95aa1,
      gapJunctionColor: 0x1f2080
    },
    label: 'Contrast'
  },
  {
    value: {
      preColor: 0x601a4a,
      postColor: 0xee442f,
      gapJunctionColor: 0x63acbe
    },
    label: 'Vibrant'
  },
  {
    value: {
      preColor: 0xabc3c9,
      postColor: 0x382119,
      gapJunctionColor: 0xccbe9f
    },
    label: 'Muted'
  }
];


module.exports = {
  SCALE_BAR_SIZES,
  SHOW_WORM_BODY_OPTIONS,
  SCALE_BAR_UNITS,
  BG_COLOR_OPTIONS,
  SYNAPSE_VISIBLITY_OPTIONS,
  NEURON_COLOR_SCHEME_OPTIONS,
  CONNECTION_COLOR_SCHEME_OPTIONS
};