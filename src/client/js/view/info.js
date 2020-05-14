const $ = require('jquery');
const BaseView = require('./base-view');

const DataService = require('../data-service');

class InfoView extends BaseView {
  constructor(model) {
    super();

    this.model = model;

    this.$container = $('#infobar-container');
    this.$toggle = $('#infobar-toggle');

    // CSS transitions cancels out jQuery fade, so separate div is required.
    this.$toggle.click(() => {
      if (this.$container.hasClass('open')) {
        this.close();
      } else {
        this.open();
      }
    });

    $('#infobar-container > div').on(
      'transitionend webkitTransitionEnd oTransitionEnd',
      () => {
        this.emit('transitionEnd');
      }
    );

    model.on('selectedChanged', selected => {
      if (selected.length > 0) {
        this.show();
        this.updateContent(selected);
      } else {
        this.hide();
      }
    });
  }

  show() {
    this.$container.stop();
    this.$container.fadeIn(200);
  }

  hide() {
    this.$container.stop();
    this.$container.fadeOut(200);
  }

  open() {
    this.$container.addClass('open');
  }

  close() {
    this.$container.removeClass('open');
  }

  getBoundingBox() {
    let { top, left } = this.$container.offset();

    return {
      x1: left,
      x2: left + this.$container.width(),
      y1: top,
      y2: top + this.$container.height()
    };
  }

  updateContent(selected) {
    let node = DataService.cellClass(selected[0]);

    this.$container
      .find('a.wormatlas')
      .attr(
        'href',
        'http://www.wormatlas.org/neurons/Individual%20Neurons/' +
          node +
          'frameset.html'
      );

    this.$container
      .find('a.wormbase')
      .attr(
        'href',
        'https://www.wormbase.org/species/all/anatomy_term/' + node
      );
  }
}

module.exports = InfoView;
