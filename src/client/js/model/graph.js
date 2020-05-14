const { deepCopy } = require('../util');
/**
 * Dict
 * @constructor
 */
var Dict = function() {
  'use strict';
  var self = this;
  var storage = {};
  this.get = function(key) {
    return storage[key];
  };
  this.set = function(key, value) {
    storage[key] = value;
    return self;
  };
  this.has = function(key) {
    return storage.hasOwnProperty(key);
  };
  this.delete = function(key) {
    delete storage[key];
  };
  this.keys = function() {
    return Object.keys(storage);
  };
  this.forEach = function(callback) {
    for (var key in storage) {
      callback(key, storage[key]);
    }
  };
  this.size = function() {
    return Object.keys(storage).length;
  };
};

/**
 * Graph
 * @constructor
 */
var Graph = function() {
  'use strict';

  var self = this;

  var node = new Dict();
  var outp = new Dict();
  var inp = new Dict();
  var adj = new Dict();

  this.node = node;
  this.outp = outp;
  this.inp = inp;
  this.adj = adj;

  /**
   * @param {string} n
   * @param {Object=} attr
   */
  this.addNode = function(n, attr = {}) {
    if (!node.has(n)) {
      node.set(n, attr);
      outp.set(n, new Dict());
      inp.set(n, new Dict());
      adj.set(n, new Dict());
    }
  };

  this.removeNode = function(n) {
    if (!node.has(n)) {
      return;
    }
    node.delete(n);
    outp.get(n).forEach(function(u) {
      inp.get(u).delete(n);
    });
    outp.delete(n);
    inp.get(n).forEach(function(u) {
      outp.get(u).delete(n);
    });
    inp.delete(n);
    adj.get(n).forEach(function(u) {
      adj.get(u).delete(n);
      adj.get(n).delete(u);
    });
    adj.delete(n);
  };

  this.isIsolated = function(n) {
    if (!node.has(n)) {
      throw new Error(`${n} is not in the network`);
    }
    return (
      outp.get(n).size() === 0 &&
      inp.get(n).size() === 0 &&
      adj.get(n).size() === 0
    );
  };

  /**
   * @param {string} u
   * @param {string} v
   * @param {string=} type
   * @param {Object=} attr
   */
  this.addEdge = function(u, v, type = 'chemical', attr = {}) {
    self.addNode(u);
    self.addNode(v);
    if (type == 'chemical') {
      outp.get(u).set(v, deepCopy(attr));
      inp.get(v).set(u, deepCopy(attr));
    } else if (type == 'electrical') {
      adj.get(u).set(v, deepCopy(attr));
      adj.get(v).set(u, deepCopy(attr));
    }
  };

  this.hasEdge = function(u, v, type) {
    if (type == 'chemical') {
      return outp.get(u).has(v);
    }
    if (type == 'electrical') {
      return adj.get(u).has(v);
    }
  };

  this.getEdge = function(u, v, type) {
    if (type == 'chemical') {
      return outp.get(u).get(v);
    }
    if (type == 'electrical') {
      return adj.get(u).get(v);
    }
  };

  /**
   * @param {string} u
   * @param {string} v
   * @param {string=} type
   */
  this.removeEdge = function(u, v, type) {
    type = type || 'chemical';
    if (type == 'chemical') {
      outp.get(u).delete(v);
      inp.get(v).delete(u);
    } else if (type == 'electrical') {
      adj.get(u).delete(v);
      adj.get(v).delete(u);
    }
  };

  this.nodes = function() {
    return node.keys();
  };

  /**
   * @param {string=} type
   * @param {string=} n
   */
  this.edges = function(type, n) {
    type = type || 'chemical';
    var edges = [];
    if (n !== undefined) {
      if (!node.has(n)) {
        return [];
      }
      if (type == 'chemical') {
        outp.get(n).forEach(function(u, attr) {
          edges.push([n, u, attr]);
        });
        inp.get(n).forEach(function(u, attr) {
          edges.push([u, n, attr]);
        });
      }
      if (type == 'electrical') {
        adj.get(n).forEach(function(u, attr) {
          edges.push([n, u, attr]);
        });
      }
      return edges;
    }
    if (type == 'chemical') {
      outp.forEach(function(u) {
        outp.get(u).forEach(function(v, attr) {
          edges.push([u, v, attr]);
        });
      });
    } else if (type == 'electrical') {
      var seen = new Dict();
      adj.forEach(function(u) {
        adj.get(u).forEach(function(v, attr) {
          if (!seen.has(u)) {
            seen.set(u, new Dict());
          }
          if (!seen.has(v)) {
            seen.set(v, new Dict());
          }
          if (seen.get(u).has(v) || seen.get(v).has(u)) {
            return;
          }
          seen.get(u).set(v, {});
          seen.get(v).set(u, {});
          edges.push([u, v, attr]);
        });
      });
    }
    return edges;
  };
};

module.exports = Graph;
