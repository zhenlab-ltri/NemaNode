const $ = require('jquery');

const CookiesView = require('./cookies');
const NetworkView = require('./network');
const HelpView = require('./help');
const SearchbarView = require('./searchbar');
const OptionsView = require('./options');

const HiddenView = require('./hidden');
const InfoView = require('./info');
const LegendView = require('./legend');
const NotificationView = require('./notification');
const PopupView = require('./popup');
const NeuronTrajectoryView = require('./neuron-trajectory/');

const BaseView = require('./base-view');

class View extends BaseView {
  constructor(model) {
    super();

    this.model = model;
    this.cookies = new CookiesView(model);
    this.notification = new NotificationView(model);
    this.searchbar = new SearchbarView(model);
    this.graph = new NetworkView(model);
    this.hidden = new HiddenView(model);
    this.legend = new LegendView(model);
    this.options = new OptionsView(model);
    this.popup = new PopupView(model);
    this.info = new InfoView(model);
    this.help = new HelpView(model);

    this.ntv = new NeuronTrajectoryView(model);
  }
}

module.exports = View;
