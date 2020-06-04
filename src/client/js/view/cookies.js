const $ = require('jquery');
const Clipboard = require('clipboard');

const BaseView = require('./base-view');

const KEY_TO_COOKIE_MAP = {
  database: 'db',
  datasets: 'ds',
  nodeColor: 'c',
  layout: 'la',
  thresholdChemical: 'tc',
  thresholdElectrical: 'te',
  showLinked: 'sl',
  showIndividual: 'si',
  showEdgeLabel: 'se',
  showAnnotations: 'sa',
  showPostemb: 'sp',
  input: 'in',
  selected: 's',
  groups: 'g',
  hidden: 'h',
  coordinates: 'cor',
  split: 'sp',
  join: 'jo',
  legendItems: 'ln'
};

const COOKIE_TO_KEY_MAP = Object.keys(KEY_TO_COOKIE_MAP).reduce((obj, key) => {
  obj[KEY_TO_COOKIE_MAP[key]] = key;
  return obj;
}, {});

const encodeParameters = params => {
  let array = [];

  for (let key in params) {
    let value = params[key];

    if (value.length === 0) {
      continue;
    }

    if (typeof value == 'boolean') {
      value += 0;
    }

    if (value.constructor == Array) {
      value = value
        .map(function(item) {
          if (key == 'groups') {
            return [
              item.id,
              encodeURIComponent(item.name.replace(/_/g, '\\_')), //escape underscores
              item.open + 0,
              item.members.join('_')
            ].join('_');
          }
          if (key == 'coordinates') {
            return [item.id, item.x, item.y].join('_');
          }
          return item;
        })
        .join('__');
    }

    array.push(KEY_TO_COOKIE_MAP[key] + '=' + value);
  }

  return array.join('&');
};

const decodeParameters = rawParameters => {
  let parameters = {};

  rawParameters.forEach(parameter => {
    if (!parameter.includes('=')) {
      return;
    }

    let [cookie, value] = parameter.split('=');
    let key = COOKIE_TO_KEY_MAP[cookie];

    if (!key || !value) {
      return;
    }

    if (key == 'database') {
      value = ['complete', 'head', 'tail'].includes(value) ? value : null;
    }
    if (key == 'nodeColor') {
      value = ['nt', 'type'].includes(value) ? value : null;
    }
    if (key == 'layout') {
      value = ['concentric', 'cose-bilkent', 'dagre'].includes(value)
        ? value
        : null;
    }
    if (['thresholdChemical', 'thresholdElectrical'].includes(key)) {
      value = parseInt(value, 10);
    }
    if (
      ['showLinked', 'showIndividual', 'showEdgeLabel', 'showPostemb', 'showAnnotations'].includes(
        key
      )
    ) {
      value = { '1': true, '0': false }[value];
    }
    if (
      [
        'datasets',
        'selected',
        'split',
        'join',
        'hidden',
        'legendItems'
      ].includes(key)
    ) {
      value = value.split('__');
    }
    if (key == 'input') {
      value = value.toUpperCase().split('__');
    }
    if (key == 'groups') {
      let groups = value.split('__');
      value = [];
      groups.forEach(function(item) {
        item = decodeURIComponent(item).match(/(\\_|[^_])+/g); //split by non-escape underscores
        if (item.length < 4) {
          return;
        }
        let id = parseInt(item[0], 10);
        if (isNaN(id)) {
          return;
        }
        value.push({
          id: id,
          name: item[1].replace(/\\_/g, '_'), //unescape underscores
          open: item[2] === '1',
          members: item.slice(3)
        });
      });
    }
    if (key == 'coordinates') {
      let coordinates = value.split('__');
      value = [];
      coordinates.forEach(function(item) {
        item = item.split('_');
        if (item.length < 3) {
          return;
        }
        let x = parseInt(item[1], 10);
        let y = parseInt(item[2], 10);
        if (isNaN(x) || isNaN(y)) {
          return;
        }
        value.push({
          id: item[0],
          x: x,
          y: y
        });
      });
    }
    parameters[key] = value;
  });

  return parameters;
};

class CookiesView extends BaseView {
  constructor(model) {
    super();
    this.model = model;

    this.$container = $('#url');
    this.clipboard = new Clipboard('#url');

    this.clipboard.on('success', e => {
      this.emit('copySuccess', e.text);
      e.clearSelection();
    });

    this.clipboard.on('error', e => {
      this.emit('copyError', e.text);
    });

    this.model.on('databaseChanged', database => {
      this.setCookie('database', database);
    });
    this.model.on('datasetsChanged', datasets => {
      this.setCookie('datasets', datasets.join('__'));
    });
    this.model.on('nodeColorChanged', nodeColor => {
      this.setCookie('nodeColor', nodeColor);
    });
    this.model.on('chemicalThresholdChanged', threshold => {
      this.setCookie('thresholdChemical', threshold);
    });
    this.model.on('electricalThresholdChanged', threshold => {
      this.setCookie('thresholdElectrical', threshold);
    });
    this.model.on('layoutChanged', layout => {
      this.setCookie('layout', layout);
    });
    this.model.on('showLinkedChanged', checked => {
      this.setCookie('showLinked', checked + 0);
    });
    this.model.on('showIndividualChanged', checked => {
      this.setCookie('showIndividual', checked + 0);
    });
    this.model.on('showEdgeLabelChanged', checked => {
      this.setCookie('showEdgeLabel', checked + 0);
    });
    this.model.on('showPostembChanged', checked => {
      this.setCookie('showPostemb', checked + 0);
    });
    this.model.on('showAnnotationsChanged', checked => {
      this.setCookie('showAnnotations', checked + 0);
    });
  }

  setCookie(name, value) {
    let cookieKey = KEY_TO_COOKIE_MAP[name];

    try {
      let expiresMonths = 2;
      let d = new Date();

      d.setTime(d.getTime() + expiresMonths * 30 * 24 * 60 * 60 * 1000);
      document.cookie =
        cookieKey + '=' + value + ';expires=' + d.toUTCString() + ';path=/';
    } catch (e) {
      // Failed to set cookie.
    }
  }

  generateURL(state) {
    const port = location.port ? ':' + location.port : '';
    const baseurl =
      location.protocol + '//' + location.hostname + port + location.pathname;
    const url = baseurl + '?' + encodeParameters(state);

    this.$container.attr('data-clipboard-text', url);
    this.$container.trigger('click');
  }

  getURLParameters() {
    let parameters = location.search.substring(1).split('&');

    return decodeParameters(parameters);
  }

  getCookieParameters() {
    let cookies;

    try {
      cookies = document.cookie.replace(/\s/g, '').split(';');
    } catch (e) {
      cookies = [];
      // Could not read the cookies.
    }

    return decodeParameters(cookies);
  }
}

module.exports = CookiesView;
