// Math practice: generated questions by topic, answer checking, and a
// "Needs practice" list of topics that were missed (wrong or "I don't know").
// A topic leaves that list after CLEAR_STREAK correct answers in a row.
(function () {
  'use strict';

  // ---------- Storage ----------
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  function $(id) { return document.getElementById(id); }
  var J = window.hpJuice;

  // ---------- Random / number helpers ----------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rnz(a, b) { var n; do { n = ri(a, b); } while (n === 0); return n; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function coin() { return Math.random() < 0.5; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function round(x, dp) { var f = Math.pow(10, dp); return Math.round(x * f) / f; }
  function rad(deg) { return deg * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function isPrime(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }

  // ---------- Display helpers ----------
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sup(n) { return String(n).replace(/[0-9-]/g, function (c) { return SUP[c]; }); }

  // Number with a real minus sign and no float noise
  function fmt(n) {
    var s = String(Math.round(n * 1e9) / 1e9);
    return s.charAt(0) === '-' ? '−' + s.slice(1) : s;
  }
  function par(n) { return n < 0 ? '(' + fmt(n) + ')' : fmt(n); }
  function money(n) { return '$' + (Math.round(n * 100) % 100 ? n.toFixed(2) : fmt(Math.round(n))); }

  function frac(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n /= g; d /= g;
    return d === 1 ? fmt(n) : fmt(n) + '/' + d;
  }
  // "7/4 (= 1 3/4)" for improper fractions
  function fracShow(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n /= g; d /= g;
    if (d === 1 || Math.abs(n) < d) return frac(n, d);
    var w = Math.floor(Math.abs(n) / d), r = Math.abs(n) % d;
    return frac(n, d) + ' (= ' + (n < 0 ? '−' : '') + w + ' ' + r + '/' + d + ')';
  }
  // k·π/d, simplified: "π/3", "5π/6", "2π"
  function piStr(n, d) {
    var g = gcd(n, d); n /= g; d /= g;
    return (n === 1 ? '' : n === -1 ? '−' : fmt(n)) + 'π' + (d === 1 ? '' : '/' + d);
  }

  // Terms like [[3, 'x'], [-5, '']] → "3x − 5"
  function join(list) {
    var out = '';
    list.forEach(function (t) {
      var c = t[0], v = t[1] || '';
      if (!c) return;
      var a = Math.abs(c);
      var body = (a === 1 && v ? '' : fmt(a)) + v;
      out += out ? (c < 0 ? ' − ' : ' + ') + body : (c < 0 ? '−' : '') + body;
    });
    return out || '0';
  }
  // Coefficients from the highest power down: [2, -3, 5] → "2x² − 3x + 5"
  function poly(cs, v) {
    v = v || 'x';
    var top = cs.length - 1;
    return join(cs.map(function (c, i) {
      var p = top - i;
      return [c, p === 0 ? '' : p === 1 ? v : v + sup(p)];
    }));
  }
  function mono(c, n) { var cs = [c]; for (var i = 0; i < n; i++) cs.push(0); return cs; }

  // ---------- Answer specs ----------
  // Each question has one or more fields, each with a spec saying how to check it.
  function num(value, show, extra) {
    var s = { kind: 'num', value: value, show: show || fmt(value) };
    for (var k in extra) s[k] = extra[k];
    return s;
  }
  function fracAns(n, d) { return num(n / d, fracShow(n, d), { frac: true }); }
  // Rounded answers: lenient enough for intermediate rounding and π ≈ 3.14
  function tenth(v) {
    var exact = Math.abs(v - Math.round(v)) < 1e-9;
    return num(v, exact ? fmt(Math.round(v)) : '≈ ' + fmt(round(v, 1)), { tol: Math.max(0.1, Math.abs(v) * 0.001) });
  }
  function expr(cs, form, show) { return { kind: 'expr', coeffs: cs, form: form, show: show || poly(cs) }; }
  function set(values, tol, show) {
    var uniq = values.filter(function (v, i) { return values.indexOf(v) === i; });
    return { kind: 'set', values: uniq, tol: tol, show: show || 'x = ' + uniq.map(fmt).join(', ') };
  }
  function lab(label, spec) { spec.label = label; return spec; }

  function Q(text, fields, why, hint) {
    return { text: text, fields: Array.isArray(fields) ? fields : [fields], why: why, hint: hint || '' };
  }

  var TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  var EXACT = {
    sin: { 0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1' },
    cos: { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' },
    tan: { 0: '0', 30: '√3/3', 45: '1', 60: '√3' }
  };
  function trig(fn, d) { return Math[fn](rad(d)); }
  var EXACT_HINT = 'Exact, like √3/2 (type √ or sqrt)';

  // ---------- Topics ----------
  var TOPICS = [
    // ----- Arithmetic -----
    { id: 'int-add', group: 'Arithmetic', name: 'Adding & subtracting integers', gen: function () {
      var a = rnz(-20, 20), b = rnz(-20, 20), sub = coin(), v = sub ? a - b : a + b;
      return Q(fmt(a) + (sub ? ' − ' : ' + ') + par(b) + ' = ?', num(v), sub
        ? 'Subtracting is adding the opposite: ' + fmt(a) + ' + ' + par(-b) + ' = ' + fmt(v) + '.'
        : 'Same signs: add and keep the sign. Different signs: subtract and keep the sign of the bigger one. ' + fmt(a) + ' + ' + par(b) + ' = ' + fmt(v) + '.');
    } },
    { id: 'int-mul', group: 'Arithmetic', name: 'Multiplying & dividing integers', gen: function () {
      var a = rnz(-12, 12), b = rnz(-12, 12), p = a * b;
      var rule = 'Same signs give a positive answer; different signs give a negative one. ';
      return coin()
        ? Q(fmt(a) + ' × ' + par(b) + ' = ?', num(p), rule + fmt(a) + ' × ' + par(b) + ' = ' + fmt(p) + '.')
        : Q(fmt(p) + ' ÷ ' + par(b) + ' = ?', num(a), rule + fmt(p) + ' ÷ ' + par(b) + ' = ' + fmt(a) + '.');
    } },
    { id: 'order-ops', group: 'Arithmetic', name: 'Order of operations', gen: function () {
      var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), d = ri(2, 9);
      var t = pick([
        [a + ' + ' + b + ' × ' + c, a + b * c, 'Multiply first: ' + b + ' × ' + c + ' = ' + b * c + ', then add ' + a + '.'],
        ['(' + a + ' + ' + b + ') × ' + c + ' − ' + d, (a + b) * c - d, 'Parentheses first: ' + (a + b) + '. Then × ' + c + ' = ' + (a + b) * c + ', then − ' + d + '.'],
        [a + ' × ' + b + ' − ' + c * d + ' ÷ ' + d, a * b - c, a + ' × ' + b + ' = ' + a * b + ' and ' + c * d + ' ÷ ' + d + ' = ' + c + ', then subtract.'],
        [a + '² − ' + b + ' × ' + c, a * a - b * c, 'Exponent first: ' + a + '² = ' + a * a + '. Then ' + b + ' × ' + c + ' = ' + b * c + ', then subtract.'],
        [a * c + ' − ' + b + ' × (' + (c + d) + ' − ' + d + ')', a * c - b * c, 'Parentheses: ' + (c + d) + ' − ' + d + ' = ' + c + '. Then ' + b + ' × ' + c + ' = ' + b * c + ', then subtract from ' + a * c + '.']
      ]);
      return Q(t[0] + ' = ?', num(t[1]), t[2] + ' Answer: ' + fmt(t[1]) + '.');
    } },
    { id: 'gcf', group: 'Arithmetic', name: 'Greatest common factor', gen: function () {
      var g = ri(2, 12), m, n;
      do { m = ri(1, 9); n = ri(2, 9); } while (m === n || gcd(m, n) !== 1);
      return Q('What is the greatest common factor of ' + g * m + ' and ' + g * n + '?', num(g),
        g * m + ' = ' + g + ' × ' + m + ' and ' + g * n + ' = ' + g + ' × ' + n + '. ' + m + ' and ' + n + ' share no other factor, so the GCF is ' + g + '.');
    } },
    { id: 'lcm', group: 'Arithmetic', name: 'Least common multiple', gen: function () {
      var a = ri(2, 15), b, c;
      if (coin()) {
        do { b = ri(2, 15); } while (b === a);
        var big = Math.max(a, b), small = Math.min(a, b), mults = [], k = 1;
        while (true) { mults.push(big * k); if ((big * k) % small === 0) break; k++; }
        return Q('What is the least common multiple of ' + a + ' and ' + b + '?', num(lcm(a, b)),
          'Multiples of ' + big + ': ' + mults.join(', ') + '. ' + lcm(a, b) + ' is the first one ' + small + ' divides into.');
      }
      a = ri(2, 10);
      do { b = ri(2, 10); c = ri(2, 10); } while (b === a || c === a || c === b);
      var ab = lcm(a, b), all = lcm(ab, c);
      return Q('What is the least common multiple of ' + a + ', ' + b + ', and ' + c + '?', num(all),
        'LCM of ' + a + ' and ' + b + ' is ' + ab + '. LCM of ' + ab + ' and ' + c + ' is ' + all + '.');
    } },
    { id: 'prime-fact', group: 'Arithmetic', name: 'Prime factorization', gen: function () {
      var fs, n;
      do {
        fs = [];
        for (var i = ri(2, 5); i > 0; i--) fs.push(pick([2, 2, 2, 3, 3, 5, 7, 11, 13]));
        n = fs.reduce(function (p, f) { return p * f; }, 1);
      } while (n < 12 || n > 600);
      fs.sort(function (x, y) { return x - y; });
      var counts = {}, chain = [n], left = n;
      fs.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; left /= f; chain.push(left); });
      var show = Object.keys(counts).map(function (p) { return p + (counts[p] > 1 ? sup(counts[p]) : ''); }).join(' × ');
      return Q('Write the prime factorization of ' + n + '.', { kind: 'primes', value: n, show: show },
        'Keep dividing by primes (' + fs.join(', ') + '): ' + chain.join(' → ') + '.', 'Like 2^3 * 5 or 2*2*2*5');
    } },
    { id: 'exponents', group: 'Arithmetic', name: 'Exponents', gen: function () {
      var b = ri(2, 6), e = ri(2, b <= 3 ? 5 : 3), v;
      switch (ri(0, 4)) {
        case 0: v = Math.pow(b, e); return Q(b + sup(e) + ' = ?', num(v), b + ' multiplied by itself ' + e + ' times = ' + v + '.');
        case 1: v = Math.pow(-b, e); return Q('(−' + b + ')' + sup(e) + ' = ?', num(v), 'An even power of a negative number is positive; an odd power is negative. (−' + b + ')' + sup(e) + ' = ' + fmt(v) + '.');
        case 2: v = -Math.pow(b, e); return Q('−' + b + sup(e) + ' = ?', num(v), 'The exponent happens before the minus sign: −(' + b + sup(e) + ') = ' + fmt(v) + '.');
        case 3: b = ri(2, 99); return Q(b + '⁰ = ?', num(1), 'Any nonzero number to the power 0 is 1.');
        default:
          e = ri(1, 3);
          v = Math.pow(b, e);
          return Q(b + sup(-e) + ' = ?', num(1 / v, '1/' + v, { frac: true }), 'A negative exponent means 1 over the positive power: 1/' + b + sup(e) + ' = 1/' + v + '.', 'A fraction, like 1/8');
      }
    } },
    { id: 'roots', group: 'Arithmetic', name: 'Square & cube roots', gen: function () {
      var r;
      if (coin()) { r = ri(2, 20); return Q('√' + r * r + ' = ?', num(r), r + ' × ' + r + ' = ' + r * r + '.'); }
      r = ri(2, 6);
      return Q('∛' + r * r * r + ' = ?', num(r), r + ' × ' + r + ' × ' + r + ' = ' + r * r * r + '.');
    } },
    { id: 'radicals', group: 'Arithmetic', name: 'Simplifying radicals', gen: function () {
      var k = ri(2, 7), m = pick([2, 3, 5, 6, 7, 10, 11]);
      return Q('Simplify √' + k * k * m, { kind: 'radical', value: k * Math.sqrt(m), show: k + '√' + m },
        'Find the biggest perfect square factor: √' + k * k * m + ' = √(' + k * k + ' × ' + m + ') = √' + k * k + ' × √' + m + ' = ' + k + '√' + m + '.',
        'Like 3√2 (type √ or sqrt)');
    } },
    { id: 'abs-value', group: 'Arithmetic', name: 'Absolute value', gen: function () {
      var a = rnz(-15, 15), b = ri(-10, 10), c = ri(-10, 10), v = Math.abs(a) - Math.abs(b - c);
      return Q('|' + fmt(a) + '| − |' + fmt(b) + ' − ' + par(c) + '| = ?', num(v),
        '|' + fmt(a) + '| = ' + Math.abs(a) + ' and |' + fmt(b) + ' − ' + par(c) + '| = |' + fmt(b - c) + '| = ' + Math.abs(b - c) + '. ' + Math.abs(a) + ' − ' + Math.abs(b - c) + ' = ' + fmt(v) + '.');
    } },

    // ----- Fractions & decimals -----
    { id: 'frac-simplify', group: 'Fractions & decimals', name: 'Simplifying fractions', gen: function () {
      var d = ri(2, 12), k = ri(2, 9), n;
      do { n = ri(1, d - 1); } while (gcd(n, d) !== 1);
      return Q('Simplify ' + n * k + '/' + d * k, fracAns(n, d),
        'The GCF of ' + n * k + ' and ' + d * k + ' is ' + k + '. Divide both by ' + k + ': ' + n + '/' + d + '.', 'Simplest form, like 3/4');
    } },
    { id: 'frac-add', group: 'Fractions & decimals', name: 'Adding & subtracting fractions', gen: function () {
      var b = ri(2, 12), d = ri(2, 12), a = ri(1, b - 1), c = ri(1, d - 1), sub = coin();
      var L = lcm(b, d), A = a * L / b, C = c * L / d, N = sub ? A - C : A + C;
      var op = sub ? ' − ' : ' + ';
      return Q(a + '/' + b + op + c + '/' + d + ' = ?', fracAns(N, L),
        'Common denominator ' + L + ': ' + A + '/' + L + op + C + '/' + L + ' = ' + fmt(N) + '/' + L + (frac(N, L) !== fmt(N) + '/' + L ? ' = ' + frac(N, L) : '') + '.',
        'Simplest form, like 3/4 or 1 1/2');
    } },
    { id: 'frac-mul', group: 'Fractions & decimals', name: 'Multiplying & dividing fractions', gen: function () {
      var a = ri(1, 9), b = ri(2, 10), c = ri(1, 9), d = ri(2, 10), div = coin();
      var N = div ? a * d : a * c, D = div ? b * c : b * d;
      var simp = frac(N, D) !== N + '/' + D ? ' = ' + frac(N, D) : '';
      return div
        ? Q(a + '/' + b + ' ÷ ' + c + '/' + d + ' = ?', fracAns(N, D), 'Dividing is multiplying by the flipped fraction: ' + a + '/' + b + ' × ' + d + '/' + c + ' = ' + N + '/' + D + simp + '.', 'Simplest form, like 3/4 or 1 1/2')
        : Q(a + '/' + b + ' × ' + c + '/' + d + ' = ?', fracAns(N, D), 'Multiply the tops and the bottoms: ' + N + '/' + D + simp + '.', 'Simplest form, like 3/4 or 1 1/2');
    } },
    { id: 'mixed', group: 'Fractions & decimals', name: 'Mixed numbers', gen: function () {
      var x = [ri(1, 6), ri(2, 8)], y = [ri(1, 5), ri(2, 8)], sub = coin();
      x.push(ri(1, x[1] - 1)); y.push(ri(1, y[1] - 1)); // [whole, denominator, numerator]
      var A = x[0] * x[1] + x[2], B = y[0] * y[1] + y[2];
      if (sub && A / x[1] < B / y[1]) { var t = x; x = y; y = t; t = A; A = B; B = t; }
      var L = lcm(x[1], y[1]), N = sub ? A * L / x[1] - B * L / y[1] : A * L / x[1] + B * L / y[1];
      var op = sub ? ' − ' : ' + ';
      return Q(x[0] + ' ' + x[2] + '/' + x[1] + op + y[0] + ' ' + y[2] + '/' + y[1] + ' = ?', fracAns(N, L),
        'As improper fractions: ' + A + '/' + x[1] + op + B + '/' + y[1] + ' = ' + A * L / x[1] + '/' + L + op + B * L / y[1] + '/' + L + ' = ' + fracShow(N, L) + '.',
        'Like 3 1/4 or 13/4');
    } },
    { id: 'frac-dec', group: 'Fractions & decimals', name: 'Fractions ↔ decimals', gen: function () {
      var d = pick([2, 4, 5, 8, 10, 20, 25]), n;
      do { n = ri(1, d - 1); } while (gcd(n, d) !== 1);
      var dec = n / d;
      if (coin()) return Q('Write ' + n + '/' + d + ' as a decimal.', num(dec), n + ' ÷ ' + d + ' = ' + fmt(dec) + '.');
      var places = String(dec).split('.')[1].length, p = Math.pow(10, places);
      return Q('Write ' + fmt(dec) + ' as a fraction in simplest form.', num(dec, n + '/' + d, { frac: true }),
        fmt(dec) + ' = ' + Math.round(dec * p) + '/' + p + ' = ' + n + '/' + d + '.', 'Simplest form, like 3/4');
    } },
    { id: 'decimals', group: 'Fractions & decimals', name: 'Decimal arithmetic', gen: function () {
      var a, b, v;
      switch (ri(0, 2)) {
        case 0:
          a = ri(101, 9999) / 100; b = ri(10, 999) / 100;
          var sub = coin();
          if (sub && b > a) { var t = a; a = b; b = t; }
          v = round(sub ? a - b : a + b, 2);
          return Q(fmt(a) + (sub ? ' − ' : ' + ') + fmt(b) + ' = ?', num(v), 'Line up the decimal points, then ' + (sub ? 'subtract' : 'add') + ': ' + fmt(v) + '.');
        case 1:
          var A = ri(11, 99), B, bp = pick([10, 100]);
          do { B = ri(2, 99); } while (B % 10 === 0);
          a = A / 10; b = B / bp; v = A * B / (10 * bp);
          return Q(fmt(a) + ' × ' + fmt(b) + ' = ?', num(v), 'Multiply without the decimals: ' + A + ' × ' + B + ' = ' + A * B + '. There are ' + (bp === 10 ? 2 : 3) + ' decimal places in total, so ' + fmt(v) + '.');
        default:
          var qq = ri(12, 99); b = ri(2, 9); a = qq * b / 10; v = qq / 10;
          return Q(fmt(a) + ' ÷ ' + b + ' = ?', num(v), fmt(a) + ' ÷ ' + b + ' = ' + fmt(v) + '. Check: ' + fmt(v) + ' × ' + b + ' = ' + fmt(a) + '.');
      }
    } },
    { id: 'rounding', group: 'Fractions & decimals', name: 'Rounding', gen: function () {
      var X = ri(1000, 99999), dp = ri(0, 2), names = ['whole number', 'tenth', 'hundredth'];
      var R = Math.round(X / Math.pow(10, 3 - dp)) / Math.pow(10, dp);
      return Q('Round ' + (X / 1000).toFixed(3) + ' to the nearest ' + names[dp] + '.', num(R, R.toFixed(dp)),
        'Look at the digit right after the ' + names[dp] + (dp ? 's' : '') + ' place: 5 or more rounds up, 4 or less stays. Answer: ' + R.toFixed(dp) + '.');
    } },

    // ----- Ratios & percents -----
    { id: 'percent', group: 'Ratios & percents', name: 'Percent of a number', gen: function () {
      var p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 120, 150]), w;
      do { w = 10 * ri(2, 40); } while ((w * p) % 100);
      var part = w * p / 100;
      switch (ri(0, 2)) {
        case 0: return Q('What is ' + p + '% of ' + w + '?', num(part), p + '% = ' + fmt(p / 100) + ', and ' + fmt(p / 100) + ' × ' + w + ' = ' + part + '.');
        case 1: return Q(part + ' is what percent of ' + w + '?', num(p), part + ' ÷ ' + w + ' = ' + fmt(p / 100) + ', which is ' + p + '%.', 'Just the number (25 means 25%)');
        default: return Q(part + ' is ' + p + '% of what number?', num(w), part + ' ÷ ' + fmt(p / 100) + ' = ' + w + '.');
      }
    } },
    { id: 'percent-change', group: 'Ratios & percents', name: 'Percent increase & decrease', gen: function () {
      var o, p;
      do { o = pick([20, 40, 50, 60, 80, 120, 150, 200, 250, 400, 500]); p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]); } while ((o * p) % 100);
      var up = coin(), ch = o * p / 100, n = up ? o + ch : o - ch;
      if (coin()) {
        return Q('A price goes from $' + o + ' to $' + n + '. What is the percent ' + (up ? 'increase' : 'decrease') + '?', num(p),
          'Change ÷ original × 100 = ' + ch + ' ÷ ' + o + ' × 100 = ' + p + '%.', 'Just the number (25 means 25%)');
      }
      return Q(up ? 'A $' + o + ' bill goes up by ' + p + '%. What is the new amount?' : 'A $' + o + ' jacket is ' + p + '% off. What is the sale price?',
        num(n, money(n), { tol: 0.005 }),
        p + '% of ' + o + ' is ' + ch + ', so ' + o + (up ? ' + ' : ' − ') + ch + ' = ' + n + '. (Shortcut: ' + o + ' × ' + fmt(1 + (up ? p : -p) / 100) + '.)');
    } },
    { id: 'proportions', group: 'Ratios & percents', name: 'Ratios & proportions', gen: function () {
      var a = ri(1, 12), b = ri(2, 9), k = ri(2, 6);
      switch (ri(0, 2)) {
        case 0: return Q('Solve for x:  ' + a + '/' + b + ' = x/' + b * k, lab('x =', num(a * k)), b + ' × ' + k + ' = ' + b * k + ', so multiply the top by ' + k + ' too: x = ' + a * k + '.');
        case 1: return Q('Solve for x:  ' + a + '/' + b + ' = ' + a * k + '/x', lab('x =', num(b * k)), a + ' × ' + k + ' = ' + a * k + ', so multiply the bottom by ' + k + ' too: x = ' + b * k + '.');
        default:
          var cents = ri(75, 450), m;
          do { m = ri(2, 15); } while (m === b);
          var item = pick(['notebooks', 'pens', 'apples', 'tickets']);
          return Q('If ' + b + ' ' + item + ' cost ' + money(cents * b / 100) + ', how much do ' + m + ' cost?', num(cents * m / 100, money(cents * m / 100), { tol: 0.005 }),
            'One costs ' + money(cents * b / 100) + ' ÷ ' + b + ' = ' + money(cents / 100) + ', so ' + m + ' cost ' + m + ' × ' + money(cents / 100) + ' = ' + money(cents * m / 100) + '.');
      }
    } },
    { id: 'unit-rate', group: 'Ratios & percents', name: 'Unit rates', gen: function () {
      if (coin()) {
        var cents = ri(105, 999), n = ri(3, 12), total = cents * n / 100;
        return Q(n + ' bags of chips cost ' + money(total) + '. What is the price per bag?', num(cents / 100, money(cents / 100), { tol: 0.005 }),
          money(total) + ' ÷ ' + n + ' = ' + money(cents / 100) + '.');
      }
      var r = ri(25, 70), h = ri(2, 6);
      return Q('A car drives ' + r * h + ' miles in ' + h + ' hours. What is its average speed in miles per hour?', num(r), r * h + ' ÷ ' + h + ' = ' + r + ' mph.');
    } },
    { id: 'simple-interest', group: 'Ratios & percents', name: 'Simple interest', gen: function () {
      var P = pick([500, 800, 1000, 1200, 1500, 2000, 2500, 5000]), r = pick([2, 3, 4, 5, 6, 8]), t = ri(1, 6), I = P * r * t / 100;
      return Q('How much simple interest does $' + P + ' earn at ' + r + '% per year for ' + t + ' year' + (t > 1 ? 's' : '') + '?', num(I, money(I), { tol: 0.005 }),
        'I = P × r × t = ' + P + ' × ' + fmt(r / 100) + ' × ' + t + ' = ' + money(I) + '.');
    } },
    { id: 'compound-interest', group: 'Ratios & percents', name: 'Compound interest', gen: function () {
      var P = pick([500, 1000, 2000, 5000]), r = pick([2, 3, 4, 5, 6]), t = ri(2, 10), A = P * Math.pow(1 + r / 100, t);
      return Q('$' + P + ' is invested at ' + r + '% interest, compounded yearly. How much is it worth after ' + t + ' years?', num(A, money(round(A, 2)), { tol: 0.02 }),
        'A = P(1 + r)ᵗ = ' + P + ' × ' + fmt(1 + r / 100) + sup(t) + ' ≈ ' + money(round(A, 2)) + '.', 'Nearest cent');
    } },

    // ----- Pre-algebra -----
    { id: 'evaluate', group: 'Pre-algebra', name: 'Evaluating expressions', gen: function () {
      var a = rnz(-5, 5), b = ri(-9, 9), c = ri(-9, 9), x = rnz(-4, 4), v = a * x * x + b * x + c;
      return Q('Evaluate ' + poly([a, b, c]) + ' when x = ' + fmt(x) + '.', num(v),
        'Put ' + fmt(x) + ' in for x: ' + fmt(a) + '(' + fmt(x) + ')² + ' + par(b) + '(' + fmt(x) + ') + ' + par(c) + ' = ' + fmt(a * x * x) + ' + ' + par(b * x) + ' + ' + par(c) + ' = ' + fmt(v) + '.');
    } },
    { id: 'like-terms', group: 'Pre-algebra', name: 'Combining like terms', gen: function () {
      var a, b, c, d;
      do { a = rnz(-9, 9); b = rnz(-9, 9); c = rnz(-9, 9); d = rnz(-9, 9); } while (a + c === 0 || b + d === 0);
      return Q('Simplify:  ' + join([[a, 'x'], [b, ''], [c, 'x'], [d, '']]), expr([a + c, b + d], 'expanded'),
        'x terms: ' + fmt(a) + ' + ' + par(c) + ' = ' + fmt(a + c) + '. Numbers: ' + fmt(b) + ' + ' + par(d) + ' = ' + fmt(b + d) + '.', 'Like 3x - 5');
    } },
    { id: 'distribute', group: 'Pre-algebra', name: 'Distributive property', gen: function () {
      var a = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]), b = rnz(-5, 5), c = rnz(-9, 9);
      return Q('Expand:  ' + fmt(a) + '(' + poly([b, c]) + ')', expr([a * b, a * c], 'expanded'),
        'Multiply ' + fmt(a) + ' by each term inside: ' + fmt(a) + ' × ' + (b < 0 ? '(' + poly([b, 0]) + ')' : poly([b, 0])) + ' = ' + poly([a * b, 0]) + ' and ' + fmt(a) + ' × ' + par(c) + ' = ' + fmt(a * c) + '.', 'Like 6x + 15');
    } },
    { id: 'one-step', group: 'Pre-algebra', name: 'One-step equations', gen: function () {
      var x = rnz(-12, 12), a = ri(2, 12);
      switch (ri(0, 3)) {
        case 0: return Q('Solve:  x + ' + a + ' = ' + fmt(x + a), lab('x =', num(x)), 'Subtract ' + a + ' from both sides: x = ' + fmt(x + a) + ' − ' + a + ' = ' + fmt(x) + '.');
        case 1: return Q('Solve:  x − ' + a + ' = ' + fmt(x - a), lab('x =', num(x)), 'Add ' + a + ' to both sides: x = ' + fmt(x - a) + ' + ' + a + ' = ' + fmt(x) + '.');
        case 2: return Q('Solve:  ' + a + 'x = ' + fmt(a * x), lab('x =', num(x)), 'Divide both sides by ' + a + ': x = ' + fmt(a * x) + ' ÷ ' + a + ' = ' + fmt(x) + '.');
        default: return Q('Solve:  x/' + a + ' = ' + fmt(x), lab('x =', num(a * x)), 'Multiply both sides by ' + a + ': x = ' + fmt(x) + ' × ' + a + ' = ' + fmt(a * x) + '.');
      }
    } },
    { id: 'two-step', group: 'Pre-algebra', name: 'Two-step equations', gen: function () {
      var a = pick([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]), x = rnz(-10, 10), b = rnz(-15, 15), c = a * x + b;
      return Q('Solve:  ' + poly([a, b]) + ' = ' + fmt(c), lab('x =', num(x)),
        (b > 0 ? 'Subtract ' + b : 'Add ' + -b) + ' on both sides: ' + poly([a, 0]) + ' = ' + fmt(c - b) + '. Divide by ' + fmt(a) + ': x = ' + fmt(x) + '.');
    } },
    { id: 'multi-step', group: 'Pre-algebra', name: 'Variables on both sides', gen: function () {
      var a = rnz(-9, 9), x = rnz(-9, 9), b = ri(-15, 15), c;
      do { c = rnz(-9, 9); } while (c === a);
      var d = (a - c) * x + b;
      return Q('Solve:  ' + poly([a, b]) + ' = ' + poly([c, d]), lab('x =', num(x)),
        'Move the x terms to one side and the numbers to the other: ' + poly([a - c, 0]) + ' = ' + fmt(d - b) + '. So x = ' + fmt(d - b) + ' ÷ ' + par(a - c) + ' = ' + fmt(x) + '.');
    } },
    { id: 'inequalities', group: 'Pre-algebra', name: 'Inequalities', gen: function () {
      var a = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]), x0 = rnz(-8, 8), b = ri(-10, 10), c = a * x0 + b;
      var shown = ['<', '>', '≤', '≥'], typed = ['<', '>', '<=', '>='], flip = [1, 0, 3, 2];
      var oi = ri(0, 3), res = a < 0 ? flip[oi] : oi;
      return Q('Solve:  ' + poly([a, b]) + ' ' + shown[oi] + ' ' + fmt(c), { kind: 'ineq', op: typed[res], value: x0, show: 'x ' + shown[res] + ' ' + fmt(x0) },
        (b ? (b > 0 ? 'Subtract ' + b : 'Add ' + -b) + ', then divide' : 'Divide') + ' by ' + fmt(a) + '.' + (a < 0 ? ' Dividing by a negative number flips the inequality sign.' : ''),
        'Like x > 3 or x <= -2');
    } },
    { id: 'exp-rules', group: 'Pre-algebra', name: 'Exponent rules', gen: function () {
      var a = ri(2, 9), b = ri(2, 6), c, d;
      switch (ri(0, 3)) {
        case 0: return Q('Simplify:  x' + sup(a) + ' · x' + sup(b), expr(mono(1, a + b), 'monomial', 'x' + sup(a + b)), 'Multiplying the same base: add the exponents. ' + a + ' + ' + b + ' = ' + (a + b) + '.', 'Like x^8');
        case 1: a = ri(2, 5); b = ri(2, 4); return Q('Simplify:  (x' + sup(a) + ')' + sup(b), expr(mono(1, a * b), 'monomial', 'x' + sup(a * b)), 'Power of a power: multiply the exponents. ' + a + ' × ' + b + ' = ' + a * b + '.', 'Like x^8');
        case 2: return Q('Simplify:  x' + sup(a + b) + ' / x' + sup(b), expr(mono(1, a), 'monomial', 'x' + sup(a)), 'Dividing the same base: subtract the exponents. ' + (a + b) + ' − ' + b + ' = ' + a + '.', 'Like x^8');
        default:
          c = ri(2, 7); d = ri(2, 7); a = ri(2, 6); b = ri(2, 6);
          return Q('Simplify:  (' + c + 'x' + sup(a) + ')(' + d + 'x' + sup(b) + ')', expr(mono(c * d, a + b), 'monomial', c * d + 'x' + sup(a + b)),
            'Multiply the numbers (' + c + ' × ' + d + ' = ' + c * d + ') and add the exponents (' + a + ' + ' + b + ' = ' + (a + b) + ').', 'Like 6x^5');
      }
    } },
    { id: 'sci-notation', group: 'Pre-algebra', name: 'Scientific notation', gen: function () {
      var c = ri(11, 99) / 10, e = coin() ? ri(3, 8) : -ri(2, 5);
      var v = Number(c + 'e' + e), std = e > 0 ? v.toLocaleString('en-US') : String(v), sci = fmt(c) + ' × 10' + sup(e);
      if (coin()) {
        return Q('Write ' + std + ' in scientific notation.', { kind: 'sci', value: v, show: sci },
          'Move the decimal point so there is one digit in front of it: ' + fmt(c) + '. It moved ' + Math.abs(e) + ' places ' + (e > 0 ? 'left' : 'right') + ', so the power is ' + fmt(e) + '.',
          'Like 4.5 x 10^6');
      }
      return Q('Write ' + sci + ' in standard form.', num(v, std, { tol: Math.abs(v) * 1e-9 }),
        'Move the decimal point ' + Math.abs(e) + ' places to the ' + (e > 0 ? 'right' : 'left') + ': ' + std + '.');
    } },

    // ----- Algebra -----
    { id: 'functions', group: 'Algebra', name: 'Function notation', gen: function () {
      var a = rnz(-4, 4), b = ri(-9, 9), c = ri(-5, 5), k = ri(-3, 3), g = k * k + c, v = a * g + b;
      return Q('f(x) = ' + poly([a, b]) + '  and  g(x) = ' + poly([1, 0, c]) + '\nFind f(g(' + fmt(k) + ')).', num(v),
        'Inside first: g(' + fmt(k) + ') = ' + par(k) + '² + ' + par(c) + ' = ' + fmt(g) + '. Then f(' + fmt(g) + ') = ' + fmt(a) + '(' + fmt(g) + ') + ' + par(b) + ' = ' + fmt(v) + '.');
    } },
    { id: 'abs-eq', group: 'Algebra', name: 'Absolute value equations', gen: function () {
      var a = rnz(-9, 9), b = ri(1, 10);
      return Q('Solve:  |' + poly([1, a]) + '| = ' + b, set([b - a, -b - a]),
        'Two cases: ' + poly([1, a]) + ' = ' + b + ' gives x = ' + fmt(b - a) + ', and ' + poly([1, a]) + ' = −' + b + ' gives x = ' + fmt(-b - a) + '.',
        'Both answers, separated by a comma');
    } },
    { id: 'slope', group: 'Algebra', name: 'Slope', gen: function () {
      var x1 = ri(-9, 9), y1 = ri(-9, 9), y2 = ri(-9, 9), x2;
      do { x2 = ri(-9, 9); } while (x2 === x1);
      var dy = y2 - y1, dx = x2 - x1;
      return Q('Find the slope of the line through (' + fmt(x1) + ', ' + fmt(y1) + ') and (' + fmt(x2) + ', ' + fmt(y2) + ').', fracAns(dy, dx),
        'Slope = rise ÷ run = (' + fmt(y2) + ' − ' + par(y1) + ') ÷ (' + fmt(x2) + ' − ' + par(x1) + ') = ' + fmt(dy) + '/' + fmt(dx) + ' = ' + frac(dy, dx) + '.',
        'Like 2, -3/4, or 0');
    } },
    { id: 'line-eq', group: 'Algebra', name: 'Equation of a line', gen: function () {
      var md = pick([1, 1, 1, 2, 3]), mn, b = ri(-9, 9);
      do { mn = rnz(-5, 5); } while (gcd(mn, md) !== 1);
      var m = mn / md, x1 = md * ri(-3, 2), x2 = x1 + md * ri(1, 3), y1 = m * x1 + b, y2 = m * x2 + b;
      var mStr = md === 1 ? (mn === 1 ? '' : mn === -1 ? '−' : fmt(mn)) : (mn < 0 ? '−' : '') + Math.abs(mn) + '/' + md;
      var show = 'y = ' + mStr + 'x' + (b ? (b < 0 ? ' − ' : ' + ') + Math.abs(b) : '');
      return Q('Find the equation of the line through (' + fmt(x1) + ', ' + fmt(y1) + ') and (' + fmt(x2) + ', ' + fmt(y2) + '). Write it as y = mx + b.',
        expr([m, b], 'any', show),
        'Slope m = ' + fmt(y2 - y1) + '/' + fmt(x2 - x1) + ' = ' + frac(mn, md) + '. Then b = y − mx = ' + fmt(y1) + ' − (' + frac(mn, md) + ')(' + fmt(x1) + ') = ' + fmt(b) + '.',
        'Like y = 2x - 3 or y = 1/2x + 4');
    } },
    { id: 'systems', group: 'Algebra', name: 'Systems of equations', gen: function () {
      var x = ri(-6, 6), y = ri(-6, 6), a1, b1, a2, b2;
      do { a1 = rnz(-5, 5); b1 = rnz(-5, 5); a2 = rnz(-5, 5); b2 = rnz(-5, 5); } while (a1 * b2 - a2 * b1 === 0);
      var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      return Q('Solve the system:\n' + join([[a1, 'x'], [b1, 'y']]) + ' = ' + fmt(c1) + '\n' + join([[a2, 'x'], [b2, 'y']]) + ' = ' + fmt(c2),
        [lab('x =', num(x)), lab('y =', num(y))],
        'Use elimination or substitution. Check in the first equation: ' + fmt(a1) + '(' + fmt(x) + ') + ' + par(b1) + '(' + fmt(y) + ') = ' + fmt(c1) + '.');
    } },

    // ----- Polynomials & quadratics -----
    { id: 'poly-add', group: 'Polynomials & quadratics', name: 'Adding & subtracting polynomials', gen: function () {
      var p, q, r, sub = coin();
      do {
        p = [rnz(-6, 6), ri(-9, 9), ri(-9, 9)]; q = [rnz(-6, 6), ri(-9, 9), ri(-9, 9)];
        r = p.map(function (v, i) { return sub ? v - q[i] : v + q[i]; });
      } while (!r[0] && !r[1]);
      return Q('Simplify:  (' + poly(p) + ') ' + (sub ? '−' : '+') + ' (' + poly(q) + ')', expr(r, 'expanded'),
        (sub ? 'Flip the sign of every term in the second polynomial, then combine' : 'Combine') + ' like terms: x² terms, x terms, then numbers.', 'Like 3x^2 - 2x + 5');
    } },
    { id: 'foil', group: 'Polynomials & quadratics', name: 'Multiplying binomials', gen: function () {
      var a = pick([1, 1, 1, 2, 3]), b = rnz(-9, 9), c = pick([1, 1, 2]), d = rnz(-9, 9);
      return Q('Multiply:  (' + poly([a, b]) + ')(' + poly([c, d]) + ')', expr([a * c, a * d + b * c, b * d], 'expanded'),
        'FOIL. First: ' + poly([a * c, 0, 0]) + '. Outer: ' + poly([a * d, 0]) + '. Inner: ' + poly([b * c, 0]) + '. Last: ' + fmt(b * d) + '. Combine the middle terms.',
        'Like x^2 + 5x + 6');
    } },
    { id: 'square-binomial', group: 'Polynomials & quadratics', name: 'Squaring binomials', gen: function () {
      var a = pick([1, 1, 2, 3]), b = rnz(-9, 9);
      return Q('Expand:  (' + poly([a, b]) + ')²', expr([a * a, 2 * a * b, b * b], 'expanded'),
        '(p + q)² = p² + 2pq + q², not just p² + q². Here: ' + poly([a * a, 0, 0]) + ', 2 × ' + poly([a, 0]) + ' × ' + par(b) + ' = ' + poly([2 * a * b, 0]) + ', and ' + b * b + '.',
        'Like x^2 + 6x + 9');
    } },
    { id: 'factor-gcf', group: 'Polynomials & quadratics', name: 'Factoring out the GCF', gen: function () {
      var g = ri(2, 6), withX = coin(), p, q;
      do { p = ri(1, 7); q = rnz(-9, 9); } while (gcd(p, q) !== 1);
      var cs = withX ? [g * p, g * q, 0] : [g * p, g * q], out = g + (withX ? 'x' : '');
      var spec = expr(cs, 'gcf', out + '(' + poly([p, q]) + ')');
      spec.gcf = withX ? [g, 0] : [g];
      return Q('Factor:  ' + poly(cs), spec,
        'Every term shares ' + out + '. Divide each term by it: ' + out + '(' + poly([p, q]) + ').', 'Like 3x(2x + 5)');
    } },
    { id: 'factor-tri', group: 'Polynomials & quadratics', name: 'Factoring trinomials (x² + bx + c)', gen: function () {
      var p, q;
      do { p = rnz(-9, 9); q = rnz(-9, 9); } while (p + q === 0);
      return Q('Factor:  ' + poly([1, p + q, p * q]), expr([1, p + q, p * q], 'factored', '(' + poly([1, p]) + ')(' + poly([1, q]) + ')'),
        'Find two numbers that multiply to ' + fmt(p * q) + ' and add to ' + fmt(p + q) + ': ' + fmt(p) + ' and ' + fmt(q) + '.', 'Like (x + 2)(x - 3)');
    } },
    { id: 'factor-tri-a', group: 'Polynomials & quadratics', name: 'Factoring trinomials (ax² + bx + c)', gen: function () {
      var a = pick([2, 3, 5]), c = pick([1, 2, 3]), p, q;
      do { p = rnz(-7, 7); q = rnz(-7, 7); } while (gcd(a, p) !== 1 || gcd(c, q) !== 1 || a * q + p * c === 0);
      var cs = [a * c, a * q + p * c, p * q];
      return Q('Factor:  ' + poly(cs), expr(cs, 'factored', '(' + poly([a, p]) + ')(' + poly([c, q]) + ')'),
        'a × c = ' + fmt(a * c * p * q) + '. Two numbers that multiply to that and add to ' + fmt(cs[1]) + ': ' + fmt(a * q) + ' and ' + fmt(p * c) + '. Split the middle term into ' + poly([a * q, 0]) + ' and ' + poly([p * c, 0]) + ', then factor by grouping.',
        'Like (2x + 1)(x - 3)');
    } },
    { id: 'factor-dos', group: 'Polynomials & quadratics', name: 'Difference of squares', gen: function () {
      var a = pick([1, 1, 2, 3, 4, 5]), b;
      do { b = ri(1, 10); } while (gcd(a, b) !== 1);
      return Q('Factor:  ' + poly([a * a, 0, -b * b]), expr([a * a, 0, -b * b], 'factored', '(' + poly([a, -b]) + ')(' + poly([a, b]) + ')'),
        'p² − q² = (p − q)(p + q). Here p = ' + poly([a, 0]) + ' and q = ' + b + '.', 'Like (x - 3)(x + 3)');
    } },
    { id: 'quad-factor', group: 'Polynomials & quadratics', name: 'Solving quadratics by factoring', gen: function () {
      var p = rnz(-9, 9), q = rnz(-9, 9);
      return Q('Solve:  ' + poly([1, -(p + q), p * q]) + ' = 0', set([p, q]),
        'Factor: (' + poly([1, -p]) + ')(' + poly([1, -q]) + ') = 0. Set each factor to 0: x = ' + (p === q ? fmt(p) : fmt(p) + ' or x = ' + fmt(q)) + '.',
        'Separate answers with a comma');
    } },
    { id: 'quad-formula', group: 'Polynomials & quadratics', name: 'Quadratic formula', gen: function () {
      var a, b, c, D;
      do { a = ri(1, 3); b = ri(-9, 9); c = rnz(-9, 9); D = b * b - 4 * a * c; } while (D <= 0 || Math.sqrt(D) % 1 === 0);
      var r1 = (-b + Math.sqrt(D)) / (2 * a), r2 = (-b - Math.sqrt(D)) / (2 * a);
      return Q('Solve:  ' + poly([a, b, c]) + ' = 0', set([r1, r2], 0.011, 'x ≈ ' + fmt(round(r1, 2)) + ', ' + fmt(round(r2, 2))),
        'x = (−b ± √(b² − 4ac)) / 2a = (' + fmt(-b) + ' ± √' + D + ') / ' + 2 * a + '.', 'Nearest hundredth, separated by a comma');
    } },
    { id: 'vertex', group: 'Polynomials & quadratics', name: 'Vertex of a parabola', gen: function () {
      var a = rnz(-3, 3), h = ri(-5, 5), k = ri(-9, 9), cs = [a, -2 * a * h, a * h * h + k];
      return Q('Find the vertex of  y = ' + poly(cs), [lab('x =', num(h)), lab('y =', num(k))],
        'x = −b / 2a = ' + fmt(2 * a * h) + ' / ' + fmt(2 * a) + ' = ' + fmt(h) + '. Put that back in: y = ' + fmt(k) + '. Vertex (' + fmt(h) + ', ' + fmt(k) + ').');
    } },

    // ----- Geometry -----
    { id: 'area', group: 'Geometry', name: 'Area & perimeter', gen: function () {
      var a = ri(3, 20), b = ri(3, 20), h = ri(2, 15);
      switch (ri(0, 4)) {
        case 0: return Q('Find the area of a rectangle that is ' + a + ' by ' + b + '.', num(a * b), 'A = length × width = ' + a + ' × ' + b + ' = ' + a * b + '.');
        case 1: return Q('Find the perimeter of a rectangle that is ' + a + ' by ' + b + '.', num(2 * (a + b)), 'P = 2(length + width) = 2(' + a + ' + ' + b + ') = ' + 2 * (a + b) + '.');
        case 2: return Q('Find the area of a triangle with base ' + a + ' and height ' + h + '.', num(a * h / 2), 'A = ½ × base × height = ½ × ' + a + ' × ' + h + ' = ' + fmt(a * h / 2) + '.');
        case 3: return Q('Find the area of a trapezoid with bases ' + a + ' and ' + b + ' and height ' + h + '.', num((a + b) * h / 2), 'A = ½(b₁ + b₂)h = ½(' + a + ' + ' + b + ')(' + h + ') = ' + fmt((a + b) * h / 2) + '.');
        default: return Q('Find the area of a parallelogram with base ' + a + ' and height ' + h + '.', num(a * h), 'A = base × height = ' + a + ' × ' + h + ' = ' + a * h + '.');
      }
    } },
    { id: 'circles', group: 'Geometry', name: 'Circles', gen: function () {
      var r = ri(2, 15), useD = coin(), area = coin(), v = area ? Math.PI * r * r : 2 * Math.PI * r;
      return Q('A circle has a ' + (useD ? 'diameter of ' + 2 * r : 'radius of ' + r) + '. Find its ' + (area ? 'area' : 'circumference') + '.', tenth(v),
        (useD ? 'The radius is half the diameter: ' + r + '. ' : '') + (area ? 'A = πr² = π × ' + r + '² = ' + r * r + 'π' : 'C = 2πr = 2π × ' + r + ' = ' + 2 * r + 'π') + ' ≈ ' + fmt(round(v, 1)) + '.',
        'Nearest tenth');
    } },
    { id: 'angles', group: 'Geometry', name: 'Angles', gen: function () {
      var a = ri(20, 100), b, n;
      switch (ri(0, 4)) {
        case 0: b = ri(20, 150 - a); return Q('Two angles of a triangle are ' + a + '° and ' + b + '°. What is the third angle?', num(180 - a - b), 'Angles in a triangle add to 180°: 180 − ' + a + ' − ' + b + ' = ' + (180 - a - b) + '°.', 'In degrees');
        case 1: a = ri(10, 170); return Q('What is the supplement of a ' + a + '° angle?', num(180 - a), 'Supplementary angles add to 180°: 180 − ' + a + ' = ' + (180 - a) + '°.', 'In degrees');
        case 2: a = ri(5, 85); return Q('What is the complement of a ' + a + '° angle?', num(90 - a), 'Complementary angles add to 90°: 90 − ' + a + ' = ' + (90 - a) + '°.', 'In degrees');
        case 3: n = ri(5, 12); return Q('What is the sum of the interior angles of a ' + n + '-sided polygon?', num((n - 2) * 180), 'Sum = (n − 2) × 180° = ' + (n - 2) + ' × 180 = ' + (n - 2) * 180 + '°.', 'In degrees');
        default: n = pick([3, 4, 5, 6, 8, 9, 10, 12]); return Q('What is each interior angle of a regular ' + n + '-sided polygon?', num((n - 2) * 180 / n), 'The angles add to (' + n + ' − 2) × 180 = ' + (n - 2) * 180 + '°, split ' + n + ' ways: ' + (n - 2) * 180 / n + '°.', 'In degrees');
      }
    } },
    { id: 'pythagorean', group: 'Geometry', name: 'Pythagorean theorem', gen: function () {
      var T = pick(TRIPLES), k = pick([1, 1, 2, 3]), a = T[0] * k, b = T[1] * k, c = T[2] * k;
      switch (ri(0, 2)) {
        case 0: return Q('A right triangle has legs ' + a + ' and ' + b + '. How long is the hypotenuse?', num(c), 'c² = a² + b² = ' + a * a + ' + ' + b * b + ' = ' + c * c + ', so c = ' + c + '.');
        case 1: return Q('A right triangle has a leg of ' + a + ' and a hypotenuse of ' + c + '. How long is the other leg?', num(b), 'b² = c² − a² = ' + c * c + ' − ' + a * a + ' = ' + b * b + ', so b = ' + b + '.');
        default:
          var s;
          do { a = ri(2, 12); b = ri(2, 12); s = a * a + b * b; } while (Math.sqrt(s) % 1 === 0);
          return Q('A right triangle has legs ' + a + ' and ' + b + '. How long is the hypotenuse?', tenth(Math.sqrt(s)),
            'c² = ' + a * a + ' + ' + b * b + ' = ' + s + ', so c = √' + s + ' ≈ ' + fmt(round(Math.sqrt(s), 1)) + '.', 'Nearest tenth');
      }
    } },
    { id: 'volume', group: 'Geometry', name: 'Volume & surface area', gen: function () {
      var l = ri(2, 12), w = ri(2, 12), h = ri(2, 15), r = ri(2, 8), v;
      switch (ri(0, 4)) {
        case 0: return Q('Find the volume of a box that is ' + l + ' × ' + w + ' × ' + h + '.', num(l * w * h), 'V = lwh = ' + l * w * h + '.');
        case 1: return Q('Find the surface area of a box that is ' + l + ' × ' + w + ' × ' + h + '.', num(2 * (l * w + l * h + w * h)), 'SA = 2(lw + lh + wh) = 2(' + l * w + ' + ' + l * h + ' + ' + w * h + ') = ' + 2 * (l * w + l * h + w * h) + '.');
        case 2: v = Math.PI * r * r * h; return Q('Find the volume of a cylinder with radius ' + r + ' and height ' + h + '.', tenth(v), 'V = πr²h = π × ' + r * r + ' × ' + h + ' = ' + r * r * h + 'π ≈ ' + fmt(round(v, 1)) + '.', 'Nearest tenth');
        case 3: v = Math.PI * r * r * h / 3; return Q('Find the volume of a cone with radius ' + r + ' and height ' + h + '.', tenth(v), 'V = ⅓πr²h = ⅓ × π × ' + r * r + ' × ' + h + ' ≈ ' + fmt(round(v, 1)) + '.', 'Nearest tenth');
        default: r = ri(2, 9); v = 4 / 3 * Math.PI * r * r * r; return Q('Find the volume of a sphere with radius ' + r + '.', tenth(v), 'V = 4/3 πr³ = 4/3 × π × ' + r * r * r + ' ≈ ' + fmt(round(v, 1)) + '.', 'Nearest tenth');
      }
    } },
    { id: 'distance', group: 'Geometry', name: 'Distance formula', gen: function () {
      var x1 = ri(-8, 8), y1 = ri(-8, 8), dx, dy;
      if (coin()) { var T = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]); dx = T[0] * pick([-1, 1]); dy = T[1] * pick([-1, 1]); }
      else { dx = rnz(-9, 9); dy = rnz(-9, 9); }
      var s = dx * dx + dy * dy, d = Math.sqrt(s);
      return Q('Find the distance between (' + fmt(x1) + ', ' + fmt(y1) + ') and (' + fmt(x1 + dx) + ', ' + fmt(y1 + dy) + ').', tenth(d),
        'd = √((x₂ − x₁)² + (y₂ − y₁)²) = √(' + dx * dx + ' + ' + dy * dy + ') = √' + s + (d % 1 ? ' ≈ ' + fmt(round(d, 1)) : ' = ' + d) + '.', 'Nearest tenth');
    } },
    { id: 'midpoint', group: 'Geometry', name: 'Midpoint', gen: function () {
      var x1 = ri(-9, 9), y1 = ri(-9, 9), x2 = ri(-9, 9), y2 = ri(-9, 9);
      return Q('Find the midpoint of (' + fmt(x1) + ', ' + fmt(y1) + ') and (' + fmt(x2) + ', ' + fmt(y2) + ').', [lab('x =', num((x1 + x2) / 2)), lab('y =', num((y1 + y2) / 2))],
        'Average the x\'s and the y\'s: ((' + fmt(x1) + ' + ' + par(x2) + ')/2, (' + fmt(y1) + ' + ' + par(y2) + ')/2) = (' + fmt((x1 + x2) / 2) + ', ' + fmt((y1 + y2) / 2) + ').');
    } },
    { id: 'special-right', group: 'Geometry', name: 'Special right triangles', gen: function () {
      var s = ri(2, 12), hint = 'Exact (like 5√2) or nearest tenth', r = '45-45-90: sides are 1 : 1 : √2. 30-60-90: sides are 1 : √3 : 2. ';
      switch (ri(0, 4)) {
        case 0: return Q('A 45-45-90 triangle has legs of ' + s + '. How long is the hypotenuse?', num(s * Math.SQRT2, s + '√2', { tol: 0.05 }), r + 'Hypotenuse = leg × √2 = ' + s + '√2.', hint);
        case 1: return Q('A 45-45-90 triangle has a hypotenuse of ' + s + '√2. How long is each leg?', num(s, null, { tol: 0.05 }), r + 'Leg = hypotenuse ÷ √2 = ' + s + '.', hint);
        case 2: return Q('A 30-60-90 triangle has a short leg of ' + s + '. How long is the hypotenuse?', num(2 * s, null, { tol: 0.05 }), r + 'Hypotenuse = 2 × short leg = ' + 2 * s + '.', hint);
        case 3: return Q('A 30-60-90 triangle has a short leg of ' + s + '. How long is the long leg?', num(s * Math.sqrt(3), s + '√3', { tol: 0.05 }), r + 'Long leg = short leg × √3 = ' + s + '√3.', hint);
        default: return Q('A 30-60-90 triangle has a hypotenuse of ' + 2 * s + '. How long is the short leg?', num(s, null, { tol: 0.05 }), r + 'Short leg = hypotenuse ÷ 2 = ' + s + '.', hint);
      }
    } },

    // ----- Trigonometry -----
    { id: 'trig-ratios', group: 'Trigonometry', name: 'Trig ratios (SOH-CAH-TOA)', gen: function () {
      var T = pick(TRIPLES), a = T[0], b = T[1], c = T[2];
      if (coin()) { a = T[1]; b = T[0]; }
      var fn = pick(['sin', 'cos', 'tan']), ang = pick(['A', 'B']);
      var opp = ang === 'A' ? a : b, adj = ang === 'A' ? b : a;
      var r = { sin: [opp, c, 'opposite / hypotenuse'], cos: [adj, c, 'adjacent / hypotenuse'], tan: [opp, adj, 'opposite / adjacent'] }[fn];
      return Q('Right triangle ABC has its right angle at C. Side a = ' + a + ' is opposite angle A, side b = ' + b + ' is opposite angle B, and the hypotenuse is c = ' + c + '.\nFind ' + fn + ' ' + ang + '.',
        num(r[0] / r[1], r[0] + '/' + r[1], { frac: true }),
        'SOH-CAH-TOA: ' + fn + ' = ' + r[2] + ' = ' + r[0] + '/' + r[1] + '.', 'A fraction, like 3/5');
    } },
    { id: 'trig-side', group: 'Trigonometry', name: 'Finding a side with trig', gen: function () {
      var th = ri(15, 75), s = ri(4, 20);
      var pair = pick([['hypotenuse', 'opposite'], ['hypotenuse', 'adjacent'], ['adjacent', 'opposite'], ['adjacent', 'hypotenuse'], ['opposite', 'adjacent'], ['opposite', 'hypotenuse']]);
      var known = pair[0], find = pair[1], S = Math.sin(rad(th)), C = Math.cos(rad(th));
      var H = known === 'hypotenuse' ? s : known === 'opposite' ? s / S : s / C;
      var v = find === 'opposite' ? H * S : find === 'adjacent' ? H * C : H;
      var has = function (side) { return known === side || find === side; };
      var fn = has('hypotenuse') ? (has('opposite') ? 'sin' : 'cos') : 'tan';
      var top = fn === 'cos' ? 'adjacent' : 'opposite', bottom = fn === 'tan' ? 'adjacent' : 'hypotenuse';
      var desc = { opposite: 'side opposite the ' + th + '° angle', adjacent: 'side next to the ' + th + '° angle (not the hypotenuse)', hypotenuse: 'hypotenuse' };
      return Q('In a right triangle, one angle is ' + th + '°. The ' + desc[known] + ' is ' + s + '. How long is the ' + desc[find] + '?', tenth(v),
        'Use ' + fn + ' = ' + top + ' / ' + bottom + '. ' + (find === top ? top + ' = ' + s + ' × ' + fn + ' ' + th + '°' : bottom + ' = ' + s + ' ÷ ' + fn + ' ' + th + '°') + ' ≈ ' + fmt(round(v, 1)) + '.',
        'Nearest tenth');
    } },
    { id: 'trig-angle', group: 'Trigonometry', name: 'Finding an angle (inverse trig)', gen: function () {
      var fn = pick(['sin', 'cos', 'tan']), p, q, text;
      if (fn === 'tan') { p = ri(2, 20); q = ri(2, 20); text = 'the side opposite θ is ' + p + ' and the side next to θ is ' + q; }
      else { q = ri(8, 25); p = ri(2, q - 1); text = 'the side ' + (fn === 'sin' ? 'opposite' : 'next to') + ' θ is ' + p + ' and the hypotenuse is ' + q; }
      var v = deg(Math['a' + fn](p / q));
      return Q('In a right triangle, ' + text + '. Find θ.', tenth(v),
        fn + ' θ = ' + p + '/' + q + ', so θ = ' + fn + '⁻¹(' + p + '/' + q + ') ≈ ' + fmt(round(v, 1)) + '°.', 'Degrees, nearest tenth');
    } },
    { id: 'special-angles', group: 'Trigonometry', name: 'Exact values (special angles)', gen: function () {
      var fn = pick(['sin', 'cos', 'tan']), d = +pick(Object.keys(EXACT[fn]));
      return Q('Find the exact value of ' + fn + ' ' + d + '°.', num(trig(fn, d), EXACT[fn][d], { tol: 1e-3 }),
        'Use the special triangles: 30-60-90 has sides 1 : √3 : 2 and 45-45-90 has sides 1 : 1 : √2. ' + fn + ' ' + d + '° = ' + EXACT[fn][d] + '.', EXACT_HINT);
    } },
    { id: 'unit-circle', group: 'Trigonometry', name: 'Unit circle', gen: function () {
      var fn, d;
      do { fn = pick(['sin', 'cos', 'tan']); d = pick([120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]); } while (fn === 'tan' && d === 270);
      var ref = d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d, v = trig(fn, d);
      var show = Math.abs(v) < 1e-9 ? '0' : (v < 0 ? '−' : '') + EXACT[fn][ref];
      var quad = d < 180 ? 'II' : d < 270 ? 'III' : 'IV';
      var why = d % 90 === 0
        ? piStr(d, 180) + ' is the point (' + fmt(Math.round(Math.cos(rad(d)))) + ', ' + fmt(Math.round(Math.sin(rad(d)))) + ') on the unit circle (x = cos, y = sin).'
        : 'Reference angle ' + piStr(ref, 180) + ' (' + ref + '°). In Quadrant ' + quad + ', ' + fn + ' is ' + (v < 0 ? 'negative' : 'positive') + '.';
      return Q('Find the exact value of ' + fn + '(' + piStr(d, 180) + ').', num(v, show, { tol: 1e-3 }), why + ' Answer: ' + show + '.', EXACT_HINT);
    } },
    { id: 'radians', group: 'Trigonometry', name: 'Degrees ↔ radians', gen: function () {
      var d = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]);
      if (coin()) {
        return Q('Convert ' + d + '° to radians.', num(rad(d), piStr(d, 180), { tol: 1e-3 }),
          'Multiply by π/180: ' + d + ' × π/180 = ' + piStr(d, 180) + '.', 'Like 3π/4 (type π or pi)');
      }
      return Q('Convert ' + piStr(d, 180) + ' radians to degrees.', num(d), 'Multiply by 180/π: ' + piStr(d, 180) + ' × 180/π = ' + d + '°.', 'In degrees');
    } },
    { id: 'law-sines', group: 'Trigonometry', name: 'Law of sines', gen: function () {
      var A = ri(30, 80), a, b, v;
      if (coin()) {
        var B = ri(25, 160 - A);
        a = ri(5, 25); v = a * Math.sin(rad(B)) / Math.sin(rad(A));
        return Q('In triangle ABC, A = ' + A + '°, B = ' + B + '°, and a = ' + a + '. Find b.', tenth(v),
          'a / sin A = b / sin B, so b = ' + a + ' × sin ' + B + '° ÷ sin ' + A + '° ≈ ' + fmt(round(v, 1)) + '.', 'Nearest tenth');
      }
      a = ri(10, 25); b = ri(4, a - 1);
      var s = b * Math.sin(rad(A)) / a; v = deg(Math.asin(s));
      return Q('In triangle ABC, A = ' + A + '°, a = ' + a + ', and b = ' + b + '. Find angle B.', tenth(v),
        'sin B / b = sin A / a, so sin B = ' + b + ' × sin ' + A + '° ÷ ' + a + ' ≈ ' + s.toFixed(4) + '. B = sin⁻¹(' + s.toFixed(4) + ') ≈ ' + fmt(round(v, 1)) + '°.', 'Degrees, nearest tenth');
    } },
    { id: 'law-cosines-side', group: 'Trigonometry', name: 'Law of cosines (find a side)', gen: function () {
      var b = ri(4, 20), c = ri(4, 20), A = ri(20, 140), a2 = b * b + c * c - 2 * b * c * Math.cos(rad(A)), a = Math.sqrt(a2);
      return Q('In triangle ABC, b = ' + b + ', c = ' + c + ', and A = ' + A + '°. Find a.', tenth(a),
        'a² = b² + c² − 2bc·cos A = ' + b * b + ' + ' + c * c + ' − ' + 2 * b * c + ' × cos ' + A + '° ≈ ' + a2.toFixed(2) + ', so a ≈ ' + fmt(round(a, 1)) + '.', 'Nearest tenth');
    } },
    { id: 'law-cosines-angle', group: 'Trigonometry', name: 'Law of cosines (find an angle)', gen: function () {
      var a = ri(4, 20), b = ri(4, 20), c = ri(Math.abs(a - b) + 1, a + b - 1);
      var cosC = (a * a + b * b - c * c) / (2 * a * b), C = deg(Math.acos(cosC));
      return Q('A triangle has sides a = ' + a + ', b = ' + b + ', and c = ' + c + '. Find angle C.', tenth(C),
        'cos C = (a² + b² − c²) / 2ab = (' + a * a + ' + ' + b * b + ' − ' + c * c + ') / ' + 2 * a * b + ' ≈ ' + cosC.toFixed(4) + '. C = cos⁻¹(' + cosC.toFixed(4) + ') ≈ ' + fmt(round(C, 1)) + '°.',
        'Degrees, nearest tenth');
    } },
    { id: 'trig-area', group: 'Trigonometry', name: 'Triangle area (½ab sin C)', gen: function () {
      var a = ri(4, 20), b = ri(4, 20), C = ri(20, 150), v = a * b * Math.sin(rad(C)) / 2;
      return Q('A triangle has sides a = ' + a + ' and b = ' + b + ' with angle C = ' + C + '° between them. Find its area.', tenth(v),
        'Area = ½ab·sin C = ½ × ' + a + ' × ' + b + ' × sin ' + C + '° ≈ ' + fmt(round(v, 1)) + '.', 'Nearest tenth');
    } },
    { id: 'trig-identity', group: 'Trigonometry', name: 'One trig ratio from another', gen: function () {
      var T = pick(TRIPLES), opp = T[0], adj = T[1], hyp = T[2];
      if (coin()) { opp = T[1]; adj = T[0]; }
      var quad = ri(1, 4), sS = quad <= 2 ? 1 : -1, cS = quad === 1 || quad === 4 ? 1 : -1;
      var vals = { sin: [sS * opp, hyp], cos: [cS * adj, hyp], tan: [sS * cS * opp, adj] };
      var given = coin() ? 'sin' : 'cos', find = pick(given === 'sin' ? ['cos', 'tan'] : ['sin', 'tan']);
      var names = ['', 'I', 'II', 'III', 'IV'], g = vals[given], f = vals[find];
      return Q('If ' + given + ' θ = ' + frac(g[0], g[1]) + ' and θ is in Quadrant ' + names[quad] + ', find ' + find + ' θ.',
        num(f[0] / f[1], frac(f[0], f[1]), { frac: true }),
        'Draw a right triangle with sides ' + opp + ', ' + adj + ', ' + hyp + ' (' + opp + '² + ' + adj + '² = ' + hyp + '²). In Quadrant ' + names[quad] + ', sin is ' + (sS > 0 ? 'positive' : 'negative') + ' and cos is ' + (cS > 0 ? 'positive' : 'negative') + '.',
        'A fraction, like -3/5');
    } }
  ];

  // ---------- Reading answers ----------
  // Accepts things like "3/4", "1 1/2", "2√3", "sqrt(3)/2", "5pi/6", "x^2 + 3x", "(x+2)(x-3)".
  function Retry(msg) { this.message = msg; }

  var SUP_REV = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function clean(s) {
    return s.toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/[×·∙⋅]/g, '*')
      .replace(/÷/g, '/')
      .replace(/[\[{]/g, '(').replace(/[\]}]/g, ')')
      .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, function (m) { return '^' + m.replace(/./g, function (c) { return SUP_REV[c]; }); })
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=')
      .trim();
  }

  function tokenize(s) {
    var out = [], m;
    while ((s = s.replace(/^\s+/, ''))) {
      if ((m = s.match(/^(\d+\.?\d*|\.\d+)/))) out.push({ t: 'n', v: parseFloat(m[1]) });
      else if ((m = s.match(/^(sqrt|pi|[a-z])/))) out.push(m[1].length > 1 ? { t: m[1] } : { t: 'v', v: m[1] });
      else if ((m = s.match(/^[-+*/^()]/))) out.push({ t: m[0] });
      else throw new Error('bad character');
      s = s.slice(m[0].length);
    }
    return out;
  }

  // Recursive-descent parser → tree of { op, a, b } / { op: 'n', v } / { op: 'x' }.
  // Implicit multiplication: 2x, 3(x+1), (x+1)(x-2), 2√3, 5pi.
  function parse(str, allowX) {
    var toks = tokenize(str), pos = 0;
    function peek() { return toks[pos]; }
    function expr() {
      var node = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        var op = toks[pos++].t;
        node = { op: op, a: node, b: term() };
      }
      return node;
    }
    function term() {
      var node = unary();
      for (;;) {
        var tk = peek();
        if (tk && (tk.t === '*' || tk.t === '/')) { pos++; node = { op: tk.t, a: node, b: unary() }; }
        else if (tk && (tk.t === 'v' || tk.t === 'pi' || tk.t === 'sqrt' || tk.t === '(')) node = { op: '*', a: node, b: power() };
        else return node;
      }
    }
    function unary() {
      if (peek() && peek().t === '-') { pos++; return { op: 'neg', a: unary() }; }
      if (peek() && peek().t === '+') { pos++; return unary(); }
      return power();
    }
    function power() {
      var base = atom();
      if (peek() && peek().t === '^') { pos++; return { op: '^', a: base, b: unary() }; }
      return base;
    }
    function atom() {
      var tk = toks[pos++];
      if (!tk) throw new Error('unexpected end');
      if (tk.t === 'n') return { op: 'n', v: tk.v };
      if (tk.t === 'pi') return { op: 'n', v: Math.PI };
      if (tk.t === 'v') { if (!allowX || tk.v !== 'x') throw new Error('unexpected letter'); return { op: 'x' }; }
      if (tk.t === 'sqrt') return { op: 'sqrt', a: atom() };
      if (tk.t === '(') {
        var inner = expr();
        if (!peek() || peek().t !== ')') throw new Error('missing )');
        pos++;
        return inner;
      }
      throw new Error('unexpected ' + tk.t);
    }
    var tree = expr();
    if (pos !== toks.length) throw new Error('extra input');
    return tree;
  }

  function evalTree(n, x) {
    switch (n.op) {
      case 'n': return n.v;
      case 'x': return x;
      case 'neg': return -evalTree(n.a, x);
      case 'sqrt': return Math.sqrt(evalTree(n.a, x));
      case '+': return evalTree(n.a, x) + evalTree(n.b, x);
      case '-': return evalTree(n.a, x) - evalTree(n.b, x);
      case '*': return evalTree(n.a, x) * evalTree(n.b, x);
      case '/': return evalTree(n.a, x) / evalTree(n.b, x);
      case '^': return Math.pow(evalTree(n.a, x), evalTree(n.b, x));
    }
  }
  function countTerms(n) {
    if (n.op === '+' || n.op === '-') return countTerms(n.a) + countTerms(n.b);
    if (n.op === 'neg') return countTerms(n.a);
    return 1;
  }

  function close(a, b, tol) { return Math.abs(a - b) <= (tol != null ? tol : 1e-6 * Math.max(1, Math.abs(b))); }

  // A plain number answer: "12", "-3/4", "1 1/2", "2√3", "$4.50", "35%", "x = 7"
  function numVal(s) {
    s = s.replace(/^[^=<>]*=\s*/, '')
      .replace(/[$%°]|degrees?|percent/g, '')
      .replace(/(\d),(?=\d{3}\b)/g, '$1')
      .replace(/\s*(units?|cm|mm|in|ft|feet|inches|meters?|miles|mph|m)(\^?[23])?\s*$/, '')
      .trim();
    var m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) return (m[1] ? -1 : 1) * (+m[2] + m[3] / m[4]);
    var v = evalTree(parse(s, false), 0);
    if (!isFinite(v)) throw new Error('not a number');
    return v;
  }

  var XS = [-2.3, -0.7, 0.45, 1.9, 3.1];
  function polyAt(cs, x) { return cs.reduce(function (acc, c) { return acc * x + c; }, 0); }
  function samePoly(tree, cs) {
    return XS.every(function (x) { return close(evalTree(tree, x), polyAt(cs, x)); });
  }

  var CHECK = {
    num: function (spec, s) {
      var v = numVal(s);
      var ok = close(v, spec.value, spec.tol);
      if (spec.frac) {
        if (/\.\d/.test(s)) {
          if (Math.abs(v - spec.value) < 1e-3) throw new Retry('Write it as a fraction, like 3/4.');
          return false;
        }
        if (!ok) return false;
        (s.match(/\d+\s*\/\s*\d+/g) || []).forEach(function (f) {
          var p = f.split('/');
          if (gcd(+p[0], +p[1]) > 1) throw new Retry('Right value, but simplify the fraction.');
        });
        var mx = s.match(/^-?\d+\s+(\d+)\s*\/\s*(\d+)$/);
        if (mx && +mx[1] >= +mx[2]) throw new Retry('Right value, but simplify the fraction.');
      }
      return ok;
    },
    set: function (spec, s) {
      var parts = s.replace(/[a-z]\s*=/g, ' ').split(/,|;|\bor\b|\band\b/)
        .map(function (p) { return p.trim(); }).filter(Boolean);
      if (!parts.length) throw new Retry('Type the answers separated by commas.');
      var vals = [];
      parts.map(numVal).forEach(function (v) {
        if (!vals.some(function (w) { return close(v, w, spec.tol); })) vals.push(v);
      });
      return vals.length === spec.values.length && spec.values.every(function (e) {
        return vals.some(function (v) { return close(v, e, spec.tol); });
      });
    },
    ineq: function (spec, s) {
      s = s.replace(/\s+/g, '');
      var m = s.match(/^x(<=|>=|<|>)(.+)$/), op, rhs;
      if (m) { op = m[1]; rhs = m[2]; }
      else if ((m = s.match(/^(.+?)(<=|>=|<|>)x$/))) { op = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[m[2]]; rhs = m[1]; }
      else throw new Retry('Write it like x > 3 or x <= -2.');
      return op === spec.op && close(numVal(rhs), spec.value);
    },
    expr: function (spec, s) {
      s = s.replace(/^[a-z](\(x\))?\s*=\s*/, '');
      var tree = parse(s, true);
      if (!samePoly(tree, spec.coeffs)) return false;
      var parens = /\(/.test(s.replace(/sqrt\(/g, ''));
      var nonzero = spec.coeffs.filter(function (c) { return c; }).length;
      if (spec.form === 'expanded') {
        if (parens) throw new Retry('Right idea, but multiply it all out (no parentheses).');
        if (countTerms(tree) > Math.max(1, nonzero)) throw new Retry('Right idea, but combine like terms.');
      } else if (spec.form === 'monomial') {
        if (parens || countTerms(tree) > 1 || /\//.test(s) || (s.match(/x/g) || []).length > 1) throw new Retry('Right idea, but simplify it to a single term.');
      } else if (spec.form === 'factored') {
        var root = tree;
        while (root.op === 'neg') root = root.a;
        if (root.op !== '*' && root.op !== '^') throw new Retry('That\'s equal, but write it in factored form, like (x + 2)(x − 3).');
      } else if (spec.form === 'gcf') {
        var m = s.replace(/\s+/g, '').match(/^(-?[\d.]*x?(?:\^\d+)?)\*?\((.+)\)$/);
        if (!m) throw new Retry('Write it as the common factor times parentheses, like 3x(2x + 5).');
        var outer = m[1] === '' ? 1 : m[1] === '-' ? -1 : evalTree(parse(m[1], true), 2.5);
        if (!close(Math.abs(outer), polyAt(spec.gcf, 2.5))) throw new Retry('That\'s equal, but pull out the greatest common factor (number and x).');
      }
      return true;
    },
    primes: function (spec, s) {
      var product = 1, allPrime = true;
      s.replace(/\s+/g, '').split('*').forEach(function (f) {
        var m = f.match(/^(\d+)(?:\^(\d+))?$/);
        if (!m) throw new Retry('Write it like 2^3 * 5.');
        if (!isPrime(+m[1])) allPrime = false;
        product *= Math.pow(+m[1], m[2] ? +m[2] : 1);
      });
      if (product === spec.value && !allPrime) throw new Retry('That multiplies out right, but every factor must be prime.');
      return product === spec.value;
    },
    radical: function (spec, s) {
      var m = s.replace(/\s+/g, '').match(/^(\d*)\*?sqrt\(?(\d+)\)?$/);
      if (!m) {
        if (close(numVal(s), spec.value, 0.01)) throw new Retry('Leave it in simplified radical form, like 3√2.');
        return false;
      }
      var k = m[1] ? +m[1] : 1, r = +m[2];
      if (!close(k * Math.sqrt(r), spec.value)) return false;
      for (var i = 2; i * i <= r; i++) if (r % (i * i) === 0) throw new Retry('Right value, but the radical can be simplified more.');
      return true;
    },
    sci: function (spec, s) {
      var t = s.replace(/\s+/g, '').replace(/(\d)(?:x|\*)10\^\(?([+-]?\d+)\)?$/, '$1e$2');
      var m = t.match(/^(-?\d+(?:\.\d+)?)e([+-]?\d+)$/);
      if (!m) {
        if (close(numVal(s), spec.value, Math.abs(spec.value) * 1e-9)) throw new Retry('Write it in scientific notation, like 4.5 x 10^6.');
        return false;
      }
      var c = +m[1], v = Number(m[1] + 'e' + m[2]);
      if (!close(v, spec.value, Math.abs(spec.value) * 1e-9)) return false;
      if (Math.abs(c) < 1 || Math.abs(c) >= 10) throw new Retry('Right value, but the first number must be at least 1 and less than 10.');
      return true;
    },
    word: function (spec, s) {
      var w = s.replace(/[^a-z]/g, '');
      if (spec.options.indexOf(w) < 0) throw new Retry('Answer with one of: ' + spec.options.join(', ') + '.');
      return w === spec.value;
    }
  };

  // → { ok: true|false } or { retry: 'message' }
  function checkField(spec, raw) {
    var s = clean(raw);
    if (!s) return { retry: 'Type an answer, or press "I don\'t know".' };
    try {
      return { ok: CHECK[spec.kind](spec, s) };
    } catch (err) {
      if (err instanceof Retry) return { retry: err.message };
      return { retry: 'Couldn\'t read that. Use numbers, x, + − * / ^, parentheses, √ and π.' };
    }
  }

  // ---------- State ----------
  // hp.math: { needs: [{ id, misses, streak }] (most recently missed first), mode }
  // mode: 'all' (every topic), 'needs' (only Needs practice), or one topic id.
  var CLEAR_STREAK = 3;
  var byId = {};
  TOPICS.forEach(function (t) { byId[t.id] = t; });

  var state = load('hp.math', { needs: [], mode: 'all' });
  state.needs = (state.needs || []).filter(function (n) { return byId[n.id]; });
  if (state.mode !== 'all' && state.mode !== 'needs' && !byId[state.mode]) state.mode = 'all';

  var current = null, lastTopic = null, answered = false, lastInput = null;
  var score = { right: 0, total: 0 };

  function findNeed(id) { return state.needs.filter(function (n) { return n.id === id; })[0]; }
  function removeNeed(id) { state.needs = state.needs.filter(function (n) { return n.id !== id; }); }

  // Correct answers count toward clearing a topic; misses (re)add it at the top.
  function record(id, ok) {
    var e = findNeed(id);
    var note = '', fx = null;
    var list = $('m-needs'), row = list.querySelector('[data-key="' + id + '"]');
    var rowWas = row && row.getBoundingClientRect();
    if (ok) {
      if (e) {
        e.streak++;
        if (e.streak >= CLEAR_STREAK) { removeNeed(id); note = 'Cleared from Needs practice!'; fx = 'cleared'; }
        else { note = e.streak + ' of ' + CLEAR_STREAK + ' in a row to clear it from Needs practice.'; fx = 'dot'; }
      }
    } else {
      removeNeed(id);
      e = e || { id: id, misses: 0, streak: 0 };
      e.misses++;
      e.streak = 0;
      state.needs.unshift(e);
      note = 'Added to Needs practice.';
      fx = 'added';
    }
    save('hp.math', state);
    J.flip(list, renderNeeds);
    updateTopics();
    if (fx) {
      J.needs(fx, fx === 'cleared' ? rowWas : list.querySelector('[data-key="' + id + '"]'),
        { streak: e.streak, empty: !state.needs.length });
    }
    return note;
  }

  // ---------- Rendering ----------
  function pickTopic() {
    var pool = state.mode === 'all' ? TOPICS
      : state.mode === 'needs' ? state.needs.map(function (n) { return byId[n.id]; })
      : [byId[state.mode]];
    var fresh = pool.filter(function (t) { return t !== lastTopic; });
    return pick(fresh.length ? fresh : pool);
  }

  function newQuestion(focus) {
    if (state.mode === 'needs' && !state.needs.length) { state.mode = 'all'; save('hp.math', state); updateTopics(); }
    var topic = pickTopic();
    lastTopic = topic;
    current = topic.gen();
    current.topic = topic;
    answered = false;
    renderQuestion(focus);
    J.question([$('m-mode'), $('m-question'), $('m-fields'), $('m-form').querySelector('.m-actions')], focus);
  }

  function makeField(spec) {
    var wrap = document.createElement('label');
    wrap.className = 'm-field';
    if (spec.label) {
      var l = document.createElement('span');
      l.textContent = spec.label;
      wrap.append(l);
    }
    var input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('aria-label', spec.label ? 'Answer ' + spec.label : 'Answer');
    input.placeholder = 'Answer';
    wrap.append(input);
    return wrap;
  }

  function renderQuestion(focus) {
    var t = current.topic;
    $('m-mode').textContent = (state.mode === 'all' ? 'Review all' : state.mode === 'needs' ? 'Needs practice' : t.group) + ' · ' + t.name;
    $('m-question').textContent = current.text;

    var box = $('m-fields');
    box.textContent = '';
    current.fields.forEach(function (spec) { box.append(makeField(spec)); });
    lastInput = box.querySelector('input');

    setHint(current.hint);
    $('m-feedback').hidden = true;
    $('m-check').hidden = $('m-idk').hidden = false;
    $('m-next').hidden = true;
    $('m-keys').hidden = false;
    if (focus) lastInput.focus();
  }

  function setHint(msg, isError) {
    var el = $('m-hint');
    el.textContent = msg || '';
    el.classList.toggle('error', !!isError);
  }

  // ---------- Step-by-step explanations ----------
  // Explanations stay plain strings. whySteps cuts one into steps at display
  // time, always at a space, so steps.join(' ') is the original text.
  var STEP_START_MS = 350;

  // Cut text at the spaces where test(before, after) is true, skipping anything inside parentheses.
  function splitWhere(text, test) {
    var parts = [], start = 0, depth = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ' ' && depth <= 0 && test(text.slice(start, i), text.slice(i + 1))) {
        parts.push(text.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(text.slice(start));
    return parts;
  }
  function endsSentence(before) { return /[.!?]$/.test(before); }
  function endsClause(before, after) {
    if (/\S:$/.test(before)) return before.split(' ').length >= 3 && after.length >= 8; // not "Base: 100" or "1 : 1"
    if (/,$/.test(before) && /^(so|then) /.test(after)) return true;
    return /^and /.test(after) && before.indexOf('=') >= 0 && after.indexOf('=') >= 0;
  }
  // "A = ½bh = ½ × 6 × 2 = 6" gets one row per "=", keeping "A = ½bh" together.
  // "x = 1 or x = 2" isn't a chain, it's two separate equations.
  function chainSteps(clause) {
    var parts = splitWhere(clause, function (before, after) { return /^[=≈] /.test(after); });
    if (parts.length < 3 || / (gives|or) /.test(clause)) return [clause];
    return [parts[0] + ' ' + parts[1]].concat(parts.slice(2));
  }

  function whySteps(why) {
    var steps = [];
    splitWhere(why, endsSentence).forEach(function (sentence) {
      splitWhere(sentence, endsClause).forEach(function (clause) {
        steps.push.apply(steps, chainSteps(clause));
      });
    });
    return steps;
  }

  // Longer steps stay up longer so there's time to read them.
  function stepMs(text) { return Math.min(3200, 900 + text.length * 35); }

  // Builds the explanation for a feedback box. It plays by itself once it's in the
  // page. Every row is there from the start, so the box doesn't change size.
  function whyPlayer(why, nextBtn) {
    var steps = whySteps(why);
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (steps.length < 2 || still) {
      var plain = document.createElement('p');
      plain.className = 'm-why';
      plain.textContent = why;
      return plain;
    }

    var box = document.createElement('div');
    box.className = 'm-why m-steps playing';
    var rows = steps.map(function (text) {
      var row = document.createElement('p');
      row.className = /^[=≈] /.test(text) ? 'm-step m-step-cont' : 'm-step';
      row.textContent = text;
      box.append(row);
      return row;
    });
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link-btn m-replay';
    box.append(btn);

    var at = 0, timer = null;
    function reset(shown) {
      clearTimeout(timer);
      rows.forEach(function (row) {
        row.classList.remove('now');
        row.classList.toggle('shown', shown);
      });
    }
    function finish() {
      reset(true);
      box.classList.remove('playing');
      btn.textContent = '↻ Replay';
    }
    function advance() {
      // Moved on, or the section was closed: leave it fully shown.
      if (!box.isConnected || box.closest('[hidden]')) { finish(); return; }
      if (at === rows.length) { J.stepsDone(at); finish(); return; }
      if (at) rows[at - 1].classList.remove('now');
      rows[at].classList.add('shown', 'now');
      J.step(at);
      timer = setTimeout(advance, stepMs(steps[at]));
      at++;
    }
    function play() {
      reset(false);
      at = 0;
      box.classList.add('playing');
      btn.textContent = 'Show all';
      timer = setTimeout(advance, STEP_START_MS);
    }
    btn.addEventListener('click', function () {
      if (box.classList.contains('playing')) finish(); else play();
      nextBtn.focus({ preventScroll: true }); // Enter keeps meaning "next question"
    });
    play();
    return box;
  }

  function submit(idk) {
    if (answered) return;
    var inputs = $('m-fields').querySelectorAll('input');
    var result = idk ? 'idk' : 'right', oks = [];
    if (!idk) {
      for (var i = 0; i < current.fields.length; i++) {
        var r = checkField(current.fields[i], inputs[i].value);
        if (r.retry) { setHint(r.retry, true); inputs[i].focus(); J.retry(inputs[i], $('m-hint')); return; }
        if (!r.ok) result = 'wrong';
        oks.push(r.ok);
      }
    }
    answered = true;
    score.total++;
    if (result === 'right') score.right++;
    var note = record(current.topic.id, result === 'right');

    inputs.forEach(function (inp) { inp.readOnly = true; });
    var answer = current.fields.map(function (f) { return (f.label ? f.label + ' ' : '') + f.show; }).join(',  ');
    var fb = $('m-feedback');
    fb.dataset.result = result;
    fb.textContent = '';
    [
      ['m-verdict', result === 'right' ? '✓ Correct!' : result === 'wrong' ? '✗ Not quite.' : 'Here\'s how it works.'],
      ['m-answer', 'Answer: ' + answer],
      ['m-why', current.why],
      ['m-note', note]
    ].forEach(function (row) {
      if (!row[1]) return;
      if (row[0] === 'm-why') { fb.append(whyPlayer(row[1], $('m-next'))); return; }
      var p = document.createElement('p');
      p.className = row[0];
      p.textContent = row[1];
      fb.append(p);
    });
    fb.hidden = false;
    setHint('');
    $('m-check').hidden = $('m-idk').hidden = true;
    $('m-keys').hidden = true;
    $('m-next').hidden = false;
    $('m-next').focus();
    J.answer({
      id: 'm', card: $('m-main').closest('.card'), inputs: Array.prototype.slice.call(inputs), oks: oks,
      result: result, feedback: fb, score: $('m-score'),
      showScore: function () { $('m-score').textContent = score.right + '/' + score.total + ' correct'; }
    });
  }

  function renderNeeds() {
    var list = $('m-needs');
    list.textContent = '';
    state.needs.forEach(function (n) {
      var t = byId[n.id];
      var li = document.createElement('li');
      li.dataset.key = n.id;

      var name = document.createElement('button');
      name.type = 'button';
      name.className = 'm-need-name ghost';
      name.textContent = t.name;
      name.title = 'Practice ' + t.name;
      name.addEventListener('click', function () { setMode(n.id); });

      var streak = document.createElement('span');
      streak.className = 'm-streak';
      streak.textContent = '●'.repeat(n.streak) + '○'.repeat(CLEAR_STREAK - n.streak);
      streak.title = n.streak + ' of ' + CLEAR_STREAK + ' correct in a row to clear';

      var tag = document.createElement('span');
      tag.className = 'tag miss';
      tag.textContent = 'missed ' + n.misses + '×';

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon-btn';
      del.setAttribute('aria-label', 'Remove ' + t.name);
      del.textContent = '×';
      del.addEventListener('click', function () {
        removeNeed(n.id);
        save('hp.math', state);
        J.flip($('m-needs'), renderNeeds);
        updateTopics();
      });

      li.append(name, streak, tag, del);
      list.append(li);
    });
    $('m-needs-empty').hidden = state.needs.length > 0;
    $('m-weak').hidden = !state.needs.length;
    $('m-weak').textContent = 'Practice these (' + state.needs.length + ')';
  }

  var chips = {};
  function buildTopics() {
    var box = $('m-topic-list'), groups = {};
    TOPICS.forEach(function (t) {
      if (!groups[t.group]) {
        var g = document.createElement('div');
        g.className = 'm-group';
        var h = document.createElement('h4');
        h.textContent = t.group;
        var wrap = document.createElement('div');
        wrap.className = 'chips';
        g.append(h, wrap);
        box.append(g);
        groups[t.group] = wrap;
      }
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip ghost';
      chip.textContent = t.name;
      chip.addEventListener('click', function () { setMode(t.id); });
      groups[t.group].append(chip);
      chips[t.id] = chip;
    });
    $('m-topic-count').textContent = TOPICS.length + ' topics';
  }

  function updateTopics() {
    TOPICS.forEach(function (t) {
      chips[t.id].classList.toggle('active', state.mode === t.id);
      chips[t.id].classList.toggle('weak', !!findNeed(t.id));
    });
    $('m-all').classList.toggle('active', state.mode === 'all');
    $('m-weak').classList.toggle('active', state.mode === 'needs');
  }

  function setMode(mode) {
    state.mode = mode;
    save('hp.math', state);
    lastTopic = null;
    updateTopics();
    newQuestion(true);
    $('m-main').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Symbol keys insert into the last focused answer box
  function insertSymbol(sym) {
    if (!lastInput || answered) return;
    var i = lastInput, start = i.selectionStart != null ? i.selectionStart : i.value.length, end = i.selectionEnd != null ? i.selectionEnd : start;
    i.value = i.value.slice(0, start) + sym + i.value.slice(end);
    i.focus();
    i.setSelectionRange(start + sym.length, start + sym.length);
  }

  // ---------- Events ----------
  $('m-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (answered) newQuestion(true);
    else submit(false);
  });
  $('m-idk').addEventListener('click', function () { submit(true); });
  $('m-all').addEventListener('click', function () { setMode('all'); });
  $('m-weak').addEventListener('click', function () { setMode('needs'); });
  $('m-fields').addEventListener('focusin', function (e) { if (e.target.tagName === 'INPUT') lastInput = e.target; });
  $('m-keys').addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus in the answer box
  $('m-keys').addEventListener('click', function (e) {
    var key = e.target.closest('button');
    if (key) insertSymbol(key.dataset.sym || key.textContent);
  });

  // Shared with study.js
  window.hpMath = {
    load: load, save: save, ri: ri, rnz: rnz, pick: pick, coin: coin, gcd: gcd, round: round,
    fmt: fmt, frac: frac, poly: poly, Q: Q, num: num, fracAns: fracAns, tenth: tenth, lab: lab,
    TRIPLES: TRIPLES, topic: function (id) { return byId[id]; }, checkField: checkField, makeField: makeField,
    whySteps: whySteps, whyPlayer: whyPlayer
  };

  // ---------- Init ----------
  buildTopics();
  renderNeeds();
  updateTopics();
  newQuestion(false);
})();
