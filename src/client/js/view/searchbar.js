const $ = require('jquery');
require('jquery-ui-bundle'); // needed for autocomplete
const BaseView = require('./base-view');

const { unique } = require('../util');

const DataService = require('../data-service');

class SearchbarView extends BaseView {
  constructor(model) {
    super();

    this.model = model;

    this.$input = $('#searchbar input');
    this.$loadingWheel = $('#loading-wheel');

    // ----- Events -----
    this.$input.on('input', () => {
      this.emit('inputChanged', this.getInputs());
    });

    this.$input.focusin(() => {
      this.emit('focusin', this.getInputs());
    });

    this.$input.focusout(() => {
      this.emit('focusout');
    });

    this.$input.autocomplete({
      minLength: 1,
      source: (req, res) => this.autocompleteSource(req, res),
      focus: () => {
        return false; // prevent doing anything when element is focused.
      },
      select: (e, ui) => {
        this.autocompleteSelect(e, ui);
        return false; // prevent default action of replacing entire input
      }
    });

    model.on('joinLegacyCells', legacyCellToClass => {
      let inputs = this.getInputs();
      let inputAfterJoining = new Set();

      inputs.forEach(name => {
        let displayName = DataService.getDisplayName(name);
        let classDisplayName = DataService.getDisplayName(
          legacyCellToClass[name] || ''
        );

        if (legacyCellToClass[name] == null) {
          inputAfterJoining.add(displayName);
        } else {
          inputAfterJoining.add(classDisplayName);
        }
      });

      this.$input.val(Array.from(inputAfterJoining).join(', '));
    });
  }

  autocompleteSource(request, response) {
    // Get the last term of the input for the autosuggest.
    let inputs = this.getInputs(request.term);
    let term = inputs.slice(-1)[0];

    if (term == null || term.length === 0) {
      return;
    }

    let validNodes = DataService.cellInfo.validNodes[this.model.database];

    // Restrict suggestions to valid inputs that start with the term.
    let suggestions = unique(validNodes.filter(node => node.startsWith(term)).sort());


    // Suggest muscles as well, if term starts with 'BW' or 'MU'.
    if (
      term == 'B' ||
      term == 'M' ||
      term.startsWith('BW') ||
      term.startsWith('MU')
    ) {
      let muscles = this.validNodes
        .filter(n => DataService.typ(n) == 'b')
        .sort();

      suggestions = unique(suggestions.concat(muscles));
    }

    // Remove suggestions already in the search bar.
    suggestions = suggestions.filter(s => !inputs.includes(s));

    // Return the suggestions.
    response(suggestions.map(s => DataService.getDisplayName(s)));
  }

  autocompleteSelect(e, ui) {
    let lastTerm = this.getInputs().pop();
    let rawInput = this.$input.val();
    let inputWithoutLastTerm = rawInput.substring(
      0,
      rawInput.length - lastTerm.length
    );

    this.$input
      .val(inputWithoutLastTerm + ui.item.value + ', ')
      .trigger('input');
  }

  focus() {
    this.$input.focus();
  }

  blur() {
    this.$input.blur();
  }

  getInputs(inputs) {
    inputs = (inputs || this.$input.val()).replace(/\s/g, '');

    if (inputs === '') {
      return [];
    }

    let tokens = inputs
      .replace(/;/g, ',')
      .toUpperCase()
      .split(',');

    return tokens.map(token => {
      if (DataService.isMotorPseudonym(token)) {
        return `${token}N`; // append N to motor pseudonyms
      }

      return token;
    });
  }

  showLoadingWheel() {
    this.$loadingWheel.show();
  }

  hideLoadingWheel() {
    this.$loadingWheel.hide();
  }

  getBoundingBox() {
    let { top, left } = this.$input.offset();

    return {
      x1: left,
      x2: left + this.$input.width(),
      y1: top,
      y2: top + this.$input.height()
    };
  }

  setInput(input) {
    let displayNames = input.map(i => DataService.getDisplayName(i));

    this.$input.val(displayNames.join(', '));
  }
}

module.exports = SearchbarView;
