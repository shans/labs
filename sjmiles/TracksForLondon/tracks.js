﻿function line(axis, p, d) {
  var l = document.createElement('line');
  var extent = (axis === 'left' ? 'width' : (axis === 'top' ? 'height' : axis));
  l.setAttribute('extent', extent);
  if (d < 0) {
    axis = (axis === 'left' ? 'right' : (axis === 'top' ? 'bottom' : axis));
  }
  p = Math.abs(p);
  l.style[axis] = p + 'px';
  l.style[extent] = '0px';
  lineParent.appendChild(l);
}

var colCount, colOwners, rowCount, rowOwners;

function matrixillate(matrix) {
  rowCount = matrix.length;
  colCount = rowCount && matrix[0].length || 0;
  //
  // build the transposed matrix
  var transpose = [];
  for (var i=0; i<colCount; i++) {
    var c = [];
    for (var j=0; j<rowCount; j++) {
      c.push(matrix[j][i]);
    }
    transpose.push(c);
  }
  //
  colOwners = findOwners(matrix);
  console.log('colOwners', colOwners);
  rowOwners = findOwners(transpose);
  console.log('rowOwners', rowOwners);
}

function findOwners(matrix) {
  var majCount = matrix.length;
  var minCount = majCount && matrix[0].length || 0;
  var owners = [];
  // for each column (e.g.)
  for (var i=0; i<minCount; i++) {
    // array of columns owner
    var contained = {};
    // look at each row to find an owner
    for (var j=0; j<majCount; j++) {
      // get the row vector
      var vector = matrix[j]
      // node index at [i,j]
      var nodei = vector[i];
      // if a node is there
      if (nodei) {
        // determine if it bounds this column
        var owns = false;
        if (i === 0) {
          owns = (i === majCount-1) || (nodei !== vector[i+1]);
        } else if (i === majCount - 1) {
          owns = (i === 0) || (nodei !== vector[i-1]);
        } else {
          owns = nodei !== vector[i-1] && nodei !== vector[i+1];
        }
        if (owns) {
          contained[nodei] = 1;
        }
      }
      // store the owners for this column
      owners[i] = contained;
    }
  }
  return owners;
}

function colWidth(i) {
  for (var col in colOwners[i]) {
    col = Number(col);
    if (col === 0) {
      return 96;
    }
    var node = nodes[col - 1];
    if (node.hasAttribute('h-flex') || node.hasAttribute('flex')) {
      return -1;
    }
    var w = node.offsetWidth;
    console.log('colWidth(' + i + ') ==', w);
    return w;
  }
  return -1;
}

function rowHeight(i) {
  for (var row in rowOwners[i]) {
    row = Number(row);
    if (row === 0) {
      return 96;
    }
    var node = nodes[row - 1];
    if (node.hasAttribute('v-flex') || node.hasAttribute('flex')) {
      return -1;
    }
    var h = node.offsetHeight;
    /*if (h === 0) {
      continue;
    }*/
    console.log('rowHeight(' + i + ') ==', h);
    return h;
  }
  return -1;
}

var m = 0;

function railize(count, sizeFn) {
  var rails = [];
  var a = 0;
  for (var i=0; i<count; i++) {
    rails[i] = {p: a, s: 1};
    var x = sizeFn(i) + m + m;
    if (x == -1) {
      break;
    }
    a += x;
  }
  if (i === count) {
    rails[i] = {p: 0, s: -1};
  }
  var b = 0;
  for (var ii=count; ii>i; ii--) {
    rails[ii] = {p: b, s: -1};
    x = sizeFn(ii - 1) + m + m;
    if (x !== -1) {
      b += x;
    }
  }
  return rails;
}

function _position(box, maj, min, ext, a, b) {
  box.position = 'absolute';
  if (a.s < 0 && b.s < 0) {
    box[ext] = a.p - b.p - m - m + 'px';
    box[min] = b.p + m + 'px';
  } else if (b.s < 0) {
    box[maj] = a.p + m + 'px';
    box[min] = b.p + m + 'px';
  } else {
    box[maj] = a.p + m + 'px';
    box[ext] = b.p - a.p - m - m + 'px';
  }
}

function position(elt, left, right, top, bottom) {
  _position(elt.style, 'top', 'bottom', 'height', rows[top], rows[bottom]);
  _position(elt.style, 'left', 'right', 'width', columns[left], columns[right]);
}

function layout(matrix, anodes, alineParent) {
  console.group('layout');

  lineParent = alineParent;
  nodes = anodes;
  matrixillate(matrix);

  columns = railize(colCount, colWidth);
  console.group('column rails');
  columns.forEach(function(c) {
    console.log(c.p, c.s);
    line('left', c.p, c.s);
  });
  console.groupEnd();

  rows = railize(rowCount, rowHeight);
  console.group('row rails');
  rows.forEach(function(r) {
    console.log(r.p, r.s);
    line('top', r.p, r.s);
  });
  console.groupEnd();

  console.group('rail boundaries');
  nodes.forEach(function(node, i) {
    // node indices are 1-based
    var n = i + 1;
    // boundary rails
    var l, r, t = 1e10, b = -1e10;
    matrix.forEach(function(vector, i) {
      var f = vector.indexOf(n);
      if (f > -1) {
        l = f;
        r = vector.lastIndexOf(n) + 1;
        t = Math.min(t, i);
        b = Math.max(b, i) + 1;
      }
    });
    console.log(l, r, t, b);
    position(node, l, r, t, b);
    //var s = node.style;
    //console.log(s.left, s.width, s.right, s.top, s.height, s.bottom);
  });
  console.groupEnd();

  console.groupEnd();
}
