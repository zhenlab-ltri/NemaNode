const $ = require('jquery');
const BaseView = require('./base-view');

const DataService = require('../data-service');

const SELECT_ELE_ID_TO_EVENT_MAP = {
  'set-database': 'setDatabase',
  'set-node-color': 'setNodeColor',
  'set-layout': 'setLayout'
};

const CHECKBOX_ELE_ID_TO_EVENT_MAP = {
  'show-linked': 'setShowLinked',
  'show-indiv-cells': 'setShowIndividual',
  'show-edge-num': 'setShowEdgeLabel',
  'show-postemb': 'setShowPostemb',
  'show-annotations': 'setShowAnnotations'
};

let createDatasetBookmarks = () => {
  // Make DOM bookmark elements for datasets.
  let $datasetsTimeline = $('#set-datasets');
  let $bookmarkTemplate = $('#dataset-bookmark-template');
  DataService.getDatabaseList().forEach(database => {
    let datasets = DataService.getDatasetList(database);

    // Add dataset count to each selection dropdown option.
    let pluralSuffix = datasets.length > 1 ? 's' : '';
    $('#' + database).append(
      ' <small>(' + datasets.length + ' animal' + pluralSuffix + ')</small>'
    );

    // Add marks on timeline for each dataset.
    let bookmarks = [];
    datasets.forEach(datasetId => {
      let datasetInfo = DataService.getDatasetInfo(database, datasetId);
      let timelineCoordinate = (100 / 55) * datasetInfo['visual_time'];

      let $bookmark = $bookmarkTemplate
        .clone()
        .removeAttr('id')
        .addClass(database)
        .attr('id', 'dataset-' + datasetId);

      $bookmark.find('h1').prepend(datasetInfo['name']);
      $bookmark.find('p').append(datasetInfo['description']);
      $bookmark.children().css('left', timelineCoordinate + '%');

      // Ensure mark hover tooltips don't show outside screen.
      // The defined values could be fetched rather than defined, but didn't 
      // work well cross-platform.
      let parentWidth = 288;
      let minPos = 134 / 2 - 10; //134: tooltip width
      if ((timelineCoordinate / 100) * parentWidth < minPos) {
        $bookmark.find('.dataset-tooltip').css('left', minPos + 'px');
      }
      if (parentWidth - (timelineCoordinate / 100) * parentWidth < minPos) {
        $bookmark
          .find('.dataset-tooltip')
          .css('left', parentWidth - minPos + 'px');
      }

      bookmarks.push($bookmark);
    });
    $datasetsTimeline.append(bookmarks);
  });
};

class OptionsView extends BaseView {
  constructor(model) {
    super();

    this.model = model;

    this.$container = $('#settings');
    this.$cover = $('#cover');

    createDatasetBookmarks();

    $('#open-settings').click(() => {
      this.emit('openSettings');
      this.show();
    });

    $('#close-settings').click(() => {
      this.emit('closeSettings');
      this.hide();
    });

    this.$cover.on('mousedown', e => {
      this.emit('closeSettings');
      this.hide();
      e.preventDefault(); //prevent searchbar focusout
    });

    $(document).click(() => {
      $('.selectbox').removeClass('active');
    });

    $('.sel-placeholder').click(e => {
      e.stopPropagation();

      let $selectbox = $(e.currentTarget).parent();

      $('.selectbox')
        .not($selectbox)
        .removeClass('active');

      $selectbox.toggleClass('active');
    });

    $('.selectbox .option-container div').click(e => {
      let $el = $(e.currentTarget);
      let id = e.currentTarget.id;
      let selectboxId = $el.closest('.selectbox').attr('id');
      let event = SELECT_ELE_ID_TO_EVENT_MAP[selectboxId];

      if ($el.hasClass('selected')) {
        return;
      }

      this.selectOption(id);

      this.emit(event, id);
    });

    $('.checkbox:not(.check-all) input').on('change', e => {
      let id = e.currentTarget.id;
      let checked = e.currentTarget.checked;
      let event = CHECKBOX_ELE_ID_TO_EVENT_MAP[id];

      this.emit(event, checked);
    });

    $('#set-datasets #check-all').on('click', e => {
      let checked = e.currentTarget.checked;

      if (checked) {
        $('#set-datasets .bookmark').addClass('selected');
      } else {
        $('#set-datasets .bookmark:visible:not(:last)').removeClass('selected');
      }

      this.emit('setDatasets', this.getSelectedDatasets());
    });

    $('#set-datasets').on('click', '.bookmark', e => {
      let $bookmark = $(e.currentTarget);
      let selectedDatasets = this.getSelectedDatasets();

      // Do not allow deselect if only one dataset is selected.
      if (selectedDatasets.length == 1 && $bookmark.hasClass('selected')) {
        return;
      }

      $bookmark.toggleClass('selected');

      selectedDatasets = this.getSelectedDatasets();

      $('#set-datasets #check-all').prop(
        'checked',
        selectedDatasets.length == $('#set-datasets .bookmark:visible').length
      );

      this.emit('setDatasets', selectedDatasets);
    });

    $('.number-input .button').click(e => {
      let $el = $(e.currentTarget);
      let $input = $el.parent().find('input');
      let thresInput = parseInt($input.val(), 10);

      thresInput += $el.attr('data-type') == 'plus' ? 1 : -1;
      $input.val(thresInput);
      $input.trigger('input');
    });

    $('.number-input input').on('input', e => {
      let $el = $(e.currentTarget).parent();
      let $input = $el.find('input');
      let threshold = parseInt($input.val(), 10);

      // Input is invalid. Includes NaN.
      if (!(threshold > 0)) {
        $el
          .addClass('error-input')
          .delay(700)
          .queue(next => {
            $el.removeClass('error-input');
            next();
          });
        $input.val(1);
        $input.trigger('input');

        return;
      }

      // Input is valid.
      $input.val(threshold);

      if ($el.attr('id') == 'threshold-chm') {
        this.emit('setThresholdChemical', threshold);
      } else {
        this.emit('setThresholdElectrical', threshold);
      }
    });

    $('#layout-refresh').click(() => {
      this.emit('refreshLayout');
    });

    $('#save-png').click(() => {
      this.emit('saveNetworkAsImage');
    });

    $('#get-url').click(() => {
      this.emit('copyLinkToNetwork');
    });

    model.on('showLinkedChanged', checked => {
      let $showIndivCells = $('#show-indiv-cells').parent();

      if (checked) {
        $showIndivCells.show();
      } else {
        $showIndivCells.hide();
      }
    });
  }

  hide() {
    this.$container.css('overflow-y', 'hidden'); //for ie and edge, the scrollbar is not hidden.
    this.$container.width(0);
    this.$cover.fadeOut('fast');
  }

  show() {
    this.$container.width('330px');
    this.$container.css('overflow-y', 'auto'); //for ie and edge
    this.$cover.fadeIn('fast');
  }

  selectOption(option) {
    let $option = $('#' + option);
    let $selectbox = $option.closest('.selectbox');
    let selectedDatasets = this.getSelectedDatasets();

    $option.siblings().removeClass('selected');
    $option.addClass('selected');
    $selectbox
      .find('.sel-placeholder')
      .text($option[0].childNodes[0].nodeValue);

    // Update list of datasets on database change. If no datasets are selected, select all.
    if ($selectbox.attr('id') == 'set-database') {
      $('#set-datasets .bookmark').hide();
      $('#set-datasets .bookmark.' + option).show();

      if (selectedDatasets.length === 0) {
        $('#set-datasets .bookmark').addClass('selected');
      }

      $('#set-datasets #check-all').prop(
        'checked',
        selectedDatasets.length == $('#set-datasets .bookmark:visible').length
      );
    }
  }

  openSelectOption(option) {
    $('#' + option + ' .sel-placeholder').click();
  }

  closeSelectOptions() {
    $('.selectbox').removeClass('active');
  }

  checkOption(option, check) {
    $('#' + option).prop('checked', check);
  }

  setInput(input, value) {
    $('#' + input + ' input').val(value);
  }

  selectDatasets(datasets) {
    $('.bookmark:visible').removeClass('selected');

    datasets.forEach(dataset => {
      $('.bookmark#dataset-' + dataset).addClass('selected');
    });

    $('#set-datasets #check-all').prop(
      'checked',
      datasets.length == $('#set-datasets .bookmark:visible').length
    );
  }

  getSelectedDatasets() {
    let selectedDatasetEles = $('#set-datasets .bookmark.selected:visible');
    let selectedDatasets = selectedDatasetEles
      .map((i, ele) => ele.id.split('-')[1])
      .get();

    return selectedDatasets;
  }

  getBoundingBox(id) {
    let $element = $('#' + id);
    let { top, left } = $element.offset();

    return {
      x1: left,
      x2: left + $element.width(),
      y1: top,
      y2: top + $element.height()
    };
  }
}

module.exports = OptionsView;
