const $ = require('jquery');

let getTourSteps = view => {
  let popupCoordinates;
  let animationInterval;

  return [
    [
      {
        title: 'Input neurons',
        body: [
          'Input your favorite neurons or neuron classes, separated by a comma.',
          'For example: AIY, ASEL.'
        ],
        coordinate: () => {
          let { x1, y2 } = view.searchbar.getBoundingBox();

          return { x: x1 + 16 + 35, y: y2 };
        },
        position: 'below-right',
        initiate: () => {}
      },
      {
        title: 'Move neurons around',
        body: ['Explore the network by dragging neurons around.'],
        coordinate: () => {
          let { x1, x2, y2 } = view.graph.getBoundingBox(['AIY', 'ASEL']);

          return { x: (x1 + x2) / 2, y: y2 };
        },
        position: 'static',
        state: {
          input: ['AIY', 'ASEL'],
          database: 'head',
          datasets: ['white_l4', 'white_ad'],
          nodeColor: 'type',
          layout: 'concentric',
          thresholdChemical: 3,
          thresholdElectrical: 2,
          showLinked: true,
          showIndividual: false,
          showEdgeLabel: false,
          showPostemb: true,
          coordinates: [
            { id: 'ASEL', x: 0.5, y: 0.4 },
            { id: 'AIY', x: 0.5, y: 0.6 },
            { id: 'AWA', x: 1, y: 0.5 },
            { id: 'RIM', x: 0.5, y: 1 },
            { id: 'AIZ', x: 0.5 + 0.433, y: 0.75 },
            { id: 'RIB', x: 0.75, y: 0.5 + 0.433 },
            { id: 'AIB', x: 0.75, y: 0.5 - 0.433 },
            { id: 'RIA', x: 0.5 + 0.433, y: 0.25 },
            { id: 'ASER', x: 0.25, y: 0.5 - 0.433 },
            { id: 'AIN', x: 0.5, y: 0 },
            { id: 'BAG', x: 0.5 - 0.433, y: 0.25 },
            { id: 'AIA', x: 0.5 - 0.433, y: 0.75 },
            { id: 'AFD', x: 0.25, y: 0.5 + 0.433 },
            { id: 'AWC', x: 0, y: 0.5 }
          ]
        },
        initiate: () => {
          let positions = view.graph.scaleCoordinatesToViewport([
            { id: 'ASER', x: 0.5 - 0.129, y: 0.5 + 0.483 },
            { id: 'BAG', x: 0.5 - 0.354, y: 0.5 + 0.354 },
            { id: 'RIA', x: 0.5 + 0.354, y: 0.5 + 0.354 },
            { id: 'AIA', x: 0.5 + 0.354, y: 0.5 - 0.354 }
          ]);

          let i = 0;
          let animationDuration = 400;
          animationInterval = setInterval(() => {
            view.graph.setPosition(
              positions[i]['id'],
              positions[i],
              animationDuration
            );

            i += 1;
            if (i >= positions.length) {
              clearInterval(animationInterval);
            }
          }, animationDuration);
        }
      },
      {
        title: 'See synapse numbers',
        body: [
          'Hover over connection arrows to show synapse numbers.',
          'Two numbers indicate that two separate datasets are selected. Click the label for more' +
            ' details.'
        ],
        coordinate: () => {
          let { x1, x2, y1, y2 } = view.graph.getBoundingBox(['ASEL', 'AWC']);

          return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 20 };
        },
        position: 'above-right',
        state: {
          coordinates: [
            { id: 'ASEL', x: 0.5, y: 0.4 },
            { id: 'AIY', x: 0.5, y: 0.6 },
            { id: 'AWA', x: 1, y: 0.5 },
            { id: 'RIM', x: 0.5, y: 1 },
            { id: 'AIZ', x: 0.5 + 0.433, y: 0.75 },
            { id: 'RIB', x: 0.75, y: 0.5 + 0.433 },
            { id: 'AIB', x: 0.75, y: 0.5 - 0.433 },
            { id: 'RIA', x: 0.5 + 0.354, y: 0.5 + 0.354 },
            { id: 'ASER', x: 0.5 - 0.129, y: 0.5 + 0.483 },
            { id: 'AIN', x: 0.5, y: 0 },
            { id: 'BAG', x: 0.5 - 0.354, y: 0.5 + 0.354 },
            { id: 'AIA', x: 0.5 + 0.354, y: 0.5 - 0.354 },
            { id: 'AFD', x: 0.25, y: 0.5 + 0.433 },
            { id: 'AWC', x: 0, y: 0.5 }
          ]
        },
        initiate: () => {
          clearInterval(animationInterval);
          view.graph.toggleEdgeLabel('ASELtyp0AWC', true);
        }
      },
      {
        title: 'Select neurons',
        body: [
          'Highlight connections to a neuron by clicking to select it.',
          'Select multiple neurons to highlight overlapping connections.'
        ],
        coordinate: () => {
          let { x1, x2, y1 } = view.graph.getBoundingBox(['AIY', 'ASEL']);

          return { x: (x1 + x2) / 2, y: y1 };
        },
        position: 'above',
        state: {
          selected: ['AIY', 'ASEL']
        },
        initiate: () => {
          view.graph.toggleEdgeLabel('ASELtyp0AWC', false);
          view.popup.hide();
        }
      },
      {
        title: 'Manipulate the network',
        body: [
          'Open the pop-up menu (right-click on computers) to perform manipulations on selected neurons.'
        ],
        coordinate: () => {
          let { x1, x2, y1 } = view.popup.getBoundingBox();
          return { x: (x1 + x2) / 2, y: y1 };
        },
        position: 'above',
        state: {
          selected: ['AWC']
        },
        initiate: () => {
          let d = $.Deferred();
          setTimeout(() => {
            let { x2, y2 } = view.graph.getBoundingBox(['AWC']);

            popupCoordinates = { x: x2 + 50, y: y2 - 50 };

            view.popup.show(popupCoordinates);
            view.popup.open();
            if (view.graph.isSmallScreen()) {
              view.graph.pan(0, -100);
              view.popup.one('transitionEnd', () => {
                d.resolve();
              });
            } else {
              d.resolve();
            }
          }, 200);
          return d;
        }
      },
      {
        title: 'Individual neurons',
        body: [
          '<b>Split</b> neuron class into individual members, or <b>join</b> them to classes again.',
          'AWC is split into its two class members: AWCL and AWCR.'
        ],
        coordinate: () => {
          let { x1, x2, y1 } = view.graph.getBoundingBox(['AWCL', 'AWCR']);

          return { x: (x1 + x2) / 2, y: y1 };
        },
        position: 'above-right',
        initiate: () => {
          let d = $.Deferred();

          view.graph.one('layoutstop', () => {
            if (view.graph.isSmallScreen()) {
              view.graph.pan(0, -100);
            }
            let { x2, y2 } = view.graph.getBoundingBox(['AWCR', 'AWCL']);

            popupCoordinates = { x: x2 + 50, y: y2 - 50 };

            view.popup.show(popupCoordinates);
            view.popup.open();
            view.popup.toggleHighlight('split', true);
            d.resolve();
          });
          view.popup.emit('split');

          return d;
        }
      }
    ],
    [
      {
        title: 'Network parameters',
        body: ['Change network parameters by opening the options sidebar.'],
        coordinate: () => {
          let { x2, y1, y2 } = view.options.getBoundingBox('open-settings');

          return { x: x2, y: (y1 + y2) / 2 };
        },
        position: 'right',
        initiate: () => {
          view.graph.removeSelection();
          view.popup.hide();
          view.popup.toggleHighlight('split', false);
        }
      },
      {
        title: 'Change dataset',
        body: [
          'Change the datasets to explore variability and development.',
          'We suggest using the dataset with the most samples whenever possible.',
          'Please open <span class="a smallhelp">help</span> for further information on the different datasets.'
        ],
        coordinate: () => {
          let { x2, y1, y2 } = view.options.getBoundingBox('set-database');

          return { x: x2, y: (y1 + y2) / 2 };
        },
        position: 'right',
        initiate: () => {
          view.options.show();
          view.options.openSelectOption('set-database');
        }
      },
      {
        title: 'See neurotransmitters',
        body: [
          'Color neurons by reported neurotransmitters instead of cell type.'
        ],
        coordinate: () => {
          let { x2, y1, y2 } = view.options.getBoundingBox('set-node-color');

          return { x: x2, y: (y1 + y2) / 2 };
        },
        position: 'right-top',
        initiate: () => {
          view.options.show();
          view.options.openSelectOption('set-node-color');
        }
      },
      {
        title: 'Hide weak connections',
        body: [
          'Filter out weak connections that may reflect individual variability or artefacts of the annotation process.',
          'We suggest setting the threshold to at least 3-5 chemical synapses and 2 gap junctions for cell classes.'
        ],
        coordinate: () => {
          let { x2, y1, y2 } = view.options.getBoundingBox('hide-edges');

          return { x: x2, y: (y1 + y2) / 2 };
        },
        position: 'right-top',
        initiate: () => {
          view.options.show();
          view.options.closeSelectOptions();
        }
      },
      {
        title: 'Copy the current network',
        body: [
          'Copy a link to the current network layout.',
          'Save the link for later use, or share it with others.'
        ],
        coordinate: () => {
          let { x2, y1, y2 } = view.options.getBoundingBox('get-url');

          return { x: x2, y: (y1 + y2) / 2 };
        },
        position: 'right-top',
        initiate: () => {
          view.options.show();
        }
      },
      {
        title: 'Export image',
        body: [
          'Export your network as a high-resolution image with a legend, better suited for presentations and publications.'
        ],
        coordinate: () => {
          let { x2, y1, y2 } = view.options.getBoundingBox('save-png');
          return { x: x2, y: (y1 + y2) / 2 };
        },
        position: 'right-top',
        initiate: () => {
          view.options.show();
        }
      },
      {
        title: 'Help',
        body: [
          'Get more information, or contact us if you experience any problems.',
          'Have fun!'
        ],
        coordinate: () => {
          let { x1, x2, y2 } = view.help.getBoundingBox();

          return { x: (x1 + x2) / 2, y: y2 };
        },
        position: 'below-left',
        initiate: () => {
          view.options.hide();
        }
      }
    ]
  ];
};

module.exports = getTourSteps;
