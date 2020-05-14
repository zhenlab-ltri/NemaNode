const $ = require('jquery');

const BaseView = require('./base-view');

class LegendView extends BaseView {
  constructor(model) {
    super();

    this.model = model;

    this.$container = $('#legend');
    this.$items = $('#legend li');

    this.$nodeListType = $('#legend-type');
    this.$nodeListNt = $('#legend-nt');
    this.$nodeItems = $('#legend-nt li, #legend-type li');

    this.$edgeItems = $('#legend-edges li');
    this.$edgeItemStageSpecific = $('#edge-juvenile, #edge-mature, #edge-variable, #edge-stable, #edge-post-embryonic');
    this.$edgeItemNotImaged = $('#edge-not-imaged');

    model.on('nodeColorChanged', nodeColor =>
      this.handleNodeColorChange(nodeColor)
    );
    model.on('networkChanged', networkElements =>
      this.handleNetworkChange(networkElements)
    );

    this.$items.click(e => {
      let $ele = $(e.currentTarget);

      if ($ele.hasClass('active')) {
        $ele.removeClass('active');
        $ele.siblings().removeClass('faded');
      } else {
        $ele.removeClass('faded').addClass('active');
        $ele
          .siblings()
          .removeClass('active')
          .addClass('faded');
      }

      this.emit('highlightChanged', this.getHighlighted());
      this.emit('highlightClicked');
    });

    // On small screens, the legend will only be shown after toggling a button.
    $('#legend-toggle').click(() => {
      this.$container.toggleClass('open');
    });
  }

  // nodeColor: one of ( 'type', 'nt' )
  handleNodeColorChange(nodeColor) {
    let colorByType = nodeColor === 'type';
    let colorByNeurotransmitterType = nodeColor === 'nt';

    if (colorByType) {
      this.$nodeListNt.hide();
      this.$nodeListType.show();
    } else if (colorByNeurotransmitterType) {
      this.$nodeListType.hide();
      this.$nodeListNt.show();
    }

    this.$nodeItems.removeClass('active').removeClass('faded');
    this.emit('highlightChanged', this.getHighlighted());
  }

  handleNetworkChange(networkElements) {
    let { edges } = networkElements;

    let anyNotImaged = Object.values(edges).some(e =>
      e.classes.includes('not-imaged')
    );

    let anyAnnotations = Object.values(edges).some(e => {
      let isMature = e.classes.includes('mature');
      let isJuvenile = e.classes.includes('juvenile');
      let isStable = e.classes.includes('stable');
      let isVariable = e.classes.includes('variable');
      let isPostEmbryonic = e.classes.includes('isPostEmbryonic');


      return isMature || isJuvenile || isStable || isVariable || isPostEmbryonic;
    });

    if (anyNotImaged) {
      this.$edgeItemNotImaged.show();
    } else {
      this.$edgeItemNotImaged.hide();

      if (this.$edgeItemNotImaged.hasClass('active')) {
        this.$edgeItems.removeClass('active').removeClass('faded');
        this.emit('highlightChanged', this.getHighlighted());
      }
    }

    if (anyAnnotations) {
      this.$edgeItemStageSpecific.show();
    } else {
      this.$edgeItemStageSpecific.hide();

      if (this.$edgeItemStageSpecific.hasClass('active')) {
        this.$edgeItems.removeClass('active').removeClass('faded');
        this.emit('highlightChanged', this.getHighlighted());
      }
    }
  }

  getHighlighted() {
    return this.$container
      .find('.active')
      .map(function() {
        return this.id;
      })
      .get();
  }

  open() {
    this.$container.addClass('open');
  }

  close() {
    this.$container.removeClass('open');
  }

  getVisible() {
    this.open();

    let items = $('#legend li:visible')
      .map(function() {
        let $ele = $(this);

        return {
          id: this.id,
          text: $ele.text()
        };
      })
      .get();

    this.close();

    return items;
  }

  setHighlighted(items) {
    this.$items.removeClass('active').removeClass('faded');

    items.forEach(item => {
      let $item = $('#' + item);

      if ($item.is(':visible')) {
        $item.addClass('active');
        $item.siblings().addClass('faded');
      }
    });

    this.emit('highlightChanged', this.getHighlighted());
  }

  removeHighlighted() {
    this.$items.removeClass('active').removeClass('faded');
    this.emit('highlightChanged', []);
  }
}

module.exports = LegendView;
