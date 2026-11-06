// Study: timed practice by question type. Every type has a mastery score built
// from the accuracy and speed of its recent attempts. Questions come only from
// the types the user has ticked. Answer checking is shared with math.js.
(function () {
  'use strict';

  var M = window.hpMath, J = window.hpJuice;
  var ri = M.ri, rnz = M.rnz, pick = M.pick, coin = M.coin, gcd = M.gcd, round = M.round;
  var fmt = M.fmt, frac = M.frac, poly = M.poly, Q = M.Q, num = M.num, fracAns = M.fracAns, tenth = M.tenth, lab = M.lab;
  var TRIPLES = M.TRIPLES;

  function $(id) { return document.getElementById(id); }

  // ---------- Question helpers ----------
  var DEGREES = 'In degrees';
  var TENTH = 'Nearest tenth';
  var PI_HINT = 'Nearest tenth, or exact like 25π';

  // k·π as a rounded answer; typing the exact form (25π) also works
  function piAns(k) {
    var v = k * Math.PI, spec = tenth(v);
    spec.show = (k % 1 === 0 ? fmt(k) + 'π ≈ ' : '≈ ') + fmt(round(v, 1));
    return spec;
  }
  function word(value, options, show) { return { kind: 'word', value: value, options: options, show: show || value }; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = ri(0, i), t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function triple() {
    var T = pick(TRIPLES.slice(0, 3)), k = pick([1, 1, 2, 3]);
    return [T[0] * k, T[1] * k, T[2] * k];
  }
  function point(x, y) { return '(' + fmt(x) + ', ' + fmt(y) + ')'; }
  function xy(x, y) { return [lab('x =', num(x)), lab('y =', num(y))]; }

  // Two expressions in x that come out to the given values at x
  function exprPair(x, v1, v2) {
    var a = ri(2, 5), c;
    do { c = ri(2, 5); } while (c === a);
    return [poly([a, v1 - a * x]), poly([c, v2 - c * x]), a, c];
  }
  function reuse(id) { return M.topic(id).gen; }

  // ---------- Question types ----------
  // par: seconds a confident student should need. It sets the speed part of mastery.
  var TOPICS = [
    // ----- Lines & angles -----
    { id: 'geo-comp-supp', group: 'Lines & angles', name: 'Complementary & supplementary angles', par: 25, gen: function () {
      var a;
      switch (ri(0, 2)) {
        case 0:
          a = ri(5, 85);
          return Q('What is the complement of a ' + a + '° angle?', num(90 - a), 'Complementary angles add to 90°: 90 − ' + a + ' = ' + (90 - a) + '°.', DEGREES);
        case 1:
          a = ri(10, 170);
          return Q('What is the supplement of a ' + a + '° angle?', num(180 - a), 'Supplementary angles add to 180°: 180 − ' + a + ' = ' + (180 - a) + '°.', DEGREES);
        default:
          var x = ri(5, 20), v = ri(40, 140), e = exprPair(x, v, 180 - v);
          return Q('Angles of (' + e[0] + ')° and (' + e[1] + ')° are supplementary. Find x.', lab('x =', num(x)),
            'Set their sum to 180: (' + e[0] + ') + (' + e[1] + ') = 180, which gives x = ' + x + '.');
      }
    } },
    { id: 'geo-vertical', group: 'Lines & angles', name: 'Vertical angles & linear pairs', par: 35, gen: function () {
      if (coin()) {
        var a = ri(15, 165);
        return Q('Two angles form a linear pair. One measures ' + a + '°. What does the other measure?', num(180 - a),
          'A linear pair adds to 180°: 180 − ' + a + ' = ' + (180 - a) + '°.', DEGREES);
      }
      var x = ri(5, 25), v = ri(30, 150), e = exprPair(x, v, v);
      return Q('Two vertical angles measure (' + e[0] + ')° and (' + e[1] + ')°. Find x.', lab('x =', num(x)),
        'Vertical angles are equal: ' + e[0] + ' = ' + e[1] + ', so x = ' + x + '.');
    } },
    { id: 'geo-parallel', group: 'Lines & angles', name: 'Parallel lines & transversals', par: 35, gen: function () {
      var kind = pick(['corresponding', 'alternate interior', 'alternate exterior', 'same-side interior']);
      var same = kind === 'same-side interior', a = ri(35, 145);
      var rule = same ? 'Same-side interior angles are supplementary (they add to 180°).' : 'With parallel lines, ' + kind + ' angles are equal.';
      if (coin()) {
        return Q('Two parallel lines are cut by a transversal. One of a pair of ' + kind + ' angles measures ' + a + '°. What does the other measure?',
          num(same ? 180 - a : a), rule + ' The other angle is ' + (same ? 180 - a : a) + '°.', DEGREES);
      }
      var x = ri(5, 25), e = exprPair(x, a, same ? 180 - a : a);
      return Q('Two parallel lines are cut by a transversal. A pair of ' + kind + ' angles measure (' + e[0] + ')° and (' + e[1] + ')°. Find x.',
        lab('x =', num(x)), rule + ' Solving gives x = ' + x + '.');
    } },
    { id: 'geo-bisector', group: 'Lines & angles', name: 'Angle addition & bisectors', par: 35, gen: function () {
      var a, b;
      switch (ri(0, 2)) {
        case 0:
          a = ri(20, 80);
          return Q('Ray BD bisects ∠ABC, and m∠ABC = ' + 2 * a + '°. Find m∠ABD.', num(a), 'A bisector cuts the angle into two equal parts: ' + 2 * a + ' ÷ 2 = ' + a + '°.', DEGREES);
        case 1:
          a = ri(20, 80); b = ri(20, 80);
          return Q('Point D is inside ∠ABC. m∠ABD = ' + a + '° and m∠ABC = ' + (a + b) + '°. Find m∠DBC.', num(b), 'The two parts add to the whole: ' + (a + b) + ' − ' + a + ' = ' + b + '°.', DEGREES);
        default:
          var x = ri(5, 20), v = ri(20, 80), e = exprPair(x, v, v);
          return Q('Ray BD bisects ∠ABC. m∠ABD = (' + e[0] + ')° and m∠DBC = (' + e[1] + ')°. Find x.', lab('x =', num(x)),
            'The two halves are equal: ' + e[0] + ' = ' + e[1] + ', so x = ' + x + '.');
      }
    } },

    // ----- Triangles -----
    { id: 'geo-tri-sum', group: 'Triangles', name: 'Triangle angle sum', par: 25, gen: function () {
      if (coin()) {
        var a = ri(20, 100), b = ri(20, 150 - a);
        return Q('Two angles of a triangle are ' + a + '° and ' + b + '°. What is the third angle?', num(180 - a - b),
          'The angles add to 180°: 180 − ' + a + ' − ' + b + ' = ' + (180 - a - b) + '°.', DEGREES);
      }
      var r = pick([[1, 2, 3], [2, 3, 4], [1, 1, 2], [3, 4, 5], [1, 4, 5], [2, 3, 5]]), sum = r[0] + r[1] + r[2], unit = 180 / sum;
      return Q('The angles of a triangle are in the ratio ' + r.join(' : ') + '. What is the largest angle?', num(r[2] * unit),
        r.join(' + ') + ' = ' + sum + ' parts, so one part is 180 ÷ ' + sum + ' = ' + unit + '°. The largest is ' + r[2] + ' × ' + unit + ' = ' + r[2] * unit + '°.', DEGREES);
    } },
    { id: 'geo-ext-angle', group: 'Triangles', name: 'Exterior angles of triangles', par: 30, gen: function () {
      var a = ri(20, 80), b = ri(20, 80);
      if (coin()) {
        return Q('A triangle has remote interior angles of ' + a + '° and ' + b + '°. What is the exterior angle?', num(a + b),
          'An exterior angle equals the sum of the two remote interior angles: ' + a + ' + ' + b + ' = ' + (a + b) + '°.', DEGREES);
      }
      return Q('An exterior angle of a triangle measures ' + (a + b) + '°. One remote interior angle is ' + a + '°. What is the other?', num(b),
        'The two remote interior angles add to the exterior angle: ' + (a + b) + ' − ' + a + ' = ' + b + '°.', DEGREES);
    } },
    { id: 'geo-isosceles', group: 'Triangles', name: 'Isosceles & equilateral triangles', par: 30, gen: function () {
      var base = ri(25, 80), v = 180 - 2 * base, s = ri(3, 20);
      switch (ri(0, 2)) {
        case 0: return Q('An isosceles triangle has a vertex angle of ' + v + '°. What is each base angle?', num(base), 'The base angles are equal: (180 − ' + v + ') ÷ 2 = ' + base + '°.', DEGREES);
        case 1: return Q('An isosceles triangle has base angles of ' + base + '°. What is the vertex angle?', num(v), '180 − 2 × ' + base + ' = ' + v + '°.', DEGREES);
        default: return Q('An equilateral triangle has a perimeter of ' + 3 * s + '. How long is each side?', num(s), 'All three sides are equal: ' + 3 * s + ' ÷ 3 = ' + s + '.');
      }
    } },
    { id: 'geo-classify', group: 'Triangles', name: 'Classifying triangles', par: 30, gen: function () {
      var bySide = ['scalene', 'isosceles', 'equilateral'], byAngle = ['acute', 'right', 'obtuse'];
      var a, b, c;
      switch (ri(0, 2)) {
        case 0:
          var kind = pick(bySide);
          if (kind === 'equilateral') { a = b = c = ri(3, 15); }
          else if (kind === 'isosceles') { a = b = ri(3, 12); do { c = ri(1, 2 * a - 1); } while (c === a); }
          else { a = ri(3, 10); b = a + ri(1, 5); c = b + ri(1, a - 1); }
          return Q('A triangle has sides ' + shuffle([a, b, c]).join(', ') + '. Is it scalene, isosceles, or equilateral?', word(kind, bySide),
            'Scalene: no equal sides. Isosceles: two equal sides. Equilateral: three equal sides.', 'scalene, isosceles, or equilateral');
        case 1:
          do { a = ri(25, 100); b = coin() ? 90 - a : ri(25, 100); c = 180 - a - b; } while (b < 10 || c < 10);
          var big = Math.max(a, b, c), res = big > 90 ? 'obtuse' : big === 90 ? 'right' : 'acute';
          return Q('A triangle has angles ' + shuffle([a, b, c]).map(function (n) { return n + '°'; }).join(', ') + '. Is it acute, right, or obtuse?', word(res, byAngle),
            'Look at the largest angle, ' + big + '°. Under 90° is acute, exactly 90° is right, and over 90° is obtuse.', 'acute, right, or obtuse');
        default:
          if (coin()) { var T = triple(); a = T[0]; b = T[1]; c = T[2]; }
          else { do { a = ri(3, 12); b = ri(a, 14); c = ri(b, a + b - 1); } while (a * a + b * b === c * c); }
          var s2 = a * a + b * b, c2 = c * c, out = c2 === s2 ? 'right' : c2 < s2 ? 'acute' : 'obtuse';
          return Q('A triangle has sides ' + a + ', ' + b + ', and ' + c + '. Is it acute, right, or obtuse?', word(out, byAngle),
            'Compare the longest side squared with the sum of the other two squared: ' + c2 + ' vs ' + a * a + ' + ' + b * b + ' = ' + s2 + '. Equal is right, smaller is acute, and larger is obtuse.', 'acute, right, or obtuse');
      }
    } },
    { id: 'geo-tri-ineq', group: 'Triangles', name: 'Triangle inequality', par: 30, gen: function () {
      var a = ri(3, 15), b = ri(3, 15), c;
      switch (ri(0, 2)) {
        case 0:
          return Q('Two sides of a triangle are ' + a + ' and ' + b + '. What is the largest whole-number length the third side can have?', num(a + b - 1),
            'The third side must be less than the sum of the other two: less than ' + (a + b) + ', so ' + (a + b - 1) + '.');
        case 1:
          return Q('Two sides of a triangle are ' + a + ' and ' + b + '. What is the smallest whole-number length the third side can have?', num(Math.abs(a - b) + 1),
            'The third side must be more than the difference of the other two: more than ' + Math.abs(a - b) + ', so ' + (Math.abs(a - b) + 1) + '.');
        default:
          c = ri(3, 30);
          var s = [a, b, c].sort(function (p, q) { return p - q; }), ok = s[0] + s[1] > s[2];
          return Q('Can ' + a + ', ' + b + ', and ' + c + ' be the sides of a triangle? (yes or no)', word(ok ? 'yes' : 'no', ['yes', 'no']),
            'The two shorter sides must add to more than the longest: ' + s[0] + ' + ' + s[1] + ' = ' + (s[0] + s[1]) + (ok ? ' > ' : ' ≤ ') + s[2] + '.', 'yes or no');
      }
    } },
    { id: 'geo-pythag', group: 'Triangles', name: 'Pythagorean theorem', par: 45, gen: reuse('pythagorean') },
    { id: 'geo-special', group: 'Triangles', name: 'Special right triangles', par: 45, gen: reuse('special-right') },
    { id: 'geo-congruence', group: 'Triangles', name: 'Triangle congruence (SSS, SAS, ASA, AAS, HL)', par: 35, gen: function () {
      var v = shuffle(['A', 'B', 'C']), pair = { A: 'D', B: 'E', C: 'F' };
      var a = v[0], b = v[1], c = v[2], A = pair[a], B = pair[b], C = pair[c];
      var rule = pick(['SSS', 'SAS', 'ASA', 'AAS', 'HL']);
      function side(p, q, P, R) { return p + q + ' = ' + P + R; }
      function ang(p, P) { return '∠' + p + ' = ∠' + P; }
      var facts = {
        SSS: [side(a, b, A, B), side(b, c, B, C), side(c, a, C, A)],
        SAS: [side(a, b, A, B), ang(b, B), side(b, c, B, C)],
        ASA: [ang(a, A), side(a, b, A, B), ang(b, B)],
        AAS: [ang(a, A), ang(b, B), side(b, c, B, C)],
        HL: ['∠' + c + ' and ∠' + C + ' are right angles', side(a, b, A, B), side(a, c, A, C)]
      }[rule];
      var why = {
        SSS: 'All three pairs of sides match.',
        SAS: 'Two pairs of sides match, and the angle between them matches too.',
        ASA: 'Two pairs of angles match, and the side between them matches too.',
        AAS: 'Two pairs of angles match, and a side that is not between them matches too.',
        HL: 'They are right triangles with matching hypotenuses and one matching leg.'
      }[rule];
      return Q('In triangles ABC and DEF:\n' + facts.join(',  ') + '\nWhich rule proves the triangles congruent?',
        word(rule.toLowerCase(), ['sss', 'sas', 'asa', 'aas', 'hl'], rule), why, 'SSS, SAS, ASA, AAS, or HL');
    } },
    { id: 'geo-similar', group: 'Triangles', name: 'Similar triangles', par: 45, gen: function () {
      var k = pick([1.5, 2, 2.5, 3]), a = 2 * ri(2, 8), b = 2 * ri(2, 9);
      switch (ri(0, 2)) {
        case 0:
          return Q('Triangle ABC is similar to triangle DEF. AB = ' + a + ', BC = ' + b + ', and DE = ' + fmt(a * k) + '. Find EF.', num(b * k),
            'The scale factor is ' + fmt(a * k) + ' ÷ ' + a + ' = ' + fmt(k) + ', so EF = ' + b + ' × ' + fmt(k) + ' = ' + fmt(b * k) + '.');
        case 1:
          return Q('Triangle ABC is similar to triangle DEF. DE = ' + fmt(a * k) + ', EF = ' + fmt(b * k) + ', and AB = ' + a + '. Find BC.', num(b),
            'The scale factor from DEF to ABC is ' + a + ' ÷ ' + fmt(a * k) + ', so BC = ' + fmt(b * k) + ' ÷ ' + fmt(k) + ' = ' + b + '.');
        default:
          var h = pick([5, 6]), s = ri(2, 6), m = ri(3, 8);
          return Q('A ' + h + ' ft person casts a ' + s + ' ft shadow. At the same time, a tree casts a ' + s * m + ' ft shadow. How tall is the tree?', num(h * m),
            'The triangles are similar: ' + h + '/' + s + ' = height/' + s * m + '. The shadow is ' + m + ' times longer, so the height is ' + h + ' × ' + m + ' = ' + h * m + ' ft.');
      }
    } },
    { id: 'geo-midsegment', group: 'Triangles', name: 'Triangle midsegments', par: 35, gen: function () {
      var d = ri(3, 20);
      switch (ri(0, 2)) {
        case 0: return Q('D and E are the midpoints of AB and AC in triangle ABC. BC = ' + 2 * d + '. Find DE.', num(d), 'A midsegment is half the third side: ' + 2 * d + ' ÷ 2 = ' + d + '.');
        case 1: return Q('D and E are the midpoints of AB and AC in triangle ABC. DE = ' + d + '. Find BC.', num(2 * d), 'The third side is twice the midsegment: 2 × ' + d + ' = ' + 2 * d + '.');
        default:
          var x = ri(3, 12), a = ri(1, 3), b = ri(1, 9), c = 2 * a + 1, top = 2 * (a * x + b);
          return Q('D and E are the midpoints of AB and AC in triangle ABC. DE = ' + poly([a, b]) + ' and BC = ' + poly([c, top - c * x]) + '. Find x.', lab('x =', num(x)),
            'BC = 2 × DE, so ' + poly([c, top - c * x]) + ' = ' + poly([2 * a, 2 * b]) + ', which gives x = ' + x + '.');
      }
    } },

    // ----- Polygons & quadrilaterals -----
    { id: 'geo-poly-sum', group: 'Polygons & quadrilaterals', name: 'Polygon angle sums', par: 35, gen: function () {
      var n = ri(5, 12);
      switch (ri(0, 2)) {
        case 0: return Q('What is the sum of the interior angles of a ' + n + '-sided polygon?', num((n - 2) * 180), 'Sum = (n − 2) × 180 = ' + (n - 2) + ' × 180 = ' + (n - 2) * 180 + '°.', DEGREES);
        case 1: return Q('The interior angles of a polygon add to ' + (n - 2) * 180 + '°. How many sides does it have?', num(n), '(n − 2) × 180 = ' + (n - 2) * 180 + ', so n − 2 = ' + (n - 2) + ' and n = ' + n + '.');
        default:
          var total = pick([360, 540]), count = total === 360 ? 4 : 5, known = [], left = total, mean = total / count;
          for (var i = 0; i < count - 1; i++) { var a = ri(mean - 15, mean + 15); known.push(a); left -= a; }
          return Q('A ' + count + '-sided polygon has angles of ' + known.map(function (v) { return v + '°'; }).join(', ') + ', and one more. What is the missing angle?', num(left),
            'The angles add to ' + total + '°. ' + total + ' − ' + known.join(' − ') + ' = ' + left + '°.', DEGREES);
      }
    } },
    { id: 'geo-regular-angles', group: 'Polygons & quadrilaterals', name: 'Regular polygon angles', par: 35, gen: function () {
      var n = pick([3, 4, 5, 6, 8, 9, 10, 12]), ext = 360 / n;
      switch (ri(0, 2)) {
        case 0: return Q('What is each interior angle of a regular ' + n + '-sided polygon?', num(180 - ext), '(' + n + ' − 2) × 180 ÷ ' + n + ' = ' + (180 - ext) + '°.', DEGREES);
        case 1: return Q('What is each exterior angle of a regular ' + n + '-sided polygon?', num(ext), 'Exterior angles add to 360°: 360 ÷ ' + n + ' = ' + ext + '°.', DEGREES);
        default: return Q('Each exterior angle of a regular polygon is ' + ext + '°. How many sides does it have?', num(n), '360 ÷ ' + ext + ' = ' + n + ' sides.');
      }
    } },
    { id: 'geo-parallelogram', group: 'Polygons & quadrilaterals', name: 'Parallelogram properties', par: 40, gen: function () {
      var a = ri(40, 140), x = ri(3, 15), e;
      switch (ri(0, 2)) {
        case 0:
          return Q('In parallelogram ABCD, ∠A = ' + a + '°. Find ∠' + (coin() ? 'B' : 'D') + '.', num(180 - a), 'Consecutive angles of a parallelogram add to 180°: 180 − ' + a + ' = ' + (180 - a) + '°.', DEGREES);
        case 1:
          e = exprPair(x, a, a);
          return Q('In parallelogram ABCD, ∠A = (' + e[0] + ')° and ∠C = (' + e[1] + ')°. Find x.', lab('x =', num(x)), 'Opposite angles are equal: ' + e[0] + ' = ' + e[1] + ', so x = ' + x + '.');
        default:
          var len = ri(8, 40);
          e = exprPair(x, len, len);
          return Q('The diagonals of parallelogram ABCD meet at E. AE = ' + e[0] + ' and CE = ' + e[1] + '. Find x.', lab('x =', num(x)), 'The diagonals bisect each other, so AE = CE. That gives x = ' + x + '.');
      }
    } },
    { id: 'geo-special-quads', group: 'Polygons & quadrilaterals', name: 'Rectangles, rhombi & trapezoids', par: 45, gen: function () {
      var T = triple();
      switch (ri(0, 3)) {
        case 0: return Q('A rectangle is ' + T[0] + ' by ' + T[1] + '. How long is each diagonal?', num(T[2]), 'A diagonal is the hypotenuse of a right triangle: √(' + T[0] * T[0] + ' + ' + T[1] * T[1] + ') = ' + T[2] + '.');
        case 1: return Q('A rhombus has diagonals of ' + 2 * T[0] + ' and ' + 2 * T[1] + '. How long is each side?', num(T[2]), 'The diagonals bisect each other at right angles, leaving legs of ' + T[0] + ' and ' + T[1] + '. The side is √(' + T[0] * T[0] + ' + ' + T[1] * T[1] + ') = ' + T[2] + '.');
        case 2:
          var a = ri(50, 85);
          return Q('In an isosceles trapezoid, one angle on the longer base is ' + a + '°. What is each angle on the shorter base?', num(180 - a),
            'Angles along each leg add to 180°: 180 − ' + a + ' = ' + (180 - a) + '°.', DEGREES);
        default:
          var b1 = ri(4, 20), b2 = b1 + 2 * ri(1, 8);
          return Q('A trapezoid has bases of ' + b1 + ' and ' + b2 + '. How long is its midsegment?', num((b1 + b2) / 2), 'The midsegment is the average of the bases: (' + b1 + ' + ' + b2 + ') ÷ 2 = ' + (b1 + b2) / 2 + '.');
      }
    } },

    // ----- Perimeter & area -----
    { id: 'geo-perimeter', group: 'Perimeter & area', name: 'Perimeter', par: 25, gen: function () {
      var l = ri(3, 25), w = ri(3, 25), n = pick([5, 6, 8, 10]), s = ri(2, 15);
      switch (ri(0, 2)) {
        case 0: return Q('Find the perimeter of a rectangle that is ' + l + ' by ' + w + '.', num(2 * (l + w)), 'P = 2(l + w) = 2(' + l + ' + ' + w + ') = ' + 2 * (l + w) + '.');
        case 1: return Q('A rectangle has a perimeter of ' + 2 * (l + w) + ' and a width of ' + w + '. Find its length.', num(l), l + w + ' is half the perimeter, so the length is ' + (l + w) + ' − ' + w + ' = ' + l + '.');
        default: return Q('Find the perimeter of a regular ' + n + '-sided polygon with sides of ' + s + '.', num(n * s), 'P = number of sides × side = ' + n + ' × ' + s + ' = ' + n * s + '.');
      }
    } },
    { id: 'geo-area-rect', group: 'Perimeter & area', name: 'Area of rectangles & squares', par: 20, gen: function () {
      var l = ri(3, 25), w = ri(3, 25), s = ri(3, 20);
      switch (ri(0, 3)) {
        case 0: return Q('Find the area of a rectangle that is ' + l + ' by ' + w + '.', num(l * w), 'A = lw = ' + l + ' × ' + w + ' = ' + l * w + '.');
        case 1: return Q('Find the area of a square with sides of ' + s + '.', num(s * s), 'A = s² = ' + s + '² = ' + s * s + '.');
        case 2: return Q('A rectangle has an area of ' + l * w + ' and a width of ' + w + '. Find its length.', num(l), 'l = A ÷ w = ' + l * w + ' ÷ ' + w + ' = ' + l + '.');
        default: return Q('A square has an area of ' + s * s + '. How long is each side?', num(s), 's = √' + s * s + ' = ' + s + '.');
      }
    } },
    { id: 'geo-area-tri', group: 'Perimeter & area', name: 'Area of triangles', par: 25, gen: function () {
      var b = ri(3, 24), h = ri(2, 20), A = b * h / 2;
      switch (ri(0, 2)) {
        case 0: return Q('Find the area of a triangle with base ' + b + ' and height ' + h + '.', num(A), 'A = ½bh = ½ × ' + b + ' × ' + h + ' = ' + fmt(A) + '.');
        case 1: return Q('A right triangle has legs of ' + b + ' and ' + h + '. Find its area.', num(A), 'The legs are the base and height: ½ × ' + b + ' × ' + h + ' = ' + fmt(A) + '.');
        default: return Q('A triangle has an area of ' + fmt(A) + ' and a base of ' + b + '. Find its height.', num(h), 'h = 2A ÷ b = ' + fmt(2 * A) + ' ÷ ' + b + ' = ' + h + '.');
      }
    } },
    { id: 'geo-area-para', group: 'Perimeter & area', name: 'Area of parallelograms', par: 20, gen: function () {
      var b = ri(3, 25), h = ri(2, 20);
      if (coin()) return Q('Find the area of a parallelogram with base ' + b + ' and height ' + h + '.', num(b * h), 'A = bh = ' + b + ' × ' + h + ' = ' + b * h + '.');
      return Q('A parallelogram has an area of ' + b * h + ' and a base of ' + b + '. Find its height.', num(h), 'h = A ÷ b = ' + b * h + ' ÷ ' + b + ' = ' + h + '.');
    } },
    { id: 'geo-area-trap', group: 'Perimeter & area', name: 'Area of trapezoids', par: 35, gen: function () {
      var a = ri(3, 20), b = ri(3, 20), h = ri(2, 15), A = (a + b) * h / 2;
      if (coin()) return Q('Find the area of a trapezoid with bases ' + a + ' and ' + b + ' and height ' + h + '.', num(A), 'A = ½(b₁ + b₂)h = ½(' + (a + b) + ')(' + h + ') = ' + fmt(A) + '.');
      return Q('A trapezoid has an area of ' + fmt(A) + ' and bases of ' + a + ' and ' + b + '. Find its height.', num(h), 'h = 2A ÷ (b₁ + b₂) = ' + fmt(2 * A) + ' ÷ ' + (a + b) + ' = ' + h + '.');
    } },
    { id: 'geo-area-rhombus', group: 'Perimeter & area', name: 'Area of rhombi & kites', par: 30, gen: function () {
      var p = ri(4, 24), q = ri(4, 24), A = p * q / 2, shape = pick(['rhombus', 'kite']);
      if (coin()) return Q('A ' + shape + ' has diagonals of ' + p + ' and ' + q + '. Find its area.', num(A), 'A = ½d₁d₂ = ½ × ' + p + ' × ' + q + ' = ' + fmt(A) + '.');
      return Q('A ' + shape + ' has an area of ' + fmt(A) + ' and one diagonal of ' + p + '. How long is the other diagonal?', num(q), 'd₂ = 2A ÷ d₁ = ' + fmt(2 * A) + ' ÷ ' + p + ' = ' + q + '.');
    } },
    { id: 'geo-area-regular', group: 'Perimeter & area', name: 'Area of regular polygons', par: 60, gen: function () {
      var s = ri(4, 16), n = pick([5, 6, 8, 10]);
      if (coin()) {
        var v = 3 * Math.sqrt(3) / 2 * s * s;
        return Q('Find the area of a regular hexagon with sides of ' + s + '.', tenth(v), 'A hexagon is six equilateral triangles: A = 6 × (√3/4)s² = (3√3/2) × ' + s * s + ' ≈ ' + fmt(round(v, 1)) + '.', TENTH);
      }
      var ap = round(s / (2 * Math.tan(Math.PI / n)), 1), A = ap * n * s / 2;
      return Q('A regular ' + n + '-sided polygon has sides of ' + s + ' and an apothem of ' + fmt(ap) + '. Find its area.', tenth(A),
        'A = ½ × apothem × perimeter = ½ × ' + fmt(ap) + ' × ' + n * s + ' = ' + fmt(round(A, 1)) + '.', TENTH);
    } },
    { id: 'geo-area-composite', group: 'Perimeter & area', name: 'Composite & shaded areas', par: 75, gen: function () {
      var W = ri(8, 20), H = ri(8, 20), w = ri(2, W - 3), h = ri(2, H - 3), r = ri(2, 8), R = r + ri(1, 8), v;
      switch (ri(0, 3)) {
        case 0:
          return Q('An L-shape is a ' + W + ' by ' + H + ' rectangle with a ' + w + ' by ' + h + ' rectangle cut from one corner. Find its area.', num(W * H - w * h),
            'Big rectangle minus the cut: ' + W * H + ' − ' + w * h + ' = ' + (W * H - w * h) + '.');
        case 1:
          v = 2 * r * H + Math.PI * r * r / 2;
          return Q('A semicircle with a diameter of ' + 2 * r + ' sits on the matching side of a ' + 2 * r + ' by ' + H + ' rectangle. Find the total area.', tenth(v),
            'Rectangle: ' + 2 * r * H + '. Semicircle: ½πr² = ½π × ' + r * r + ' ≈ ' + fmt(round(Math.PI * r * r / 2, 1)) + '. Total ≈ ' + fmt(round(v, 1)) + '.', TENTH);
        case 2:
          return Q('A ring is the space between circles of radius ' + R + ' and ' + r + ' with the same center. Find its area.', piAns(R * R - r * r),
            'Big circle minus small circle: π(' + R * R + ' − ' + r * r + ') = ' + (R * R - r * r) + 'π.', PI_HINT);
        default:
          var side = 2 * r + ri(1, 6);
          v = side * side - Math.PI * r * r;
          return Q('A circle of radius ' + r + ' is cut out of a square with sides of ' + side + '. Find the area left over.', tenth(v),
            'Square minus circle: ' + side * side + ' − ' + r * r + 'π ≈ ' + fmt(round(v, 1)) + '.', TENTH);
      }
    } },

    // ----- Circles -----
    { id: 'geo-circumference', group: 'Circles', name: 'Circumference', par: 30, gen: function () {
      var r = ri(2, 20);
      switch (ri(0, 2)) {
        case 0: return Q('A circle has a radius of ' + r + '. Find its circumference.', piAns(2 * r), 'C = 2πr = 2π × ' + r + ' = ' + 2 * r + 'π.', PI_HINT);
        case 1: return Q('A circle has a diameter of ' + 2 * r + '. Find its circumference.', piAns(2 * r), 'C = πd = ' + 2 * r + 'π.', PI_HINT);
        default: return Q('A circle has a circumference of ' + 2 * r + 'π. Find its radius.', num(r), 'C = 2πr, so r = ' + 2 * r + 'π ÷ 2π = ' + r + '.');
      }
    } },
    { id: 'geo-circle-area', group: 'Circles', name: 'Area of circles', par: 30, gen: function () {
      var r = ri(2, 15);
      switch (ri(0, 2)) {
        case 0: return Q('A circle has a radius of ' + r + '. Find its area.', piAns(r * r), 'A = πr² = π × ' + r + '² = ' + r * r + 'π.', PI_HINT);
        case 1: return Q('A circle has a diameter of ' + 2 * r + '. Find its area.', piAns(r * r), 'The radius is ' + r + ', so A = π × ' + r + '² = ' + r * r + 'π.', PI_HINT);
        default: return Q('A circle has an area of ' + r * r + 'π. Find its radius.', num(r), 'πr² = ' + r * r + 'π, so r = √' + r * r + ' = ' + r + '.');
      }
    } },
    { id: 'geo-arc', group: 'Circles', name: 'Arc length', par: 45, gen: function () {
      var a = pick([30, 45, 60, 72, 90, 120, 135, 150, 180, 240, 270, 300]), r = ri(3, 18), k = a * 2 * r / 360;
      if (coin() || (k * 100) % 1 > 1e-9) { // the reverse question needs a tidy k
        return Q('Find the length of a ' + a + '° arc on a circle with radius ' + r + '.', piAns(k), 'Arc = (angle/360) × 2πr = (' + a + '/360) × ' + 2 * r + 'π ≈ ' + fmt(round(k * Math.PI, 1)) + '.', TENTH);
      }
      return Q('An arc on a circle with radius ' + r + ' has a length of ' + fmt(k) + 'π. What is its central angle?', num(a),
        'Angle = arc ÷ circumference × 360 = ' + fmt(k) + 'π ÷ ' + 2 * r + 'π × 360 = ' + a + '°.', DEGREES);
    } },
    { id: 'geo-sector', group: 'Circles', name: 'Sector area', par: 45, gen: function () {
      var a = pick([30, 45, 60, 72, 90, 120, 135, 150, 180, 240, 270, 300]), r = ri(3, 15), k = a * r * r / 360;
      return Q('Find the area of a ' + a + '° sector of a circle with radius ' + r + '.', piAns(k),
        'Sector = (angle/360) × πr² = (' + a + '/360) × ' + r * r + 'π ≈ ' + fmt(round(k * Math.PI, 1)) + '.', TENTH);
    } },
    { id: 'geo-circle-angles', group: 'Circles', name: 'Central & inscribed angles', par: 30, gen: function () {
      var a = ri(20, 85);
      switch (ri(0, 3)) {
        case 0: return Q('A central angle measures ' + 2 * a + '°. What does an inscribed angle on the same arc measure?', num(a), 'An inscribed angle is half the central angle: ' + 2 * a + ' ÷ 2 = ' + a + '°.', DEGREES);
        case 1: return Q('An inscribed angle measures ' + a + '°. What is the measure of its arc?', num(2 * a), 'The arc is twice the inscribed angle: 2 × ' + a + ' = ' + 2 * a + '°.', DEGREES);
        case 2: return Q('Triangle ABC is inscribed in a circle with AB as a diameter. ∠A = ' + a + '°. Find ∠B.', num(90 - a), 'An angle inscribed in a semicircle is 90°, so ∠C = 90° and ∠B = 90 − ' + a + ' = ' + (90 - a) + '°.', DEGREES);
        default: return Q('Quadrilateral ABCD is inscribed in a circle. ∠A = ' + (a + 40) + '°. Find ∠C.', num(140 - a), 'Opposite angles of an inscribed quadrilateral add to 180°: 180 − ' + (a + 40) + ' = ' + (140 - a) + '°.', DEGREES);
      }
    } },
    { id: 'geo-chords', group: 'Circles', name: 'Chords & tangents', par: 50, gen: function () {
      var T = triple();
      switch (ri(0, 3)) {
        case 0:
          return Q('A circle has a radius of ' + T[0] + '. A tangent from point P touches it at T, and PT = ' + T[1] + '. How far is P from the center?', num(T[2]),
            'A tangent is perpendicular to the radius, so √(' + T[0] * T[0] + ' + ' + T[1] * T[1] + ') = ' + T[2] + '.');
        case 1:
          var pairs = pick([[[2, 12], [3, 8], [4, 6]], [[2, 18], [3, 12], [4, 9]], [[3, 16], [4, 12], [6, 8]], [[2, 30], [4, 15], [5, 12], [6, 10]]]);
          var s = shuffle(pairs), p = s[0], q = s[1];
          return Q('Two chords cross inside a circle. One is split into parts of ' + p[0] + ' and ' + p[1] + '. The other is split into parts of ' + q[0] + ' and x. Find x.', lab('x =', num(q[1])),
            'The products of the parts are equal: ' + p[0] + ' × ' + p[1] + ' = ' + q[0] + 'x, so x = ' + p[0] * p[1] + ' ÷ ' + q[0] + ' = ' + q[1] + '.');
        case 2:
          var x = ri(3, 12), len = ri(10, 40), e = exprPair(x, len, len);
          return Q('From point P, two tangents touch a circle at A and B. PA = ' + e[0] + ' and PB = ' + e[1] + '. Find x.', lab('x =', num(x)),
            'Tangents from the same point are equal: ' + e[0] + ' = ' + e[1] + ', so x = ' + x + '.');
        default:
          return Q('A chord of length ' + 2 * T[1] + ' is ' + T[0] + ' away from the center of a circle. Find the radius.', num(T[2]),
            'A line from the center cuts the chord in half, giving legs of ' + T[1] + ' and ' + T[0] + '. r = √(' + T[1] * T[1] + ' + ' + T[0] * T[0] + ') = ' + T[2] + '.');
      }
    } },

    // ----- Surface area -----
    { id: 'geo-sa-prism', group: 'Surface area', name: 'Surface area of prisms', par: 50, gen: function () {
      var l = ri(2, 12), w = ri(2, 12), h = ri(2, 15), T = pick(TRIPLES.slice(0, 2));
      switch (ri(0, 2)) {
        case 0:
          return Q('Find the surface area of a box that is ' + l + ' × ' + w + ' × ' + h + '.', num(2 * (l * w + l * h + w * h)),
            'SA = 2(lw + lh + wh) = 2(' + l * w + ' + ' + l * h + ' + ' + w * h + ') = ' + 2 * (l * w + l * h + w * h) + '.');
        case 1:
          return Q('Find the surface area of a cube with edges of ' + l + '.', num(6 * l * l), 'Six square faces: 6 × ' + l + '² = ' + 6 * l * l + '.');
        default:
          var v = T[0] * T[1] + (T[0] + T[1] + T[2]) * h;
          return Q('A triangular prism has right-triangle bases with sides ' + T.join(', ') + ' and a length of ' + h + '. Find its surface area.', num(v),
            'Two triangles: 2 × ½ × ' + T[0] + ' × ' + T[1] + ' = ' + T[0] * T[1] + '. Three rectangles: (' + T.join(' + ') + ') × ' + h + ' = ' + (T[0] + T[1] + T[2]) * h + '. Total: ' + v + '.');
      }
    } },
    { id: 'geo-sa-cylinder', group: 'Surface area', name: 'Surface area of cylinders', par: 50, gen: function () {
      var r = ri(2, 10), h = ri(2, 15);
      if (coin()) {
        return Q('Find the total surface area of a cylinder with radius ' + r + ' and height ' + h + '.', piAns(2 * r * r + 2 * r * h),
          'SA = 2πr² + 2πrh = ' + 2 * r * r + 'π + ' + 2 * r * h + 'π = ' + (2 * r * r + 2 * r * h) + 'π.', PI_HINT);
      }
      return Q('Find the lateral surface area (the curved side only) of a cylinder with radius ' + r + ' and height ' + h + '.', piAns(2 * r * h),
        'LA = 2πrh = 2π × ' + r + ' × ' + h + ' = ' + 2 * r * h + 'π.', PI_HINT);
    } },
    { id: 'geo-sa-cone', group: 'Surface area', name: 'Surface area of cones', par: 55, gen: function () {
      var T = pick(TRIPLES.slice(0, 2)), r = T[0], h = T[1], l = T[2];
      if (coin()) { var s = ri(2, 12), sl = s + ri(1, 10); return Q('Find the total surface area of a cone with radius ' + s + ' and slant height ' + sl + '.', piAns(s * s + s * sl), 'SA = πr² + πrl = ' + s * s + 'π + ' + s * sl + 'π = ' + (s * s + s * sl) + 'π.', PI_HINT); }
      return Q('Find the total surface area of a cone with radius ' + r + ' and height ' + h + '.', piAns(r * r + r * l),
        'First the slant height: l = √(' + r * r + ' + ' + h * h + ') = ' + l + '. SA = πr² + πrl = ' + r * r + 'π + ' + r * l + 'π = ' + (r * r + r * l) + 'π.', PI_HINT);
    } },
    { id: 'geo-sa-sphere', group: 'Surface area', name: 'Surface area of spheres', par: 35, gen: function () {
      var r = ri(2, 12);
      switch (ri(0, 2)) {
        case 0: return Q('Find the surface area of a sphere with radius ' + r + '.', piAns(4 * r * r), 'SA = 4πr² = 4π × ' + r * r + ' = ' + 4 * r * r + 'π.', PI_HINT);
        case 1: return Q('Find the surface area of a sphere with diameter ' + 2 * r + '.', piAns(4 * r * r), 'The radius is ' + r + ', so SA = 4π × ' + r * r + ' = ' + 4 * r * r + 'π.', PI_HINT);
        default: return Q('Find the total surface area of a solid hemisphere with radius ' + r + ', including the flat circle.', piAns(3 * r * r), 'Half a sphere (2πr²) plus the circle (πr²) = 3πr² = ' + 3 * r * r + 'π.', PI_HINT);
      }
    } },
    { id: 'geo-sa-pyramid', group: 'Surface area', name: 'Surface area of pyramids', par: 55, gen: function () {
      if (coin()) {
        var s = ri(2, 14), l = ri(3, 16);
        return Q('A square pyramid has a base edge of ' + s + ' and a slant height of ' + l + '. Find its surface area.', num(s * s + 2 * s * l),
          'Base: ' + s * s + '. Four triangles: 4 × ½ × ' + s + ' × ' + l + ' = ' + 2 * s * l + '. Total: ' + (s * s + 2 * s * l) + '.');
      }
      var T = pick(TRIPLES.slice(0, 2)), e = 2 * T[0];
      return Q('A square pyramid has a base edge of ' + e + ' and a height of ' + T[1] + '. Find its surface area.', num(e * e + 2 * e * T[2]),
        'Slant height: √(' + T[0] * T[0] + ' + ' + T[1] * T[1] + ') = ' + T[2] + '. Base: ' + e * e + '. Four triangles: ' + 2 * e * T[2] + '. Total: ' + (e * e + 2 * e * T[2]) + '.');
    } },

    // ----- Volume -----
    { id: 'geo-vol-prism', group: 'Volume', name: 'Volume of prisms', par: 30, gen: function () {
      var l = ri(2, 12), w = ri(2, 12), h = ri(2, 15), v;
      switch (ri(0, 3)) {
        case 0: return Q('Find the volume of a box that is ' + l + ' × ' + w + ' × ' + h + '.', num(l * w * h), 'V = lwh = ' + l + ' × ' + w + ' × ' + h + ' = ' + l * w * h + '.');
        case 1: return Q('Find the volume of a cube with edges of ' + l + '.', num(l * l * l), 'V = s³ = ' + l + '³ = ' + l * l * l + '.');
        case 2: return Q('A box has a volume of ' + l * w * h + ', a length of ' + l + ', and a width of ' + w + '. Find its height.', num(h), 'h = V ÷ (lw) = ' + l * w * h + ' ÷ ' + l * w + ' = ' + h + '.');
        default:
          v = l * w * h / 2;
          return Q('A triangular prism has right-triangle bases with legs ' + l + ' and ' + w + ', and a length of ' + h + '. Find its volume.', num(v),
            'V = base area × length = (½ × ' + l + ' × ' + w + ') × ' + h + ' = ' + fmt(v) + '.');
      }
    } },
    { id: 'geo-vol-cylinder', group: 'Volume', name: 'Volume of cylinders', par: 35, gen: function () {
      var r = ri(2, 10), h = ri(2, 15);
      switch (ri(0, 2)) {
        case 0: return Q('Find the volume of a cylinder with radius ' + r + ' and height ' + h + '.', piAns(r * r * h), 'V = πr²h = π × ' + r * r + ' × ' + h + ' = ' + r * r * h + 'π.', PI_HINT);
        case 1: return Q('Find the volume of a cylinder with diameter ' + 2 * r + ' and height ' + h + '.', piAns(r * r * h), 'The radius is ' + r + ', so V = π × ' + r * r + ' × ' + h + ' = ' + r * r * h + 'π.', PI_HINT);
        default: return Q('A cylinder has a volume of ' + r * r * h + 'π and a radius of ' + r + '. Find its height.', num(h), 'h = V ÷ πr² = ' + r * r * h + 'π ÷ ' + r * r + 'π = ' + h + '.');
      }
    } },
    { id: 'geo-vol-cone', group: 'Volume', name: 'Volume of cones', par: 40, gen: function () {
      var r = ri(2, 10), h = ri(2, 18);
      if (coin()) { h = 3 * ri(1, 6); return Q('A cone has a radius of ' + r + ' and a height of ' + h + '. Find its volume.', piAns(r * r * h / 3), 'V = ⅓πr²h = ⅓ × ' + r * r + ' × ' + h + ' × π = ' + r * r * h / 3 + 'π.', PI_HINT); }
      return Q('Find the volume of a cone with diameter ' + 2 * r + ' and height ' + h + '.', piAns(r * r * h / 3), 'The radius is ' + r + '. V = ⅓πr²h = ⅓ × ' + r * r + ' × ' + h + ' × π ≈ ' + fmt(round(Math.PI * r * r * h / 3, 1)) + '.', TENTH);
    } },
    { id: 'geo-vol-sphere', group: 'Volume', name: 'Volume of spheres', par: 40, gen: function () {
      var r = ri(2, 12);
      if (coin()) return Q('Find the volume of a sphere with radius ' + r + '.', piAns(4 / 3 * r * r * r), 'V = (4/3)πr³ = (4/3) × ' + r * r * r + ' × π ≈ ' + fmt(round(4 / 3 * Math.PI * r * r * r, 1)) + '.', TENTH);
      return Q('Find the volume of a hemisphere with radius ' + r + '.', piAns(2 / 3 * r * r * r), 'Half of a sphere: (2/3)πr³ = (2/3) × ' + r * r * r + ' × π ≈ ' + fmt(round(2 / 3 * Math.PI * r * r * r, 1)) + '.', TENTH);
    } },
    { id: 'geo-vol-pyramid', group: 'Volume', name: 'Volume of pyramids', par: 35, gen: function () {
      var s = ri(2, 15), h = 3 * ri(1, 8), w = ri(2, 12);
      if (coin()) return Q('A square pyramid has a base edge of ' + s + ' and a height of ' + h + '. Find its volume.', num(s * s * h / 3), 'V = ⅓ × base area × height = ⅓ × ' + s * s + ' × ' + h + ' = ' + s * s * h / 3 + '.');
      return Q('A pyramid has a ' + s + ' by ' + w + ' rectangular base and a height of ' + h + '. Find its volume.', num(s * w * h / 3), 'V = ⅓ × ' + s * w + ' × ' + h + ' = ' + s * w * h / 3 + '.');
    } },
    { id: 'geo-scale', group: 'Volume', name: 'Similar solids & scale factors', par: 40, gen: function () {
      var k = ri(2, 5), base = ri(2, 12), h = ri(2, 12);
      switch (ri(0, 2)) {
        case 0: return Q('Two similar solids have a scale factor of 1 : ' + k + '. The smaller one has a surface area of ' + base + '. Find the surface area of the larger one.', num(base * k * k), 'Areas scale by the factor squared: ' + base + ' × ' + k + '² = ' + base * k * k + '.');
        case 1: return Q('Two similar solids have a scale factor of 1 : ' + k + '. The smaller one has a volume of ' + base + '. Find the volume of the larger one.', num(base * k * k * k), 'Volumes scale by the factor cubed: ' + base + ' × ' + k + '³ = ' + base * k * k * k + '.');
        default: return Q('Two similar solids have volumes of ' + base + ' and ' + base * k * k * k + '. The smaller one has a height of ' + h + '. Find the height of the larger one.', num(h * k), 'The volume ratio is ' + k * k * k + ', so the length ratio is ∛' + k * k * k + ' = ' + k + '. ' + h + ' × ' + k + ' = ' + h * k + '.');
      }
    } },

    // ----- Coordinate geometry -----
    { id: 'geo-distance', group: 'Coordinate geometry', name: 'Distance formula', par: 45, gen: reuse('distance') },
    { id: 'geo-midpoint', group: 'Coordinate geometry', name: 'Midpoint formula', par: 35, gen: reuse('midpoint') },
    { id: 'geo-slope-lines', group: 'Coordinate geometry', name: 'Parallel & perpendicular slopes', par: 30, gen: function () {
      var d = pick([1, 1, 2, 3, 4, 5]), n, b = ri(-9, 9);
      do { n = rnz(-6, 6); } while (gcd(n, d) !== 1);
      var m = d === 1 ? (n === 1 ? '' : n === -1 ? '−' : fmt(n)) : frac(n, d);
      var line = 'y = ' + m + 'x' + (b ? (b < 0 ? ' − ' : ' + ') + Math.abs(b) : '');
      if (coin()) return Q('What is the slope of a line parallel to ' + line + '?', fracAns(n, d), 'Parallel lines have the same slope: ' + frac(n, d) + '.', 'Like 2 or -3/4');
      return Q('What is the slope of a line perpendicular to ' + line + '?', fracAns(-d, n), 'Perpendicular slopes are negative reciprocals: flip ' + frac(n, d) + ' and change the sign to get ' + frac(-d, n) + '.', 'Like 2 or -3/4');
    } },
    { id: 'geo-circle-eq', group: 'Coordinate geometry', name: 'Equation of a circle', par: 40, gen: function () {
      var h = ri(-9, 9), k = ri(-9, 9), r = ri(2, 12);
      function sq(v, c) { return v === 0 ? c + '²' : '(' + c + (v < 0 ? ' + ' : ' − ') + Math.abs(v) + ')²'; }
      var eq = sq(h, 'x') + ' + ' + sq(k, 'y') + ' = ' + r * r;
      if (coin()) {
        return Q('Find the center and radius of the circle ' + eq + '.', [lab('Center x =', num(h)), lab('Center y =', num(k)), lab('Radius =', num(r))],
          'In (x − h)² + (y − k)² = r², the center is (h, k), so it is ' + point(h, k) + '. The radius is √' + r * r + ' = ' + r + '.');
      }
      var T = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]), R = Math.sqrt(T[0] * T[0] + T[1] * T[1]);
      return Q('A circle has its center at ' + point(h, k) + ' and passes through ' + point(h + T[0], k + T[1]) + '. Find its radius.', num(R),
        'The radius is the distance between them: √(' + T[0] * T[0] + ' + ' + T[1] * T[1] + ') = ' + R + '.');
    } },
    { id: 'geo-coord-area', group: 'Coordinate geometry', name: 'Area on the coordinate plane', par: 50, gen: function () {
      var x = ri(-8, 4), y = ri(-8, 4), w = ri(2, 10), h = ri(2, 10);
      if (coin()) {
        return Q('Find the area of the rectangle with vertices ' + [point(x, y), point(x + w, y), point(x + w, y + h), point(x, y + h)].join(', ') + '.', num(w * h),
          'The width is ' + w + ' and the height is ' + h + ', so A = ' + w * h + '.');
      }
      return Q('Find the area of the triangle with vertices ' + [point(x, y), point(x + w, y), point(x, y + h)].join(', ') + '.', num(w * h / 2),
        'It is a right triangle with a base of ' + w + ' and a height of ' + h + ': ½ × ' + w + ' × ' + h + ' = ' + fmt(w * h / 2) + '.');
    } },

    // ----- Transformations -----
    { id: 'geo-translate', group: 'Transformations', name: 'Translations', par: 25, gen: function () {
      var x = ri(-9, 9), y = ri(-9, 9), a = rnz(-8, 8), b = rnz(-8, 8);
      function units(n, neg, pos) { return Math.abs(n) + (Math.abs(n) === 1 ? ' unit ' : ' units ') + (n < 0 ? neg : pos); }
      var move = units(a, 'left', 'right') + ' and ' + units(b, 'down', 'up');
      return Q('Point ' + point(x, y) + ' moves ' + move + '. Where does it end up?', xy(x + a, y + b),
        'Add ' + fmt(a) + ' to x and ' + fmt(b) + ' to y: ' + point(x + a, y + b) + '.');
    } },
    { id: 'geo-reflect', group: 'Transformations', name: 'Reflections', par: 25, gen: function () {
      var x = rnz(-9, 9), y = rnz(-9, 9);
      var t = pick([
        ['the x-axis', x, -y, 'Reflecting over the x-axis flips the sign of y'],
        ['the y-axis', -x, y, 'Reflecting over the y-axis flips the sign of x'],
        ['the line y = x', y, x, 'Reflecting over y = x swaps the coordinates'],
        ['the line y = −x', -y, -x, 'Reflecting over y = −x swaps the coordinates and flips both signs']
      ]);
      return Q('Reflect ' + point(x, y) + ' over ' + t[0] + '.', xy(t[1], t[2]), t[3] + ': ' + point(t[1], t[2]) + '.');
    } },
    { id: 'geo-rotate', group: 'Transformations', name: 'Rotations', par: 30, gen: function () {
      var x = rnz(-9, 9), y = rnz(-9, 9);
      var t = pick([
        ['90° counterclockwise', -y, x, '(x, y) → (−y, x)'],
        ['90° clockwise', y, -x, '(x, y) → (y, −x)'],
        ['180°', -x, -y, '(x, y) → (−x, −y)'],
        ['270° counterclockwise', y, -x, '(x, y) → (y, −x)']
      ]);
      return Q('Rotate ' + point(x, y) + ' ' + t[0] + ' around the origin.', xy(t[1], t[2]), t[3] + ', so the point lands at ' + point(t[1], t[2]) + '.');
    } },
    { id: 'geo-dilate', group: 'Transformations', name: 'Dilations', par: 25, gen: function () {
      var k = pick([2, 3, 4, 0.5]), x = 2 * rnz(-6, 6), y = 2 * rnz(-6, 6), s = ri(2, 9), w = ri(2, 9), f = pick([2, 3, 4]);
      if (coin()) {
        var name = k === 0.5 ? '1/2' : k;
        return Q('Dilate ' + point(x, y) + ' by a scale factor of ' + name + ' from the origin.', xy(k * x, k * y), 'Multiply both coordinates by ' + name + ': ' + point(k * x, k * y) + '.');
      }
      return Q('A ' + s + ' by ' + w + ' rectangle is dilated by a scale factor of ' + f + '. What is the area of the new rectangle?', num(s * w * f * f),
        'Each side is multiplied by ' + f + ', so the area is multiplied by ' + f * f + ': ' + s * w + ' × ' + f * f + ' = ' + s * w * f * f + '.');
    } },

    // ----- Trigonometry -----
    { id: 'geo-trig-side', group: 'Trigonometry', name: 'Finding a side with trig', par: 60, gen: reuse('trig-side') },
    { id: 'geo-trig-angle', group: 'Trigonometry', name: 'Finding an angle with trig', par: 60, gen: reuse('trig-angle') },
    { id: 'geo-law-sines', group: 'Trigonometry', name: 'Law of sines', par: 75, gen: reuse('law-sines') },
    { id: 'geo-law-cos-side', group: 'Trigonometry', name: 'Law of cosines (find a side)', par: 75, gen: reuse('law-cosines-side') },
    { id: 'geo-law-cos-angle', group: 'Trigonometry', name: 'Law of cosines (find an angle)', par: 75, gen: reuse('law-cosines-angle') },
    { id: 'geo-trig-area', group: 'Trigonometry', name: 'Triangle area with sine', par: 50, gen: reuse('trig-area') }
  ];

  // ---------- Mastery ----------
  // Each attempt scores 0 if wrong. A right answer scores 0.7, plus up to 0.3 for
  // speed: full at or under par, falling to none at SLOW_AT × par.
  // Mastery is a weighted sum of the last WINDOW attempts, newest counting most.
  // Attempts that haven't happened yet count as 0, so 100% takes WINDOW fast right answers.
  var WINDOW = 10, DECAY = 0.85, ACCURACY = 0.7, SLOW_AT = 3, MASTERED = 90, MAX_MS = 600000;
  var FULL_WEIGHT = 0;
  for (var w = 0; w < WINDOW; w++) FULL_WEIGHT += Math.pow(DECAY, w);

  function attemptScore(a, parSec) {
    if (!a.ok) return 0;
    var speed = (SLOW_AT * parSec - a.ms / 1000) / ((SLOW_AT - 1) * parSec);
    return ACCURACY + (1 - ACCURACY) * Math.max(0, Math.min(1, speed));
  }
  // attempts: newest first
  function scoreAttempts(attempts, parSec) {
    var sum = attempts.reduce(function (acc, a, i) { return acc + Math.pow(DECAY, i) * attemptScore(a, parSec); }, 0);
    return Math.round(100 * sum / FULL_WEIGHT);
  }

  // ---------- State ----------
  // hp.study: { off: [ids unticked], stats: { id: [{ ok, ms }] newest first } }
  var state = M.load('hp.study', { off: [], stats: {} });
  state.off = state.off || [];
  state.stats = state.stats || {};
  function persist() { M.save('hp.study', state); }

  function attempts(t) { return state.stats[t.id] || []; }
  function mastery(t) { return scoreAttempts(attempts(t), t.par); }
  function isOn(t) { return state.off.indexOf(t.id) < 0; }
  function setOn(t, on) {
    state.off = state.off.filter(function (id) { return id !== t.id; });
    if (!on) state.off.push(t.id);
  }
  function selected() { return TOPICS.filter(isOn); }

  function clockText(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function secs(ms) { return ms < 60000 ? Math.round(ms / 1000) + 's' : clockText(ms); }
  function average(list) { return list.reduce(function (a, b) { return a + b; }, 0) / (list.length || 1); }

  // ---------- Topic list ----------
  var rows = {}, groups = {};

  function bar() {
    var b = document.createElement('div'), f = document.createElement('div');
    b.className = 'bar';
    f.className = 'fill';
    b.append(f);
    return { el: b, fill: f };
  }
  function checkbox(label) {
    var c = document.createElement('input');
    c.type = 'checkbox';
    c.setAttribute('aria-label', label);
    return c;
  }

  function buildList() {
    var box = $('s-list');
    TOPICS.forEach(function (t) {
      var g = groups[t.group];
      if (!g) {
        var el = document.createElement('div');
        el.className = 's-group';
        var head = document.createElement('label');
        head.className = 's-group-head';
        var h = document.createElement('h4');
        h.textContent = t.group;
        var pct = document.createElement('span');
        pct.className = 'count';
        var all = checkbox('Select all ' + t.group);
        head.append(all, h, pct);
        el.append(head);
        box.append(el);
        g = groups[t.group] = { el: el, box: all, pct: pct, topics: [] };
        all.addEventListener('change', function () {
          g.topics.forEach(function (x) { setOn(x, all.checked); });
          persist();
          update();
        });
      }
      g.topics.push(t);

      var row = document.createElement('label');
      row.className = 's-row';
      var c = checkbox(t.name);
      c.addEventListener('change', function () {
        setOn(t, c.checked);
        persist();
        update();
      });
      var name = document.createElement('span');
      name.className = 's-name';
      name.textContent = t.name;
      var pct2 = document.createElement('span');
      pct2.className = 'percent';
      var b = bar();
      var stat = document.createElement('span');
      stat.className = 's-stat';
      row.append(c, name, pct2, b.el, stat);
      g.el.append(row);
      rows[t.id] = { row: row, box: c, pct: pct2, fill: b.fill, stat: stat };
    });
  }

  function update() {
    TOPICS.forEach(function (t) {
      var r = rows[t.id], m = mastery(t), list = attempts(t), on = isOn(t);
      r.box.checked = on;
      r.row.classList.toggle('off', !on);
      r.pct.textContent = m + '%';
      r.fill.style.width = m + '%';
      r.fill.classList.toggle('complete', m >= MASTERED);
      if (list.length) {
        var right = list.filter(function (a) { return a.ok; });
        r.stat.textContent = right.length + '/' + list.length + ' right' + (right.length
          ? ' · ' + secs(average(right.map(function (a) { return a.ms; }))) + ' avg (goal ' + t.par + 's)'
          : '');
      } else {
        r.stat.textContent = 'Not practiced yet';
      }
    });
    Object.keys(groups).forEach(function (name) {
      var g = groups[name], on = g.topics.filter(isOn).length;
      g.box.checked = on === g.topics.length;
      g.box.indeterminate = on > 0 && on < g.topics.length;
      g.pct.textContent = Math.round(average(g.topics.map(mastery))) + '%';
    });
    var overall = Math.round(average(TOPICS.map(mastery)));
    $('s-overall').textContent = overall + '% mastery';
    $('s-overall-fill').style.width = overall + '%';
    var count = selected().length;
    $('s-count').textContent = count + ' of ' + TOPICS.length + ' selected';
    $('s-start').disabled = !count;
  }

  // ---------- Timer ----------
  // Runs only while a question is open and on screen. Time in another tab or
  // with the ⋯ section closed doesn't count.
  var session = null, current = null, lastTopic = null, answered = false, lastInput = null;
  var clock = { spent: 0, from: null }, ticker = null, lastLeft = null;

  function shouldRun() { return !!session && !answered && !document.hidden && !$('more').hidden; }
  function syncClock() {
    var now = performance.now(), run = shouldRun();
    if (clock.from !== null && !run) { clock.spent += now - clock.from; clock.from = null; }
    else if (clock.from === null && run) clock.from = now;
  }
  function elapsed() { return clock.spent + (clock.from !== null ? performance.now() - clock.from : 0); }
  function showClock() {
    if (!current) return;
    var ms = elapsed(), parMs = current.topic.par * 1000, timer = $('s-timer');
    var over = ms > parMs, left = Math.ceil((parMs - ms) / 1000);
    timer.textContent = clockText(ms);
    if (!answered) {
      if (over && !timer.classList.contains('over')) J.overPar(timer);
      else if (left >= 1 && left <= 3 && left !== lastLeft) J.parCountdown(timer);
    }
    lastLeft = left;
    timer.classList.toggle('over', over);
    var share = Math.max(0, 1 - ms / parMs);
    $('s-par-fill').style.width = share * 100 + '%';
    $('s-par-fill').classList.toggle('low', share < 0.25);
  }

  // ---------- Practice ----------
  function setHint(msg, isError) {
    $('s-hint').textContent = msg || '';
    $('s-hint').classList.toggle('error', !!isError);
  }

  function nextQuestion(first) {
    var pool = selected();
    if (!pool.length) { endSession('Tick at least one question type to keep practicing.'); return; }
    var fresh = pool.filter(function (t) { return t !== lastTopic; });
    var topic = pick(fresh.length ? fresh : pool);
    lastTopic = topic;
    current = topic.gen();
    current.topic = topic;
    answered = false;

    $('s-topic').textContent = topic.group + ' · ' + topic.name;
    $('s-question').textContent = current.text;
    var box = $('s-fields');
    box.textContent = '';
    current.fields.forEach(function (spec) { box.append(M.makeField(spec)); });
    lastInput = box.querySelector('input');
    setHint(current.hint);
    $('s-feedback').hidden = true;
    $('s-check').hidden = $('s-idk').hidden = false;
    $('s-next').hidden = true;
    $('s-keys').hidden = current.fields[0].kind === 'word';
    lastInput.focus({ preventScroll: true });

    clock = { spent: 0, from: null };
    syncClock();
    showClock();
    J.question([$('s-question'), $('s-fields'), $('s-form').querySelector('.m-actions')], !first);
  }

  function submit(idk) {
    if (answered) return;
    var inputs = $('s-fields').querySelectorAll('input');
    var ok = !idk, oks = [];
    if (!idk) {
      for (var i = 0; i < current.fields.length; i++) {
        var r = M.checkField(current.fields[i], inputs[i].value);
        if (r.retry) { setHint(r.retry, true); inputs[i].focus(); J.retry(inputs[i], $('s-hint')); return; }
        if (!r.ok) ok = false;
        oks.push(r.ok);
      }
    }
    var t = current.topic, ms = Math.round(Math.min(elapsed(), MAX_MS));
    answered = true;
    syncClock();
    showClock();

    var before = mastery(t);
    state.stats[t.id] = [{ ok: ok, ms: ms }].concat(attempts(t)).slice(0, WINDOW);
    persist();
    var after = mastery(t);

    session.total++;
    if (ok) { session.right++; session.ms += ms; }
    update();

    inputs.forEach(function (inp) { inp.readOnly = true; });
    var answer = current.fields.map(function (f) { return (f.label ? f.label + ' ' : '') + f.show; }).join(',  ');
    var timing = ok ? 'Took ' + secs(ms) + ' (goal ' + t.par + 's). ' : '';
    var fb = $('s-feedback');
    fb.dataset.result = ok ? 'right' : idk ? 'idk' : 'wrong';
    fb.textContent = '';
    [
      ['m-verdict', ok ? '✓ Correct!' : idk ? 'Here\'s how it works.' : '✗ Not quite.'],
      ['m-answer', 'Answer: ' + answer],
      ['m-why', current.why],
      ['m-note', timing + 'Mastery: ' + before + '% → ' + after + '%']
    ].forEach(function (row) {
      if (row[0] === 'm-why') { fb.append(J.meter(before, after), M.whyPlayer(row[1], $('s-next'))); return; }
      var p = document.createElement('p');
      p.className = row[0];
      p.textContent = row[1];
      fb.append(p);
    });
    fb.hidden = false;
    setHint('');
    $('s-check').hidden = $('s-idk').hidden = true;
    $('s-keys').hidden = true;
    $('s-next').hidden = false;
    $('s-next').focus({ preventScroll: true });
    var s = session;
    J.answer({
      id: 's', card: $('s-session').closest('.card'), inputs: Array.prototype.slice.call(inputs), oks: oks,
      result: ok ? 'right' : idk ? 'idk' : 'wrong', feedback: fb, score: $('s-score'),
      showScore: function () { $('s-score').textContent = s.right + '/' + s.total + ' right'; }
    });
    if (ok && ms <= t.par * 1000) J.fast($('s-timer'));
  }

  function startSession() {
    session = { right: 0, total: 0, ms: 0 };
    $('s-idle').hidden = true;
    $('s-session').hidden = false;
    $('s-score').textContent = '';
    lastTopic = null;
    ticker = setInterval(showClock, 250);
    nextQuestion(true);
    J.start($('s-session').closest('.card'));
  }

  function endSession(message) {
    var s = session;
    session = null;
    current = null;
    clearInterval(ticker);
    syncClock();
    $('s-session').hidden = true;
    $('s-idle').hidden = false;
    var avg = s.right ? ', ' + secs(s.ms / s.right) + ' average per right answer' : '';
    $('s-summary').textContent = message || (s.total
      ? 'Last session: ' + s.right + ' of ' + s.total + ' right' + avg + '.'
      : IDLE_TEXT);
    J.end(s, $('s-summary'));
  }

  // Symbol keys insert into the last focused answer box
  function insertSymbol(sym) {
    if (!lastInput || answered) return;
    var i = lastInput, start = i.selectionStart, end = i.selectionEnd;
    i.value = i.value.slice(0, start) + sym + i.value.slice(end);
    i.focus();
    i.setSelectionRange(start + sym.length, start + sym.length);
  }

  // ---------- Events ----------
  var IDLE_TEXT = 'Tick the question types you want, then start. Mastery goes up with right answers, and faster ones count for more.';

  $('s-start').addEventListener('click', startSession);
  $('s-end').addEventListener('click', function () { endSession(); });
  $('s-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (answered) nextQuestion(false);
    else submit(false);
  });
  $('s-idk').addEventListener('click', function () { submit(true); });
  $('s-all').addEventListener('click', function () { state.off = []; persist(); update(); });
  $('s-none').addEventListener('click', function () {
    state.off = TOPICS.map(function (t) { return t.id; });
    persist();
    update();
  });
  $('s-fields').addEventListener('focusin', function (e) { if (e.target.tagName === 'INPUT') lastInput = e.target; });
  $('s-keys').addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus in the answer box
  $('s-keys').addEventListener('click', function (e) {
    var key = e.target.closest('button');
    if (key) insertSymbol(key.textContent);
  });
  document.addEventListener('visibilitychange', syncClock);
  $('more-toggle').addEventListener('click', syncClock);

  // ---------- Init ----------
  window.hpStudy = { TOPICS: TOPICS, scoreAttempts: scoreAttempts, checkField: M.checkField };
  buildList();
  update();
  $('s-summary').textContent = IDLE_TEXT;
})();
