const $ = require('jquery');
const { saveAs } = require('file-saver');
const BaseView = require('./base-view');

//const { getNematodeDatasetJson } = require('../services');

class HelpView extends BaseView {
  constructor(model) {
    super();
    this.model = model;

    this.$container = $('#help');
    this.$body = $('#help .body');
    this.$menu = $('#help .menu');
    this.$content = $('#help .content');
    this.$arrowBack = $('#help .header .back');

    this.$tour = $('#tour');
    this.$tourTitle = this.$tour.find('h1');
    this.$tourBody = this.$tour.find('.body');
    this.$tourButtonNext = this.$tour.find('.next');
    this.$tourButtonDone = this.$tour.find('.done');
    this.$tourProgress = this.$tour.find('.progress');

    this.mouseOutsideBody = false;
    this.lastPositionLeft = 0;
    this.lastPositionTop = 0;

    $('body').mouseleave(() => (this.mouseOutsideBody = true));

    $('body').mouseenter(() => {
      this.mouseOutsideBody = false;
      this.lastPositionLeft = 0;
      this.lastPositionTop = 0;
    });

    $('#show-help').click(() => this.show());

    $(document).on('click', '.smallhelp, .open-help', e => {
      let topic = $(e.currentTarget).attr('data-topic');

      this.show(topic);
    });

    $('#help .close').click(() => this.hide());

    $('#help .menu li:not(#take-a-tour)').click(e => {
      let topic = e.currentTarget.id;
      this.showTopic(topic);
    });

    $('#take-a-tour').click(() => this.emit('startTour'));

    $('#tour .close, #tour .done').click(() => this.emit('endTour'));

    $('#tour .next').click(e => {
      this.emit('nextTourStep');
      e.stopPropagation(); //prevent bubbling to inactive select boxes.
    });

    this.$arrowBack.click(() => this.showMenu());

    this.$container.draggable({
      handle: '.header',
      cancel: 'i',
      scroll: false,
      drag: this.onDrag
    });

    this.$tour.draggable({
      cancel: 'i, button',
      scroll: false,
      drag: this.onDrag
    });
  }

  onDrag(e, ui) {
    let { mouseOutsideBody, lastPositionLeft, lastPositionTop } = this;

    if (mouseOutsideBody && !lastPositionLeft && !lastPositionTop) {
      this.lastPositionLeft = ui['position']['left'];
      this.lastPositionTop = ui['position']['top'];
    }

    if (mouseOutsideBody) {
      ui.position.left = lastPositionLeft;
      ui.position.top = lastPositionTop;
    }
  }

  show(topic) {
    this.$container.fadeIn('fast');
    if (topic) {
      this.showTopic(topic);
    } else {
      this.showMenu();
    }
  }

  showMenu() {
    this.$menu.show();
    this.$content.hide();
    this.$arrowBack.hide();
    this.$body.css('height', this.$menu.height());
  }
  showTopic(topic) {
    let { $content, $menu, $arrowBack, $body } = this;

    $content.children().hide();
    $('#' + topic + '-content').show()


/*
    $content.load('help/' + topic + '.html', (response, status) => {
      if (status == 'error') {
        $content.html(
          '<p>Could not load the content. Please ensure that you are online.</p>'
        );
      }

      let distanceFromBottom =
        $(window).height() - $body.offset().top - $body.outerHeight();
      let maxHeight = Math.min($body.height() + distanceFromBottom - 10, 800);
      let contentHeight = $content.height();

      $body
        .css('overflow', maxHeight < contentHeight ? 'auto' : 'hidden')
        .css('height', Math.min(maxHeight, $content.height()));


      if( topic === 'download-data' ){
        $('.download-dataset-item').on('click', e => {
          let datasetId = e.currentTarget.id;

          this.downloadDataset(datasetId);
        });
      }
    });*/

    $menu.hide();
    $content.show();
    $arrowBack.show();
  }

  downloadDataset(datasetId){
    /*getNematodeDatasetJson({datasetId}).then( json => {
      let blob = new Blob([JSON.stringify(json, null, 2)], {type: "text/plain;charset=utf-8"});
      saveAs(blob, `${datasetId}.json`);
    });*/
  }

  hide() {
    this.$container.fadeOut('fast');
  }

  getBoundingBox() {
    let $element = $('#show-help');
    let { top, left } = $element.offset();

    return {
      x1: left,
      x2: left + $element.width(),
      y1: top,
      y2: top + $element.height()
    };
  }

  setTourContent(title, body, step, totalSteps, moreStepsAvailable) {
    this.$tourTitle.text(title);
    this.$tourBody.html('<p>' + body.join('</p><p>') + '</p>');

    if (step == 1) {
      this.$tourButtonNext.show().text('Next tip');
      this.$tourButtonDone.hide();
    }

    if (step == totalSteps) {
      this.$tourButtonDone.show();

      if (moreStepsAvailable) {
        this.$tourButtonNext.text('Show me more tips');
      } else {
        this.$tourButtonNext.hide();
      }
    }

    let progressDots = [];
    for (let i = 1; i <= totalSteps; i++) {
      progressDots.push(i === step ? '<div class="active" />' : '<div />');
    }

    this.$tourProgress.html(progressDots.join(''));
  }

  showTour(coordinate, position) {
    let { $tour } = this;

    const arrowWidth = 20;
    const distanceToArrow = 35;
    let containerWidth = $tour.width();
    let containerHeight = $tour.height();

    $tour.hide();
    // If vertical position is outside viewport, scroll the options sidebar.
    let currentScroll = $('#settings').scrollTop();
    let offset = coordinate.y - window.innerHeight;

    if (coordinate.y < 0) {
      $('#settings').animate(
        { scrollTop: currentScroll + coordinate.y - 50 },
        200
      );
      coordinate.y = 50;
    }

    if (offset > 0) {
      $('#settings').animate(
        { scrollTop: currentScroll + offset + distanceToArrow },
        200
      );
      coordinate.y -= offset + distanceToArrow;
    }

    // If horizontal position is outside viewport, push it back in.
    if (
      coordinate.x + containerWidth > window.innerWidth &&
      position.startsWith('right')
    ) {
      coordinate.x = window.innerWidth - containerWidth - arrowWidth;
    }

    // Set position.
    if (position == 'below-right') {
      $tour.css('left', coordinate.x - distanceToArrow);
      $tour.css('top', coordinate.y + arrowWidth);
      $tour.attr('data-direction', 'topleft');
    } else if (position == 'below-left') {
      $tour.css('left', coordinate.x + distanceToArrow - containerWidth);
      $tour.css('top', coordinate.y + arrowWidth);
      $tour.attr('data-direction', 'topright');
    } else if (position == 'below') {
      $tour.css('left', coordinate.x - containerWidth / 2);
      $tour.css('top', coordinate.y + arrowWidth);
      $tour.attr('data-direction', 'top');
    } else if (position == 'above') {
      $tour.css('left', coordinate.x - containerWidth / 2);
      $tour.css('top', coordinate.y - arrowWidth - containerHeight);
      $tour.attr('data-direction', 'bottom');
    } else if (position == 'above-right') {
      $tour.css('left', coordinate.x - distanceToArrow);
      $tour.css('top', coordinate.y - arrowWidth - containerHeight);
      $tour.attr('data-direction', 'bottomleft');
    } else if (position == 'right') {
      $tour.css('left', coordinate.x + arrowWidth);
      $tour.css('top', coordinate.y - distanceToArrow);
      $tour.attr('data-direction', 'lefttop');
    } else if (position == 'right-top') {
      $tour.css('left', coordinate.x + arrowWidth);
      $tour.css('top', coordinate.y + distanceToArrow - containerHeight);
      $tour.attr('data-direction', 'leftbottom');
    } else if (position == 'static') {
      $tour.attr('data-direction', 'none');
    }
    $tour.fadeIn('fast');
  }

  hideTour() {
    this.$tour.hide();
  }
}

module.exports = HelpView;
