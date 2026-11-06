// Sound and visual effects for Math practice and Study. Every sound is
// synthesized with Web Audio and every particle is drawn on one canvas, so there
// are no asset files. math.js and study.js call the scene functions on
// window.hpJuice, which means this file must load before them.
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function still() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  // ---------- Sound ----------
  // hp.sfx: false when muted. The context is created on the first sound, which
  // always follows a click or key press, so browsers let it start.
  var soundOn = true;
  try { soundOn = localStorage.getItem('hp.sfx') !== 'false'; } catch (e) { /* ignore */ }

  var ac = null, bus = null, send = null, hiss = null;

  function startAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    var comp = ac.createDynamicsCompressor();
    comp.connect(ac.destination);
    bus = ac.createGain();
    bus.gain.value = 0.55;
    bus.connect(comp);

    // A short generated room, so the sounds don't feel dry
    var len = Math.floor(ac.sampleRate * 0.9), room = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = room.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    var verb = ac.createConvolver();
    verb.buffer = room;
    send = ac.createGain();
    send.gain.value = 0.16;
    send.connect(verb);
    verb.connect(bus);

    hiss = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var h = hiss.getChannelData(0);
    for (var j = 0; j < h.length; j++) h[j] = Math.random() * 2 - 1;
    return true;
  }

  function audioReady() {
    if (!soundOn || document.hidden) return false; // step timers keep running in a hidden tab
    if (!ac && !startAudio()) return false;
    if (ac.state === 'suspended') ac.resume();
    return true;
  }

  function envelope(g, t, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // o: at (delay), dur, vol, type, to (glide to this frequency), attack, dry (no room)
  function tone(freq, o) {
    o = o || {};
    var t = ac.currentTime + (o.at || 0), dur = o.dur || 0.15;
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    envelope(g, t, o.vol || 0.2, o.attack || 0.004, dur);
    osc.connect(g);
    g.connect(bus);
    if (!o.dry) g.connect(send);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // o: at, dur, vol, filter (type), freq, to (sweep the filter here), q, attack
  function noise(o) {
    var t = ac.currentTime + (o.at || 0), dur = o.dur || 0.1;
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = hiss;
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q || 1;
    envelope(g, t, o.vol || 0.1, o.attack || 0.003, dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    g.connect(send);
    src.start(t, Math.random() * 0.8, dur + 0.02);
  }

  // A mallet note: the fundamental plus two quick overtones
  function bell(freq, o) {
    o = o || {};
    var at = o.at || 0, vol = o.vol || 0.18, dur = o.dur || 0.5;
    tone(freq, { at: at, vol: vol, dur: dur });
    tone(freq * 2, { at: at, vol: vol * 0.35, dur: dur * 0.5 });
    tone(freq * 4.02, { at: at, vol: vol * 0.12, dur: dur * 0.18 });
  }

  // Major pentatonic from C5: any run of these notes sounds good together
  var SCALE = [0, 2, 4, 7, 9];
  function note(i) {
    return 523.25 * Math.pow(2, (12 * Math.floor(i / 5) + SCALE[i % 5]) / 12);
  }

  var SOUNDS = {
    key: function (len) {
      noise({ filter: 'highpass', freq: 3500, dur: 0.025, vol: 0.05 });
      tone(rand(1100, 1300) + Math.min(len, 12) * 30, { dur: 0.03, vol: 0.03, dry: true });
    },
    erase: function () {
      noise({ filter: 'highpass', freq: 1800, dur: 0.03, vol: 0.04 });
      tone(rand(520, 600), { dur: 0.04, vol: 0.03, to: 380, dry: true });
    },
    pop: function () { tone(420, { to: 980, dur: 0.07, vol: 0.14 }); },
    click: function () {
      tone(900, { to: 620, dur: 0.04, vol: 0.07, dry: true });
      noise({ filter: 'highpass', freq: 3000, dur: 0.02, vol: 0.03 });
    },
    chip: function () { bell(note(rand(3, 8) | 0), { vol: 0.08, dur: 0.22 }); },
    on: function () { tone(700, { to: 1250, dur: 0.06, vol: 0.09 }); },
    off: function () { tone(800, { to: 420, dur: 0.07, vol: 0.08 }); },
    whoosh: function () { noise({ freq: 350, to: 2600, dur: 0.2, vol: 0.4, q: 1.2, attack: 0.05 }); },
    sweep: function (up) {
      for (var i = 0; i < 8; i++) tone(note(up ? i + 2 : 10 - i), { at: i * 0.028, dur: 0.09, vol: 0.06 });
    },
    open: function () {
      noise({ freq: 260, to: 1700, dur: 0.32, vol: 0.09, attack: 0.08 });
      bell(note(2), { at: 0.1, vol: 0.08 });
      bell(note(5), { at: 0.18, vol: 0.08 });
    },
    close: function () { noise({ freq: 1700, to: 240, dur: 0.25, vol: 0.2, attack: 0.03 }); },

    // Each answer in a streak starts higher up the scale
    right: function (combo) {
      var i = Math.min(combo - 1, 11);
      tone(170, { to: 75, dur: 0.14, vol: 0.2, dry: true });
      bell(note(i), { vol: 0.17 });
      bell(note(i + 2), { at: 0.075, vol: 0.17 });
      bell(note(i + 4), { at: 0.15, vol: 0.19, dur: 0.75 });
      if (combo >= 5) for (var k = 0; k < 5; k++) bell(note(i + 6 + k), { at: 0.22 + k * 0.045, vol: 0.05, dur: 0.3 });
    },
    wrong: function () {
      tone(120, { to: 58, dur: 0.32, vol: 0.32, type: 'triangle', dry: true });
      noise({ filter: 'lowpass', freq: 700, to: 120, dur: 0.2, vol: 0.2 });
      tone(233, { dur: 0.2, vol: 0.09, type: 'triangle' });
      tone(196, { at: 0.13, dur: 0.34, vol: 0.09, type: 'triangle' });
    },
    idk: function () {
      bell(note(4) / 2, { vol: 0.1, dur: 0.4 });
      bell(note(2) / 2, { at: 0.13, vol: 0.1, dur: 0.6 });
    },
    retry: function () {
      tone(340, { dur: 0.07, vol: 0.12, type: 'triangle' });
      tone(340, { at: 0.11, dur: 0.1, vol: 0.12, type: 'triangle' });
    },
    breakCombo: function () {
      tone(640, { to: 90, dur: 0.5, vol: 0.09, type: 'sawtooth', dry: true });
      noise({ filter: 'highpass', freq: 2400, dur: 0.2, vol: 0.06 });
    },
    milestone: function (combo) {
      var i = Math.min(combo, 8);
      [0, 2, 4, 5].forEach(function (n, k) { bell(note(i + n), { at: 0.28 + k * 0.08, vol: 0.14, dur: 0.6 }); });
    },
    fanfare: function () {
      noise({ freq: 400, to: 5000, dur: 0.4, vol: 0.08, attack: 0.25 });
      [0, 2, 4, 5, 7, 9, 10].forEach(function (n, k) {
        bell(note(n), { at: 0.3 + k * 0.075, vol: 0.14, dur: k === 6 ? 1.3 : 0.6 });
      });
      tone(130.8, { at: 0.3, dur: 0.6, vol: 0.2, type: 'triangle' });
      tone(196, { at: 0.75, dur: 1, vol: 0.16, type: 'triangle' });
    },
    step: function (i) { bell(note(Math.min(i, 9)) / 2, { vol: 0.055, dur: 0.22 }); },
    stepsDone: function (i) {
      bell(note(Math.min(i, 9)) / 2, { vol: 0.07, dur: 0.3 });
      bell(note(Math.min(i, 9) + 2) / 2, { at: 0.07, vol: 0.07, dur: 0.5 });
    },
    needAdd: function () {
      tone(300, { to: 110, dur: 0.14, vol: 0.14, type: 'triangle' });
      noise({ filter: 'lowpass', freq: 900, dur: 0.05, vol: 0.08, at: 0.1 });
    },
    needDot: function (n) { tone(note(n * 2) / 2, { to: note(n * 2 + 1), dur: 0.1, vol: 0.14 }); },
    needClear: function () {
      for (var k = 0; k < 6; k++) bell(note(3 + k), { at: k * 0.055, vol: 0.09, dur: 0.4 });
    },
    start: function () {
      noise({ freq: 200, to: 3800, dur: 0.5, vol: 0.09, attack: 0.3 });
      tone(110, { to: 440, dur: 0.5, vol: 0.09, type: 'triangle' });
      bell(note(0), { at: 0.46, vol: 0.14 });
      bell(note(4), { at: 0.46, vol: 0.12, dur: 0.8 });
    },
    end: function () {
      bell(note(4), { vol: 0.1 });
      bell(note(2), { at: 0.11, vol: 0.1 });
      bell(note(0), { at: 0.22, vol: 0.12, dur: 0.9 });
    },
    fast: function () {
      tone(500, { to: 2400, dur: 0.16, vol: 0.09, at: 0.2 });
      noise({ freq: 1200, to: 6000, dur: 0.16, vol: 0.06, at: 0.2 });
    },
    meter: function (pct) { tone(420 + pct * 11, { dur: 0.035, vol: 0.05, type: 'triangle', dry: true }); },
    tick: function () { tone(1500, { dur: 0.03, vol: 0.05, dry: true }); },
    tock: function () {
      tone(480, { to: 320, dur: 0.14, vol: 0.13, type: 'triangle' });
      tone(480, { at: 0.16, to: 300, dur: 0.18, vol: 0.1, type: 'triangle' });
    }
  };

  function sfx(name, arg) {
    if (audioReady()) SOUNDS[name](arg);
  }

  // ---------- Particles ----------
  var MAX_PARTS = 700;
  var canvas = null, pen = null, parts = [], running = false, lastFrame = 0;

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    pen.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(p) {
    if (still() || parts.length >= MAX_PARTS) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'juice';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.append(canvas);
      pen = canvas.getContext('2d');
      sizeCanvas();
      window.addEventListener('resize', sizeCanvas);
    }
    p.age = -(p.delay || 0);
    parts.push(p);
    if (!running) {
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(frame);
    }
  }

  var DRAW = {
    bit: function (p, k) {
      pen.globalAlpha = Math.min(1, k * 3);
      pen.fillStyle = p.color;
      pen.translate(p.x, p.y);
      pen.rotate(p.spin * p.age);
      pen.scale(1, Math.cos(p.age * p.flip)); // tumbling
      pen.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
    },
    spark: function (p, k) {
      pen.globalAlpha = k;
      pen.strokeStyle = p.color;
      pen.lineWidth = p.size * k + 0.4;
      pen.lineCap = 'round';
      pen.beginPath();
      pen.moveTo(p.x, p.y);
      pen.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
      pen.stroke();
    },
    ring: function (p, k) {
      pen.globalAlpha = k * 0.8;
      pen.strokeStyle = p.color;
      pen.lineWidth = 1 + 7 * k;
      pen.beginPath();
      pen.arc(p.x, p.y, p.size * (1 - Math.pow(k, 3)), 0, Math.PI * 2);
      pen.stroke();
    },
    text: function (p, k) {
      var pop = Math.min(1, p.age / 0.14);
      pen.globalAlpha = Math.min(1, k * 2.5);
      pen.translate(p.x, p.y);
      pen.scale(0.5 + pop * 0.5 + (1 - pop) * 0.6, 0.5 + pop * 0.5 + (1 - pop) * 0.6);
      pen.font = '800 ' + p.size + 'px system-ui, "Segoe UI", sans-serif';
      pen.textAlign = 'center';
      pen.textBaseline = 'middle';
      pen.lineWidth = p.size / 6;
      pen.lineJoin = 'round';
      pen.strokeStyle = p.outline;
      pen.strokeText(p.text, 0, 0);
      pen.fillStyle = p.color;
      pen.fillText(p.text, 0, 0);
    },
    orb: function (p) {
      var t = Math.min(1, p.age / p.life), e = t * t * (3 - 2 * t), u = 1 - e;
      var x = u * u * p.x + 2 * u * e * p.cx + e * e * p.tx;
      var y = u * u * p.y + 2 * u * e * p.cy + e * e * p.ty;
      pen.globalAlpha = 1;
      pen.fillStyle = p.color;
      pen.shadowColor = p.color;
      pen.shadowBlur = 12;
      pen.beginPath();
      pen.arc(x, y, p.size, 0, Math.PI * 2);
      pen.fill();
    }
  };

  function frame(now) {
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    pen.clearRect(0, 0, window.innerWidth, window.innerHeight);
    parts = parts.filter(function (p) {
      p.age += dt;
      if (p.age < 0) return true; // waiting on its delay
      if (p.age >= p.life) return false;
      if (p.kind !== 'orb') {
        p.vy += (p.gravity || 0) * dt;
        p.vx *= 1 - (p.drag || 0) * dt;
        p.vy *= 1 - (p.drag || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      pen.save();
      if (p.kind === 'spark') pen.globalCompositeOperation = 'lighter';
      DRAW[p.kind](p, 1 - p.age / p.life);
      pen.restore();
      return true;
    });
    if (parts.length) requestAnimationFrame(frame);
    else {
      running = false;
      pen.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function palette() { return [cssVar('--done'), cssVar('--accent'), cssVar('--gem'), cssVar('--warn')]; }

  function burst(x, y, o) {
    o = o || {};
    var colors = o.colors || palette(), n = o.n || 30, power = o.power || 420;
    for (var i = 0; i < n; i++) {
      var a = o.up ? rand(-Math.PI * 0.95, -Math.PI * 0.05) : rand(0, Math.PI * 2);
      var v = rand(0.25, 1) * power;
      spawn({
        kind: 'bit', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gravity: 760, drag: 1.5,
        life: rand(0.8, 1.5), size: rand(5, 10), color: pick(colors), spin: rand(-9, 9), flip: rand(5, 13)
      });
    }
    for (var j = 0; j < n * 0.7; j++) {
      var b = rand(0, Math.PI * 2), w = rand(0.4, 1.2) * power;
      spawn({
        kind: 'spark', x: x, y: y, vx: Math.cos(b) * w, vy: Math.sin(b) * w, drag: 3.5,
        life: rand(0.25, 0.6), size: rand(1.5, 3), color: pick(colors)
      });
    }
  }

  function ring(x, y, color, size) {
    spawn({ kind: 'ring', x: x, y: y, vx: 0, vy: 0, life: 0.55, size: size || 90, color: color });
  }

  function floatText(x, y, text, color, size) {
    var dark = document.documentElement.dataset.theme === 'dark';
    spawn({
      kind: 'text', x: x, y: y, vx: 0, vy: -70, drag: 1.2, life: 1.3, size: size || 30, text: text, color: color,
      outline: dark ? '#0f1320' : '#ffffff'
    });
  }

  // Bits that fall from a spot, like a broken piece
  function debris(x, y, width, color) {
    for (var i = 0; i < 18; i++) {
      spawn({
        kind: 'bit', x: x + rand(-width / 2, width / 2), y: y, vx: rand(-110, 110), vy: rand(-170, 10), gravity: 950,
        life: rand(0.5, 0.9), size: rand(4, 8), color: color, spin: rand(-7, 7), flip: rand(3, 9)
      });
    }
  }

  // Bursts all over the screen
  function fireworks(count) {
    var w = window.innerWidth, h = window.innerHeight;
    for (var i = 0; i < count; i++) {
      (function (i) {
        setTimeout(function () {
          var x = rand(w * 0.12, w * 0.88), y = rand(h * 0.12, h * 0.6);
          burst(x, y, { n: 34, power: 520 });
          ring(x, y, pick(palette()), 120);
        }, i * 170);
      })(i);
    }
  }

  function centre(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  }

  // Sends orbs from one element to another, then calls done when they land. The
  // landing runs on a timer, not the animation, because frames stop in a hidden tab.
  function orbs(from, to, n, color, done) {
    if (still()) { done(); return; }
    var a = centre(from), b = centre(to), flight = 0.55, gap = 0.05;
    for (var i = 0; i < n; i++) {
      spawn({
        kind: 'orb', x: a.x + rand(-a.w / 3, a.w / 3), y: a.y, tx: b.x, ty: b.y,
        cx: (a.x + b.x) / 2 + rand(-160, 160), cy: Math.min(a.y, b.y) - rand(30, 130),
        life: flight, size: rand(3, 5), color: color, delay: i * gap
      });
    }
    setTimeout(done, flight * 1000);
  }

  // ---------- Element animation ----------
  // Web Animations can restart at any moment, which matters when Enter is held down.
  function anim(el, frames, opts) {
    if (!el || still()) return null;
    return el.animate(frames, opts);
  }
  var SPRING = 'cubic-bezier(.2, 1.5, .4, 1)';

  function squish(el) {
    anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(.9)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'ease-out' });
  }
  function bump(el, big) {
    var s = big || 1.3;
    anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(' + s + ')' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
  }
  function shake(el, px) {
    var f = [];
    for (var i = 0; i <= 8; i++) {
      var d = (i % 2 ? 1 : -1) * px * (1 - i / 8);
      f.push({ transform: 'translateX(' + d + 'px)' });
    }
    anim(el, f, { duration: 380, easing: 'ease-out' });
  }
  function jolt(el, px) {
    anim(el, [
      { transform: 'translateY(0)' }, { transform: 'translateY(' + px + 'px)' },
      { transform: 'translateY(' + -px / 2 + 'px)' }, { transform: 'translateY(0)' }
    ], { duration: 240, easing: 'ease-out' });
  }
  function glow(el, color, spread) {
    anim(el, [
      { boxShadow: '0 0 0 0 ' + color },
      { boxShadow: '0 0 ' + spread + 'px ' + spread / 3 + 'px ' + color, offset: 0.25 },
      { boxShadow: '0 0 0 0 transparent' }
    ], { duration: 650, easing: 'ease-out' });
  }
  function enter(el, delay) {
    anim(el, [{ opacity: 0, transform: 'translateX(26px)' }, { opacity: 1, transform: 'none' }],
      { duration: 280, delay: delay || 0, easing: SPRING, fill: 'backwards' });
  }

  function stamp(el) {
    anim(el, [
      { opacity: 0, transform: 'scale(2) rotate(-5deg)' },
      { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.6 },
      { opacity: 1, transform: 'none' }
    ], { duration: 320, easing: 'ease-out', fill: 'backwards' });
  }
  function popIn(el) {
    anim(el, [{ opacity: 0, transform: 'translateY(10px) scale(.97)' }, { opacity: 1, transform: 'none' }],
      { duration: 300, easing: SPRING });
  }

  // ---------- Streaks ----------
  // Each practice area keeps its own streak, for this page load only.
  var MILESTONES = { 3: 'Hat trick!', 5: 'On fire!', 7: 'Blazing!', 10: 'Unstoppable!', 15: 'Legendary!', 20: 'Math machine!' };
  var combos = { m: 0, s: 0 };

  function comboEl(id) { return $(id + '-combo'); }

  function heat(n) { return n >= 10 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0; }

  function showCombo(id, card) {
    var n = combos[id], el = comboEl(id);
    el.hidden = n < 2;
    el.textContent = '🔥 ' + n;
    el.dataset.heat = heat(n);
    card.dataset.heat = heat(n);
  }

  function raiseCombo(id, card, at) {
    var n = ++combos[id];
    showCombo(id, card);
    if (n >= 2) bump(comboEl(id), 1.5);
    var text = MILESTONES[n] || (n % 10 === 0 ? n + ' in a row!' : null);
    if (!text) return;
    floatText(at.x, at.y - 40, text, cssVar(n >= 10 ? '--gem' : n >= 5 ? '--urgent' : '--warn'), n >= 10 ? 44 : 34);
    if (n % 10 === 0) { sfx('fanfare'); fireworks(n >= 20 ? 10 : 6); }
    else sfx('milestone', n);
  }

  function dropCombo(id, card) {
    var n = combos[id];
    if (n >= 3) {
      var c = centre(comboEl(id));
      debris(c.x, c.y, c.w, cssVar('--warn'));
      sfx('breakCombo');
    }
    combos[id] = 0;
    showCombo(id, card);
  }

  // ---------- Scenes ----------
  // A new question. Nothing here delays typing: focus is already in the answer box.
  function question(els, sound) {
    if (sound) sfx('whoosh');
    els.forEach(function (el, i) { enter(el, i * 45); });
  }

  // o: id ('m' or 's'), card, inputs, oks (per field, empty for "I don't know"),
  //    result ('right', 'wrong', 'idk'), feedback (the box), score (element), showScore()
  function answer(o) {
    var input = o.inputs[0], at = centre(input.closest('.m-fields'));
    o.inputs.forEach(function (inp, i) {
      if (o.oks[i] != null) inp.dataset.verdict = o.oks[i] ? 'right' : 'wrong';
    });
    popIn(o.feedback);
    stamp(o.feedback.querySelector('.m-verdict'));

    if (o.result === 'right') {
      var n = combos[o.id] + 1, done = cssVar('--done');
      sfx('right', n);
      burst(at.x, at.y, { n: Math.min(16 + n * 5, 70), power: 340 + Math.min(n, 10) * 28, up: true });
      ring(at.x, at.y, done, 70 + Math.min(n, 10) * 10);
      jolt(o.card, n >= 5 ? 5 : 3);
      glow(input, done, 18);
      orbs(input, o.score, Math.min(3 + n, 10), done, function () {
        o.showScore();
        bump(o.score);
        sfx('tick');
      });
      raiseCombo(o.id, o.card, at);
      return;
    }
    o.showScore();
    dropCombo(o.id, o.card);
    if (o.result === 'wrong') {
      sfx('wrong');
      shake(o.card, 9);
      glow(input, cssVar('--urgent'), 18);
      debris(at.x, at.y, at.w * 0.7, cssVar('--urgent'));
    } else {
      sfx('idk');
    }
  }

  // The value was right but the form wasn't, so it isn't a miss
  function retry(input, hint) {
    sfx('retry');
    shake(input, 5);
    bump(hint, 1.04);
  }

  function step(i) { sfx('step', i); }
  function stepsDone(i) { sfx('stepsDone', i); }

  // Runs render, then slides each row from where it was to where it is now.
  // Rows are matched by data-key, and new ones pop in.
  function flip(list, render) {
    var was = {};
    Array.prototype.forEach.call(list.children, function (li) { was[li.dataset.key] = li.getBoundingClientRect().top; });
    render();
    Array.prototype.forEach.call(list.children, function (li) {
      var top = was[li.dataset.key];
      if (top === undefined) {
        anim(li, [{ opacity: 0, transform: 'translateX(-22px) scale(.92)' }, { opacity: 1, transform: 'none' }],
          { duration: 340, easing: SPRING });
      } else if (top !== li.getBoundingClientRect().top) {
        anim(li, [{ transform: 'translateY(' + (top - li.getBoundingClientRect().top) + 'px)' }, { transform: 'none' }],
          { duration: 300, easing: 'ease-out' });
      }
    });
  }

  // What happened to the Needs practice list. Waits so the answer sound goes first.
  // kind: 'added', 'dot' or 'cleared'. row is the list row, or for 'cleared' where it was.
  function needs(kind, row, o) {
    setTimeout(function () {
      if (kind === 'added') {
        sfx('needAdd');
        glow(row, cssVar('--urgent'), 12);
      } else if (kind === 'dot') {
        sfx('needDot', o.streak);
        bump(row.querySelector('.m-streak'), 1.7);
        glow(row, cssVar('--done'), 12);
      } else {
        var x = row.left + row.width / 2, y = row.top + row.height / 2;
        sfx('needClear');
        burst(x, y, { n: 26, power: 300 });
        ring(x, y, cssVar('--done'), 80);
        floatText(x, y - 14, 'Cleared!', cssVar('--done'), 26);
        if (o.empty) {
          sfx('fanfare');
          fireworks(6);
        }
      }
    }, 420);
  }

  function start(card) {
    sfx('start');
    var c = centre($('s-session'));
    glow(card, cssVar('--accent'), 26);
    ring(c.x, c.y, cssVar('--accent'), 200);
  }

  function resetCombo(id, card) {
    combos[id] = 0;
    showCombo(id, card);
  }

  // s: { right, total }. A clean run of 5 or more gets the big finish.
  function end(s, summary) {
    resetCombo('s', summary.closest('.card'));
    if (!s.total) { sfx('off'); return; }
    popIn(summary);
    if (s.right === s.total && s.total >= 5) {
      var c = centre(summary);
      sfx('fanfare');
      fireworks(7);
      floatText(c.x, c.y - 20, 'Perfect run!', cssVar('--gem'), 42);
    } else {
      sfx('end');
    }
  }

  function fast(timer) {
    var c = centre(timer);
    sfx('fast');
    bump(timer, 1.4);
    floatText(c.x - 30, c.y + 26, '⚡ Fast!', cssVar('--warn'), 24);
    for (var i = 0; i < 14; i++) {
      var a = rand(0, Math.PI * 2), v = rand(120, 300);
      spawn({
        kind: 'spark', x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3.5,
        life: rand(0.25, 0.5), size: 2, color: cssVar('--warn')
      });
    }
  }

  function parCountdown(timer) {
    sfx('tick');
    bump(timer, 1.15);
  }
  function overPar(timer) {
    sfx('tock');
    shake(timer, 4);
  }

  function celebrate(from, text) {
    var c = centre(from);
    sfx('fanfare');
    fireworks(6);
    floatText(c.x, c.y - 30, text, cssVar('--done'), 46);
    ring(c.x, c.y, cssVar('--done'), 260);
  }
  function mastered(from) { celebrate(from, 'Mastered!'); }

  // Math goals. These wait like needs() does, so they land after the answer's own effects.
  function goalDone(from) { setTimeout(function () { celebrate(from, 'Goal complete!'); }, 420); }
  function goalStep(el, quiet) {
    setTimeout(function () {
      if (!quiet) sfx('needClear');
      bump(el, 1.15);
      glow(el, cssVar('--done'), 12);
    }, 420);
  }
  function dayDone(el) {
    setTimeout(function () {
      sfx('milestone', 3);
      bump(el, 1.15);
      glow(el, cssVar('--warn'), 14);
    }, 420);
  }

  // A bar that climbs (or drops) from one mastery value to the other, ticking as
  // it goes. If Next is pressed first it stops, but a new mastery still gets celebrated.
  var MASTERED = 90;
  function meter(from, to) {
    var box = document.createElement('div'), bar = document.createElement('div');
    var fill = document.createElement('div'), label = document.createElement('span');
    box.className = 'j-meter';
    box.setAttribute('aria-hidden', 'true'); // the note below says the same in words
    bar.className = 'bar';
    fill.className = 'fill';
    label.className = 'percent';
    bar.append(fill);
    box.append(bar, label);

    function show(v) {
      var pct = Math.round(v);
      fill.style.width = v + '%';
      label.textContent = pct + '%';
      fill.classList.toggle('complete', pct >= MASTERED);
    }
    fill.style.transition = 'none';
    if (still()) { show(to); return box; }
    show(from);

    var DELAY = 240, TWEEN = 620, began = null, ticked = Math.round(from);
    var crossed = from < MASTERED && to >= MASTERED;
    function tween(now) {
      if (!box.isConnected || box.closest('[hidden]')) {
        if (crossed) mastered($('s-session'));
        return;
      }
      if (began === null) began = now + DELAY;
      var t = Math.max(0, Math.min(1, (now - began) / TWEEN)), e = 1 - Math.pow(1 - t, 3);
      var v = from + (to - from) * e;
      show(v);
      if (Math.abs(Math.round(v) - ticked) >= 2) { ticked = Math.round(v); sfx('meter', ticked); }
      if (t < 1) { requestAnimationFrame(tween); return; }
      bump(label, 1.35);
      if (to > from) glow(bar, cssVar(to >= MASTERED ? '--done' : '--accent'), 10);
      if (crossed) mastered(box);
    }
    requestAnimationFrame(tween);
    return box;
  }

  // Selecting or unselecting everything runs a wave down the list
  function wave(on) {
    sfx('sweep', on);
    Array.prototype.forEach.call(document.querySelectorAll('.s-row'), function (row, i) {
      anim(row, [{ transform: 'none' }, { transform: 'translateX(' + (on ? 7 : -7) + 'px)' }, { transform: 'none' }],
        { duration: 240, delay: i * 7, easing: 'ease-out' });
    });
  }

  // ---------- Every other control ----------
  // These have their own sound, or get one from the result of pressing them
  var OWN_SOUND = /^(m-(check|next|idk)|s-(check|next|idk|start|review|assess|end|all|none))$/;

  $('more').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    squish(b);
    if (OWN_SOUND.test(b.id) || b.classList.contains('sfx-toggle')) return;
    sfx(b.classList.contains('key') || b.classList.contains('icon-btn') ? 'pop'
      : b.classList.contains('chip') || b.classList.contains('m-need-name') ? 'chip'
      : 'click');
  });

  // Typing: a tick per key and a little spark at the end of the text
  var measure = document.createElement('canvas').getContext('2d');
  function typeSpark(input) {
    var r = input.getBoundingClientRect(), style = getComputedStyle(input);
    measure.font = style.font;
    var w = measure.measureText(input.value.slice(0, input.selectionStart)).width;
    var x = Math.min(r.left + parseFloat(style.paddingLeft) + w, r.right - 8), y = r.top + r.height / 2;
    for (var i = 0; i < 3; i++) {
      spawn({
        kind: 'spark', x: x, y: y, vx: rand(-90, 90), vy: rand(-150, -30), drag: 4,
        life: rand(0.15, 0.3), size: 1.6, color: cssVar('--accent')
      });
    }
  }
  function onType(e) {
    var input = e.target;
    if (input.tagName !== 'INPUT') return;
    if (/^delete/.test(e.inputType || '')) sfx('erase');
    else {
      sfx('key', input.value.length);
      typeSpark(input);
    }
  }
  $('m-fields').addEventListener('input', onType);
  $('s-fields').addEventListener('input', onType);

  // Runs after app.js has shown or hidden the section
  $('more-toggle').addEventListener('click', function () {
    var open = !$('more').hidden;
    sfx(open ? 'open' : 'close');
    if (open) {
      Array.prototype.forEach.call($('more').children, function (card, i) {
        anim(card, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
          { duration: 380, delay: i * 90, easing: SPRING, fill: 'backwards' });
      });
    }
  });

  $('s-list').addEventListener('change', function (e) {
    sfx(e.target.checked ? 'on' : 'off');
    squish(e.target);
  });
  $('s-all').addEventListener('click', function () { wave(true); });
  $('s-none').addEventListener('click', function () { wave(false); });

  // ---------- Mute ----------
  var toggles = document.querySelectorAll('.sfx-toggle');
  function showToggles() {
    Array.prototype.forEach.call(toggles, function (b) {
      b.textContent = soundOn ? '🔊' : '🔇';
      b.title = soundOn ? 'Sound on' : 'Sound off';
      b.setAttribute('aria-label', 'Sound effects');
      b.setAttribute('aria-pressed', String(soundOn));
    });
  }
  Array.prototype.forEach.call(toggles, function (b) {
    b.addEventListener('click', function () {
      soundOn = !soundOn;
      try { localStorage.setItem('hp.sfx', String(soundOn)); } catch (e) { /* ignore */ }
      showToggles();
      sfx('on');
    });
  });
  showToggles();

  window.hpJuice = {
    sfx: sfx, question: question, answer: answer, retry: retry, step: step, stepsDone: stepsDone,
    flip: flip, needs: needs, start: start, end: end, fast: fast, parCountdown: parCountdown,
    overPar: overPar, meter: meter, goalDone: goalDone, goalStep: goalStep, dayDone: dayDone, SOUNDS: SOUNDS
  };
})();
