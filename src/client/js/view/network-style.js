/* eslint no-extra-boolean-cast: "off" */

var cystyle = (function() {
  'use strict';

  // Use browser sniffing to correct incorrectly positioned node labels.
  // from: http://stackoverflow.com/a/9851769/2801037
  var labelShift = '0px';
  if (!!window['opera'] || navigator.userAgent.indexOf(' OPR/') >= 0) {
    // Opera 8.0+
  } else if (typeof InstallTrigger !== 'undefined') {
    // Firefox 1.0+
    labelShift = '2px';
  } else if (
    /constructor/i.test(window.HTMLElement) ||
    (function(p) {
      return p.toString() === '[object SafariRemoteNotification]';
    })(!window['safari'] || window['safari']['pushNotification'])
  ) {
    // Safari 3.0+
  } else if (/*@cc_on!@*/ false || !!document['documentMode']) {
    // Internet Explorer 6-11
  } else if (!!window['StyleMedia']) {
    // Edge 20+
  } else if (!!window['chrome'] && !!window['chrome']['webstore']) {
    // Chrome 1+
    labelShift = '1px';
  }

  var cytoscapeColors = {
    backgroundColor: 'rgb(244,244,244)',
    colorsType: {
      neurosecretory: '#F9D77B',
      sensory: '#F9CEF9',
      inter: '#FF887A',
      motor: '#B7DAF5',
      muscle: '#A8F5A2',
      others: '#D9D9D9'
    },
    colorsNt: {
      acetylcholine: '#FF887A',
      dopamine: '#A8F5A2',
      gaba: '#99CCFF',
      glutamate: '#FFF860',
      octopamine: '#CFACFF',
      serotonin: '#90FFCF',
      tyramine: '#F9D77B',
      unknown: '#D9D9D9',
      none: '#FFFFFF'
    },
    coloursEdge: {
      typ0: 'black',
      typ2: '#666666',
      juvenile: '#2A9EFE',
      mature: '#FF0000',
      'not-classified': '#228B22',
      variable: '#d1cfcf',
      stable: 'black',
      'post-embryonic': '#990000'
    }
  };

  var searchedforNeuronBackground =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NSIgaGVpZ2h0PSI2NSIgdmlld0JveD0iMCAwIDY1IDY1Ij48ZWxsaXBzZSByeT0iMTkuODkiIHJ4PSIuOTc1IiBjeT0iLS4wMTkiIGN4PSIyNC45NDgiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjxlbGxpcHNlIHJ5PSIyOS4wNTUiIHJ4PSIuOTc1IiBjeT0iLjA0NiIgY3g9IjQ2LjAwOCIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjEyLjE1NSIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjcyLjMzMyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjEyLjE1NSIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjE5LjY4MyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjI0LjIxMiIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjYxLjgwMyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjI2LjkxIiByeD0iLjk3NSIgY3k9Ii0uMDE5IiBjeD0iNTYuNTM4IiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiLz48ZWxsaXBzZSByeT0iMjguNTY3IiByeD0iLjk3NSIgY3k9Ii0uMDE5IiBjeD0iNTEuMjczIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiLz48ZWxsaXBzZSByeT0iMjQuMjEyIiByeD0iLjk3NSIgY3k9Ii0uMDE5IiBjeD0iMzAuMjEzIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiLz48ZWxsaXBzZSByeT0iMjYuOTEiIHJ4PSIuOTc1IiBjeT0iLS4wMTkiIGN4PSIzNS40NzgiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjxlbGxpcHNlIHJ5PSIyOC41NjciIHJ4PSIuOTc1IiBjeT0iLS4wMTkiIGN4PSI0MC43NDMiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjxlbGxpcHNlIHJ5PSIxOS44OSIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjY3LjA2OCIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PC9zdmc+'; // original: image/node_background_neuron.svg
  var searchedforMuscleBackground =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOSIgaGVpZ2h0PSIyOSIgdmlld0JveD0iMCAwIDI5IDI5Ij48ZyB0cmFuc2Zvcm09InJvdGF0ZSg0NSAxMjM1LjMwOCAtNTExLjY4KSI+PHBhdGggZD0iTTcyOC4yNCA3MTkuMDE4YS45NzcgMjAuNDgyIDAgMCAwLS43MjQgOC41bDEuNjM3IDEuNjM2YS45NzcgMjAuNDgyIDAgMCAwLS44NDQtMTAuMTg2Ljk3NyAyMC40ODIgMCAwIDAtLjA3LjA1ek03NDguNTgyIDcwNy41N2EuOTc3IDIwLjQ4MiAwIDAgMC0uMTQ3IDEwLjc3Ni45NzcgMjAuNDgyIDAgMCAwIC45NzcgMjAuNDgyLjk3NyAyMC40ODIgMCAwIDAgLjk3Ny0yMC40OC45NzcgMjAuNDgyIDAgMCAwLS4xMDMtOS4wNzJsLTEuNzA1LTEuNzA2ek03NTkuMTIgNzE4LjExYS45NzcgMjAuNDgyIDAgMCAwIC44NDMgMTAuMTY3Ljk3NyAyMC40ODIgMCAwIDAgLjc5My04LjUzMmwtMS42MzYtMS42MzZ6TTc1My43MTIgNzEyLjdhLjk3NyAyMC40ODIgMCAwIDAgMCAuMzcuOTc3IDIwLjQ4MiAwIDAgMCAuOTc1IDIwLjQ4My45NzcgMjAuNDgyIDAgMCAwIC45NzQtMTguOTAzbC0xLjk0OC0xLjk1ek03MzMuNTE1IDcxMy43NDJhLjk3NyAyMC40ODIgMCAwIDAtLjkwNCAxOC44N2wxLjk1IDEuOTVhLjk3NyAyMC40ODIgMCAwIDAgLjAwMi0uMzg4Ljk3NyAyMC40ODIgMCAwIDAtLjk3Ny0yMC40OC45NzcgMjAuNDgyIDAgMCAwLS4wNy4wNDh6TTczOC43OSA3MDguNDY3YS45NzcgMjAuNDgyIDAgMCAwLS45MDggMjAuNDMuOTc3IDIwLjQ4MiAwIDAgMCAuMTAzIDkuMDlsMS43MDQgMS43MDNhLjk3NyAyMC40ODIgMCAwIDAgLjE0OC0xMC43OTIuOTc3IDIwLjQ4MiAwIDAgMC0uOTc2LTIwLjQ4Mi45NzcgMjAuNDgyIDAgMCAwLS4wNy4wNXoiLz48ZWxsaXBzZSByeT0iMjAuNDgyIiByeD0iLjk3NyIgY3k9IjcyMy42MjIiIGN4PSI3NDQuMTM2Ii8+PC9nPjwvc3ZnPg=='; // original: image/node_background_muscle.svg

  return {
    colors: cytoscapeColors,
    stylesheet: [
      {
        selector: '*',
        css: {
          'font-family': '"Open Sans", sans-serif',
          'min-zoomed-font-size': '9px'
        }
      },
      {
        selector: 'node',
        css: {
          'z-index': 10,
          'font-size': '22px',
          'background-color': cytoscapeColors.backgroundColor,
          'border-width': '0px',
          content: 'data(name)',
          'text-opacity': 1,
          'text-valign': 'center',
          width: '45px',
          height: '45px',
          'text-margin-y': labelShift
        }
      },
      {
        selector: 'node:selected, node.searchedfor',
        css: {
          width: '65px',
          height: '65px'
        }
      },
      {
        selector: 'node:selected',
        css: {
          'font-weight': 'bold',
          opacity: 1,
          'border-color': 'black',
          'border-width': '2px'
        }
      },
      {
        selector:
          'node[?none]:selected, node[?muscle]:selected, node[?others]:selected',
        css: {
          height: '25px',
          padding: '7px' //18+8*2=35px
        }
      },
      {
        selector: 'node.nolabel',
        css: {
          'text-opacity': 0
        }
      },
      {
        selector: '.hidden',
        css: {
          height: '45px',
          width: '45px',
          'border-width': '0',
          'font-weight': 'normal'
        }
      },
      {
        selector: 'node.unpositioned',
        css: {
          opacity: 0.7,
          'background-image-opacity': 0.7
        }
      },
      {
        selector: 'node.searchedfor',
        css: {
          'background-clip': 'none',
          'background-repeat': 'no-repeat',
          'background-image': searchedforNeuronBackground,
          'background-height': '65px',
          'background-width': '65px'
        }
      },
      {
        selector: 'node[?none], node[?muscle], node[?others]',
        css: {
          'font-size': '16px',
          shape: 'roundrectangle',
          'text-margin-y': '2px',
          width: 'label',
          height: '10px',
          padding: '12px' //16+7*2=30px
        }
      },
      {
        selector:
          'node[?none].searchedfor, node[?muscle].searchedfor, node[?others].searchedfor',
        css: {
          height: '10px',
          padding: '14px',
          'background-image': searchedforMuscleBackground,
          'background-position-y': '4px',
          'background-repeat': 'repeat-x',
          'background-image-opacity': '0.1'
        }
      },
      {
        selector: 'node.searchedfor.parentNode',
        css: {
          'background-clip': 'none',
          'background-repeat': 'no-repeat',
          'background-image': searchedforNeuronBackground,
          'background-height': '45px',
          'background-width': '45px',
          'background-position-y': '50%',
          'background-image-opacity': '1'
        }
      },
      {
        selector: 'node.searchedfor.nolinked',
        css: {
          'background-image': 'none'
        }
      },
      {
        selector: 'node[color="type"][?muscle]',
        css: { 'background-color': cytoscapeColors.colorsType['muscle'] }
      },
      {
        selector: 'node[color="type"][?others]',
        css: { 'background-color': cytoscapeColors.colorsType['others'] }
      },
      {
        selector:
          'node[color="type"][!muscle][!others], node.parentNode[color="type"]',
        css: (function() {
          var css = {};
          var i = 0;
          for (var type in cytoscapeColors.colorsType) {
            i++;
            css['pie-' + i + '-background-color'] =
              cytoscapeColors.colorsType[type];
            css['pie-' + i + '-background-size'] =
              'mapData(' + type + ', 0, 1, 0, 100)';
            css['pie-' + i + '-background-opacity'] = '0.9';
          }
          return css;
        })()
      },
      {
        selector: 'node[color="nt"][?none]',
        css: {
          'background-color': cytoscapeColors.colorsNt['none'],
          'border-width': '1px',
          'border-color': '#C8C8C8'
        }
      },
      {
        selector: 'node[color="nt"][!none], node.parentNode[color="nt"]',
        css: (function() {
          var css = {};
          var i = 0;
          for (var nt in cytoscapeColors.colorsNt) {
            i++;
            css['pie-' + i + '-background-color'] =
              cytoscapeColors.colorsNt[nt];
            css['pie-' + i + '-background-size'] =
              'mapData(' + nt + ', 0, 1, 0, 100)';
            css['pie-' + i + '-background-opacity'] = '0.9';
          }
          return css;
        })()
      },
      {
        selector: 'node.parentNode', // any group, closed or open
        css: {
          shape: 'roundrectangle',
          'background-color': '#d0d0d0',
          'pie-size': '75%',
          width: '60px',
          height: '60px',
          'background-opacity': 1,
          padding: 0,
          'font-size': '22px'
        }
      },
      {
        selector: 'node.parentNode.hidden',
        css: {
          'text-wrap': 'ellipsis',
          'text-max-width': '80px'
        }
      },
      {
        selector: ':parent', // open group
        css: {
          padding: '15px',
          'background-image': 'none',
          'background-opacity': 1,
          'pie-size': '0%',
          'border-width': 5,
          'text-valign': 'top',
          'text-halign': 'center',
          'font-size': '18px',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle',
          'text-border-width': 13,
          'text-margin-y': '-4px',
          'text-border-opacity': 1,
          'background-color': '#eaeaea',
          'border-color': '#d0d0d0',
          'text-background-color': '#d0d0d0',
          'text-border-color': '#d0d0d0',
          'border-opacity': 1
        }
      },
      {
        selector: 'edge',
        css: {
          width: 'data(width)',
          'font-size': '18px',
          'z-index': 5,
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-color': cytoscapeColors.coloursEdge['typ0'],
          'target-arrow-color': cytoscapeColors.coloursEdge['typ0'],
          color: 'black',

          'text-outline-width': 2,
          'text-outline-color': cytoscapeColors.backgroundColor,
          'source-distance-from-node': 10,
          'target-distance-from-node': 10
        }
      },
      {
        selector: 'edge[type = 2]',
        css: {
          'curve-style': 'segments',
          'target-arrow-shape': 'none',
          'line-color': cytoscapeColors.coloursEdge['typ2'],
          'target-arrow-color': cytoscapeColors.coloursEdge['typ2'],
          'source-arrow-color': cytoscapeColors.coloursEdge['typ2'],
          'segment-distances': '0 -8 8 -8 8 0'
        }
      },
      {
        selector: 'edge.hover',
        css: {
          'z-compound-depth': 'top'
        }
      },
      {
        selector: 'edge.hover, edge.showEdgeLabel',
        css: {
          content: 'data(label)',
          'font-weight': 'bold'
        }
      },
      {
        selector: 'edge.focus',
        css: {
          content: 'data(label_long)',
          'text-wrap': 'wrap'
        }
      },
      {
        selector: 'edge.faded',
        css: {
          'z-compound-depth': 'auto',
          content: ''
        }
      },
      {
        selector: 'edge.besideGj',
        css: {
          'curve-style': 'unbundled-bezier'
        }
      },
      {
        selector: 'edge:loop',
        css: {
          'curve-style': 'bezier',
          'source-distance-from-node': 0,
          'target-distance-from-node': 0
        }
      },
      {
        selector: 'edge[type = 2]:loop',
        css: {
          'target-arrow-shape': 'tee',
          'source-arrow-shape': 'tee'
        }
      },
      {
        selector: 'edge.juvenile',
        css: {
          'line-color': cytoscapeColors.coloursEdge['juvenile'],
          'target-arrow-color': cytoscapeColors.coloursEdge['juvenile'],
          color: 'black'
        }
      },
      {
        selector: 'edge.mature',
        css: {
          'line-color': cytoscapeColors.coloursEdge['mature'],
          'target-arrow-color': cytoscapeColors.coloursEdge['mature'],
          color: 'black'
        }
      },
      {
        selector: 'edge.stable',
        css: {
          'line-color': cytoscapeColors.coloursEdge['stable'],
          'target-arrow-color': cytoscapeColors.coloursEdge['stable'],
          color: 'black'
        }
      },
      {
        selector: 'edge.variable',
        css: {
          'line-color': cytoscapeColors.coloursEdge['variable'],
          'target-arrow-color': cytoscapeColors.coloursEdge['variable'],
          color: 'black'
        }
      },
      {
        selector: 'edge.post-embryonic',
        css: {
          'line-color': cytoscapeColors.coloursEdge['post-embryonic'],
          'target-arrow-color': cytoscapeColors.coloursEdge['post-embryonic'],
          color: 'black'
        }
      },
      {
        selector: 'edge.not-classified',
        css: {
          'line-color': cytoscapeColors.coloursEdge['not-classified'],
          'target-arrow-color': cytoscapeColors.coloursEdge['not-classified'],
          color: 'black'
        }
      },
      {
        selector: '.faded',
        css: {
          opacity: 0.3,
          'z-index': 0,
          'background-image-opacity': 0.2
        }
      },
      {
        selector: 'edge.faded',
        css: {
          opacity: 0.1
        }
      },
      {
        // Dynamic nodes to replicate legend in cytoscape.
        selector: 'node.legend',
        css: {
          width: 'data(width)',
          height: 'data(height)',
          shape: 'data(shape)',
          'text-margin-x': 'data(labelshift)',
          'background-color': 'data(color)',
          'background-opacity': 'data(opacity)',
          'text-halign': 'right',
          'text-valign': 'center',
          'border-width': 'data(border)', //border only for nt-n
          'border-color': '#C8C8C8'
        }
      },
      {
        selector: 'edge.legend',
        css: {
          content: 'data(label)',
          'font-weight': 'bold',
          'font-size': '14px',
          'text-outline-width': 0,
          'text-margin-y': 'data(labelyshift)',
          'text-margin-x': 'data(labelxshift)'
        }
      }
    ]
  };
})();

module.exports = cystyle;
