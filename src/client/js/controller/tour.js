const $ = require('jquery');
let { deepCopy } = require('../util');
let getTourSteps = require('./tour-steps');

class Tour {
  constructor(view, controller) {
    this.view = view;
    this.controller = controller;

    this.frozenState;
    this.tourNumber = 0;
    this.stepNumber = 0;
    this.state;
    this._isRunning;
  }

  isRunning() {
    return this._isRunning;
  }

  atFirstStep() {
    return this.tourNumber == 0 && this.stepNumber == 0;
  }

  start() {
    this._isRunning = true;
    this.view.graph.disableAnimations();
    // Freeze state before starting tour, so the current network isn't lost.
    this.frozenState = this.controller.getState(); //not allowed to call parent. This has to be redone (TODO)
    this.state = {};
    this.tourNumber = 0;
    this.stepNumber = 0;

    this.runStep();
  }

  end() {
    this.stepNumber = -1;
    this.stop();
  }

  stop() {
    this._isRunning = false;
    this.view.help.hideTour();
    this.view.popup.toggleHighlight('split', false);

    if (!this.view.graph.isSmallScreen()) {
      this.view.graph.enableAnimations();
    }
    // Load frozen state on exit if network isn't empty.
    if (this.frozenState['input'].length > 0) {
      this.controller.setState(this.frozenState); //not allowed to call parent. This has to be redone (TODO)
    } else {
      this.view.graph.removeSelection();
    }
  }

  nextStep() {
    let steps = getTourSteps(this.view);
    this.stepNumber += 1;
    if (this.stepNumber >= steps[this.tourNumber].length) {
      this.tourNumber += 1;
      this.stepNumber = 0;
    }
    this.runStep();
  }

  runStep() {
    let steps = getTourSteps(this.view);
    let step = steps[this.tourNumber][this.stepNumber];

    (() => {
      let d = $.Deferred();

      if (this.atFirstStep()) {
        d.resolve();
      } else {
        this.view.help.hideTour();
        this.view.graph.one('layoutstop', () => d.resolve());

        if (step.state != null) {
          for (let key in step.state) {
            this.state[key] = step.state[key];
          }

          if (step.state.coordinates != null) {
            this.state.coordinates = this.view.graph.scaleCoordinatesToViewport(
              deepCopy(this.state.coordinates)
            );
          }
        }

        this.controller.setState(this.state); //not allowed to call parent. this has to be redone (TODO)
      }

      return d;
    })()
      .then(() => step.initiate())
      .then(() => {
        // Update and display tour.
        this.view.help.setTourContent(
          step.title,
          step.body,
          this.stepNumber + 1,
          steps[this.tourNumber].length,
          this.tourNumber + 1 < steps.length
        );
        this.view.help.showTour(step.coordinate(), step.position);

        // Save current state to revert back to in case UI changes.
        if (!this.atFirstStep()) {
          this.state = this.controller.getState(); //not allowed to call parent. This has to be redone (TODO)
        }
      });
  }
}

module.exports = Tour;
