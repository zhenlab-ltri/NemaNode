let createGrid = function(nodes, params) {
  let { x: offsetX, y: offsetY, rows, spacing = 50 } = params;

  let positions = {};
  let x = 0;
  let y = 0;

  nodes.forEach(n => {
    let hasLongName = n.length > 5;

    if (hasLongName && x == rows - 1) {
      x = 0;
      y += 1;
    }

    positions[n] = {
      x: offsetX + (x + (hasLongName ? 0.5 : 0)) * spacing,
      y: offsetY + y * spacing
    };

    x += hasLongName ? 2 : 1;

    if (x >= rows) {
      x = 0;
      y += 1;
    }
  });

  return positions;
};

let createCircle = function(nodes, params) {
  let { x: offsetX, y: offsetY } = params;
  let positions = {};
  let n = nodes.length;

  if (n == 1) {
    positions[nodes[0]] = { x: offsetX, y: offsetY };
    return positions;
  } else if (n == 2) {
    positions[nodes[0]] = { x: offsetX - 35, y: offsetY };
    positions[nodes[1]] = { x: offsetX + 35, y: offsetY };
  } else if (n == 3) {
    positions[nodes[0]] = { x: offsetX, y: offsetY - 35 };
    positions[nodes[1]] = { x: offsetX - 35, y: offsetY + 35 };
    positions[nodes[2]] = { x: offsetX + 35, y: offsetY + 35 };
  } else if (n == 4 && nodes[0] == 'RMED') {
    positions[nodes[0]] = { x: offsetX, y: offsetY - 50 };
    positions[nodes[1]] = { x: offsetX - 50, y: offsetY };
    positions[nodes[2]] = { x: offsetX + 50, y: offsetY };
    positions[nodes[3]] = { x: offsetX, y: offsetY + 50 };
  } else if (n == 4) {
    positions[nodes[0]] = { x: offsetX - 35, y: offsetY - 35 };
    positions[nodes[1]] = { x: offsetX + 35, y: offsetY - 35 };
    positions[nodes[2]] = { x: offsetX - 35, y: offsetY + 35 };
    positions[nodes[3]] = { x: offsetX + 35, y: offsetY + 35 };
  } else if (n == 6) {
    positions[nodes[0]] = { x: offsetX - 35, y: offsetY - 60 };
    positions[nodes[1]] = { x: offsetX + 35, y: offsetY - 60 };
    positions[nodes[2]] = { x: offsetX - 70, y: offsetY };
    positions[nodes[3]] = { x: offsetX + 70, y: offsetY };
    positions[nodes[4]] = { x: offsetX - 35, y: offsetY + 60 };
    positions[nodes[5]] = { x: offsetX + 35, y: offsetY + 60 };
  } else {
    let r = 70;
    for (let i = 0; i < n; i++) {
      let theta = (-i * 2 * Math.PI) / n;
      positions[nodes[i]] = {
        x: offsetX - r * Math.sin(theta),
        y: offsetY - r * Math.cos(theta)
      };
    }
  }
  return positions;
};

module.exports = { createCircle, createGrid };
