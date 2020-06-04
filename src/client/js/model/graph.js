const { deepCopy } = require('../util');

class Graph {
  constructor() {
    this.node = new Map();
    this.outp = new Map();
    this.inp = new Map();
    this.adj = new Map();
  }

  addNode(n, attr = {}) {
    const { node, outp, inp, adj } = this;
    if (!node.has(n)) {
      node.set(n, attr);
      outp.set(n, new Map());
      inp.set(n, new Map());
      adj.set(n, new Map());
    }
  }

  removeNode(n) {
    const { node, outp, inp, adj } = this;
    if (!node.has(n)) {
      return;
    }
    node.delete(n);
    outp.get(n).forEach(function(_, u) {
      inp.get(u).delete(n);
    });
    outp.delete(n);
    inp.get(n).forEach(function(_, u) {
      outp.get(u).delete(n);
    });
    inp.delete(n);
    adj.get(n).forEach(function(_, u) {
      adj.get(u).delete(n);
      adj.get(n).delete(u);
    });
    adj.delete(n);
  }

  isIsolated(n) {
    const { node, outp, inp, adj } = this;
    if (!node.has(n)) {
      throw new Error(`${n} is not in the network`);
    }
    return (
      outp.get(n).size === 0 &&
      inp.get(n).size === 0 &&
      adj.get(n).size === 0
    );
  }

  addEdge(u, v, type = 'chemical', attr = {}) {
    const { outp, inp, adj } = this;
    this.addNode(u);
    this.addNode(v);
    if (type == 'chemical') {
      outp.get(u).set(v, deepCopy(attr));
      inp.get(v).set(u, deepCopy(attr));
    } else if (type == 'electrical') {
      adj.get(u).set(v, deepCopy(attr));
      adj.get(v).set(u, deepCopy(attr));
    }
  }

  hasEdge(u, v, type) {
    const { outp, adj } = this;
    if (type == 'chemical') {
      return outp.get(u).has(v);
    }
    if (type == 'electrical') {
      return adj.get(u).has(v);
    }
  }

  getEdge(u, v, type) {
    const { outp, adj } = this;
    if (type == 'chemical') {
      return outp.get(u).get(v);
    }
    if (type == 'electrical') {
      return adj.get(u).get(v);
    }
  }

  removeEdge(u, v, type = 'chemical') {
    const { outp, inp, adj } = this;
    if (type == 'chemical') {
      outp.get(u).delete(v);
      inp.get(v).delete(u);
    } else if (type == 'electrical') {
      adj.get(u).delete(v);
      adj.get(v).delete(u);
    }
  }

  nodes() {
    return Array.from(this.node.keys());
  }

  edges(type = 'chemical', n) {
    const { node, outp, inp, adj } = this;
    let edges = [];
    if (n !== undefined) {
      if (!node.has(n)) {
        return [];
      }
      if (type == 'chemical') {
        outp.get(n).forEach(function(attr, u) {
          edges.push([n, u, attr]);
        });
        inp.get(n).forEach(function(attr, u) {
          edges.push([u, n, attr]);
        });
      }
      if (type == 'electrical') {
        adj.get(n).forEach(function(attr, u) {
          edges.push([n, u, attr]);
        });
      }
      return edges;
    }
    if (type == 'chemical') {
      outp.forEach(function(_, u) {
        outp.get(u).forEach(function(attr, v) {
          edges.push([u, v, attr]);
        });
      });
    } else if (type == 'electrical') {
      let seen = new Map();
      adj.forEach(function(_, u) {
        adj.get(u).forEach(function(attr, v) {
          if (!seen.has(u)) {
            seen.set(u, new Map());
          }
          if (!seen.has(v)) {
            seen.set(v, new Map());
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
  }
}

module.exports = Graph;
