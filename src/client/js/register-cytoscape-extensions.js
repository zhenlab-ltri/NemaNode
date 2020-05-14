const cytoscape = require('cytoscape');
const cb = require('cytoscape-cose-bilkent');
const dagre = require('cytoscape-dagre');

module.exports = () => {
  cytoscape.use(cb);
  cytoscape.use(dagre);
};
