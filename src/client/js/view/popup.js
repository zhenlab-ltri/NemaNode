const $ = require('jquery');
const BaseView = require('./base-view');

require('jquery-contextmenu');

// Shortcuts.
const SINGLE_KEY_SHORTCUT_MAP = {
  o: 'openGroup',
  c: 'closeGroup',
  r: 'renameGroup',
  f2: 'renameGroup',
  i: 'info',
  h: 'hide',
  delete: 'hide',
  d: 'deselect',
  a: 'grow',
  s: 'split',
  j: 'join',
  g: 'group',
  u: 'ungroup',
  v: 'viewTrajectory'
};

const MOD_KEY_SHORTCUT_MAP = {
  arrowleft: 'alignLeft', // currently broken
  arrowright: 'alignRight',
  arrowup: 'alignTop',
  arrowdown: 'alignBottom',
  h: 'distributeHorizontally',
  v: 'distributeVertically',
  a: 'selectAll'
};

class PopupView extends BaseView {
  constructor() {
    super();
    this.$container = $('#context-menu-container');

    this.impossibleActions = ['all'];

    $('#context-menu-toggle').click(() => {
      this.$container.toggleClass('open');
    });

    this.$container.on(
      'transitionend webkitTransitionEnd oTransitionEnd',
      () => {
        this.emit('transitionEnd');
      }
    );

    let $cyInput = $('#cy-input-container');
    $(document).on('keydown', e => {
      let $inputs = $('input, textarea, #cy-input-container');

      // Skip if any input is in focus.
      if ($inputs.is(':focus') || $cyInput.is(':visible')) {
        return;
      }

      let key = e.key.toLowerCase();
      let modifierKey = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;

      // Prevent ctrl+z, since this messes up the input bar.
      if (modifierKey && key == 'z') {
        e.preventDefault();
        return;
      }

      if (
        this.impossibleActions.includes('all') &&
        !modifierKey &&
        key != 'a'
      ) {
        return;
      }

      // Exclude modifer keys pressed alone.
      if (key == 'shift' || key == 'control' || key == 'alt') {
        return;
      }

      // If the key is valid and the action permitted, emit.
      let action = modifierKey
        ? MOD_KEY_SHORTCUT_MAP[key]
        : SINGLE_KEY_SHORTCUT_MAP[key];

      if (action && !this.impossibleActions.includes(action)) {
        this.emit(action);
        e.preventDefault();
      }
    });

    // Context menu callback triggers.
    let onShow = () => {
      if (this.impossibleActions.includes('all')) {
        this.emit('popupDenied');
        return false;
      }

      this.$container.addClass('visible');
    };
    let onHide = () => this.$container.removeClass('visible');

    // Initialize the context menu.
    let isDisabled = option => this.impossibleActions.includes(option);
    let isVisible = option => !isDisabled(option);

    let callback = option => {
      this.emit(option);
      this.emit('optionSelected');

      return !this.isSmallScreen();
    };

    this.isMobile = false;
    let self = this;

    $.contextMenu({
      selector: '#cy',
      appendTo: '#context-menu',
      animation: {
        duration: 0,
        show: 'show',
        hide: 'hide'
      }, //disable animation
      zIndex: 19,
      callback: callback,
      events: {
        show: onShow,
        hide: onHide
      },
      items: {
        /*viewTrajectory: {
          name: '<u>V</u>iew in 3D',
          isHtmlName: true,
          title: 'View 3D neuron trajectory',
          icon: 'neuron',
          className: 'priority'
        },*/
        openGroup: {
          name: '<u>O</u>pen group',
          isHtmlName: true,
          title: 'Open all selected groups',
          icon: 'expand',
          disabled: isDisabled,
          visible: isVisible,
          className: 'priority'
        },
        closeGroup: {
          name: '<u>C</u>lose group',
          isHtmlName: true,
          title: 'Close all selected groups',
          icon: 'compress',
          disabled: isDisabled,
          visible: isVisible,
          className: 'priority'
        },
        renameGroup: {
          name: '<u>R</u>ename group',
          isHtmlName: true,
          title: 'Rename the selected group',
          icon: 'edit',
          disabled: isDisabled,
          visible: isVisible,
          className: 'priority'
        },
        group_separator: {
          type: 'cm_separator',
          visible: function() {
            return isVisible('ungroup');
          }
        },
        info: {
          name: 'Cell <u>i</u>nfo',
          isHtmlName: true,
          title:
            'Show physiological and anatomical information about the selected nodes.',
          icon: 'info',
          disabled: isDisabled,
          className: 'priority'
        },
        sep1: '---------',
        hide: {
          name: '<u>H</u>ide',
          isHtmlName: true,
          title:
            'Hide the selected nodes from the view. Hidden nodes can be found ' +
            'in the box in the bottom-right corner of the screen.',
          icon: 'hide',
          className: 'priority'
        },
        grow: {
          name: '<u>A</u>dd connected',
          isHtmlName: true,
          title:
            'Add all nodes to the network that are connected to the selected nodes.',
          icon: 'add'
        },
        split: {
          name: '<u>S</u>plit left-right',
          isHtmlName: true,
          title:
            'Split cell class into a node for each of its class members, ' +
            'e.g. AVA to AVAL and AVAR.',
          icon: 'split',
          disabled: isDisabled
        },
        join: {
          name: '<u>J</u>oin left-right',
          isHtmlName: true,
          title:
            'Join all members of the same class into one node, e.g. AVAL and AVAR to AVA.',
          icon: 'join',
          disabled: isDisabled
        },
        sep2: '---------',
        group: {
          name: '<u>G</u>roup',
          isHtmlName: true,
          title:
            'Group all selected nodes into one group node. If an existing group ' +
            'is selected, the nodes are added to this group.',
          icon: 'group',
          disabled: isDisabled
        },
        ungroup: {
          name: '<u>U</u>ngroup',
          isHtmlName: true,
          title:
            'Remove all selected nodes from their groups. Selected group ' +
            'nodes are ungrouped.',
          icon: 'ungroup',
          disabled: isDisabled
        },
        sep3: '---------',
        align: {
          name: 'Align',
          items: {
            alignLeft: { name: 'Align left', icon: 'alignleft' },
            alignRight: { name: 'Align right', icon: 'alignright' },
            alignTop: { name: 'Align top', icon: 'aligntop' },
            alignBottom: { name: 'Align bottom', icon: 'alignbottom' },
            'align-sep1': '---------',
            distributeHorizontally: {
              name: 'Distribute horizontally',
              icon: 'disthorizontal'
            },
            distributeVertically: {
              name: 'Distribute vertically',
              icon: 'distvertical'
            }
          }
        },
        sep4: '---------',
        close: { name: 'Close', icon: 'times' }
      }
    });
  }

  show(position = { x: 0, y: 0 }) {
    let { x, y } = position;

    if ($('.context-menu-root').is(':visible')) {
      $('.context-menu-root')
        .css('left', x)
        .css('top', y);
    } else {
      $('#cy').contextMenu(position);
    }
  }

  update() {
    $.contextMenu('update');
  }

  hide() {
    $('#cy').contextMenu('hide');
    this.close();
  }

  open() {
    this.$container.addClass('open');
  }

  close() {
    this.$container.removeClass('open');
  }

  toggleHighlight(option, check) {
    $('li.context-menu-icon-' + option).toggleClass('highlighted', check);
  }

  getBoundingBox() {
    let $menu;
    if (this.isSmallScreen()) {
      $menu = $('#context-menu-container');
    } else {
      $menu = $('.context-menu-root');
    }

    let { left, top } = $menu.offset();

    return {
      x1: left,
      x2: left + $menu.width(),
      y1: top,
      y2: top + $menu.height()
    };
  }

  preventActions(newImpossibleActions) {
    this.impossibleActions = newImpossibleActions;
  }
}

module.exports = PopupView;
