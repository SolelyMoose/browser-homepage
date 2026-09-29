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

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function $(id) { return document.getElementById(id); }

  // ---------- Theme ----------
  function applyTheme(hour) {
    if (hour === undefined) hour = new Date().getHours();
    document.documentElement.dataset.theme = (hour >= 19 || hour < 7) ? 'dark' : 'light';
  }
  window.applyTheme = applyTheme;

  // ---------- Clock / header ----------
  var lastMinute = -1;
  function tick() {
    var now = new Date();
    $('clock').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    var h = now.getHours();
    $('greeting').textContent = h < 5 ? 'Up late?' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    if (now.getMinutes() !== lastMinute) {
      lastMinute = now.getMinutes();
      applyTheme(h);
    }
    renderCountdown(now);
  }

  // ---------- Progress helper ----------
  function setProgress(fillEl, done, total) {
    var pct = total ? Math.round((done / total) * 100) : 0;
    fillEl.style.width = pct + '%';
    fillEl.classList.toggle('complete', total > 0 && done === total);
    return pct;
  }

  // ---------- XP / levels / gems ----------
  // Checking off an item gives XP once per item (the item gets a `rewarded` flag),
  // so unchecking and re-checking can't farm XP. Each level-up gives gems.
  var XP_TODO = 10;
  var XP_HOMEWORK = 25;
  var player = load('hp.player', { xp: 0, gems: 0 });
  var shownGems = player.gems; // lags behind player.gems while gems fly in

  // XP needed to go from `level` to `level + 1`: 100, 150, 200, ...
  function xpForLevel(level) { return 50 + level * 50; }
  // Every 5th level is a bigger gem reward
  function gemsForLevel(level) { return level % 5 === 0 ? 50 : 10; }

  function levelInfo(xp) {
    var level = 1;
    while (xp >= xpForLevel(level)) { xp -= xpForLevel(level); level++; }
    return { level: level, into: xp, need: xpForLevel(level) };
  }

  function renderPlayer() {
    var info = levelInfo(player.xp);
    $('lvl').textContent = 'Lv ' + info.level;
    $('xp-text').textContent = info.into + ' / ' + info.need + ' XP';
    $('xp-fill').style.width = Math.round((info.into / info.need) * 100) + '%';
    $('gems').textContent = '💎 ' + shownGems;
  }

  var toastTimer;
  function toast(msg, big) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.toggle('big', !!big);
    el.classList.remove('show');
    void el.offsetWidth; // restart the animation
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, big ? 3000 : 1500);
  }

  function gainXp(amount) {
    var start = levelInfo(player.xp);
    player.xp += amount;
    var after = levelInfo(player.xp).level;
    var gems = 0;
    for (var l = start.level + 1; l <= after; l++) gems += gemsForLevel(l);
    player.gems += gems;
    save('hp.player', player);
    if (after > start.level) {
      levelUpFx(start, after, gems);
    } else {
      renderPlayer();
      toast('+' + amount + ' XP');
    }
  }

  function restartClass(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // restart the CSS animation
    el.classList.add(cls);
  }

  // ---------- Level-up effects ----------
  // Screen shake, a blue lightning bolt from the bottom, a big level counter that
  // counts up, then gems that fly into the header gem counter. The header shows
  // `shownGems`, which catches up to `player.gems` as each gem lands.
  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var fxTimer, rumbleTimer, chargeFrame;
  var RUMBLE_MS = 1400; // keep in sync with the body.rumbling animation in styles.css
  var CHARGE_MS = 1200; // XP bar fill; ends a little before the rumble so it holds at full

  // `start` is levelInfo() from before the XP was added. The XP bar grows and fills
  // up to max while the screen rumbles, then the big effect plays.
  function levelUpFx(start, to, gems) {
    if (reduceMotion()) {
      shownGems = player.gems;
      renderPlayer();
      restartClass($('player'), 'leveled');
      toast('Level up! Lv ' + to + ' · +' + gems + ' 💎', true);
      return;
    }
    chargeBar(start);
    document.body.classList.remove('shaking');
    restartClass(document.body, 'rumbling');
    clearTimeout(rumbleTimer);
    rumbleTimer = setTimeout(function () {
      document.body.classList.remove('rumbling');
      releaseBar();
      playLevelUp(start.level, to, gems);
    }, RUMBLE_MS);
  }

  // Enlarge the XP bar and tween it (and the XP text) from where it was to full
  function chargeBar(start) {
    var fill = $('xp-fill'), text = $('xp-text');
    $('lvl').textContent = 'Lv ' + start.level;
    $('player').classList.add('charging');
    fill.style.transition = 'none';
    cancelAnimationFrame(chargeFrame);
    var t0 = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - t0) / CHARGE_MS);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(2 - 2 * p, 2) / 2; // ease in-out
      var xp = start.into + (start.need - start.into) * e;
      fill.style.width = (xp / start.need) * 100 + '%';
      text.textContent = Math.round(xp) + ' / ' + start.need + ' XP';
      if (p < 1) chargeFrame = requestAnimationFrame(frame);
    })(t0);
  }

  // Shrink the bar back and refill it from empty for the new level
  function releaseBar() {
    cancelAnimationFrame(chargeFrame);
    var fill = $('xp-fill');
    $('player').classList.remove('charging');
    fill.style.width = '0%';
    void fill.offsetWidth;
    fill.style.transition = '';
    renderPlayer();
  }

  function playLevelUp(from, to, gems) {
    var fx = $('fx');
    var num = $('lvl-pop-num');
    num.textContent = from;
    restartClass(fx, 'on');
    restartClass(document.body, 'shaking');
    lightning();

    var level = from;
    (function step() {
      setTimeout(function () {
        level++;
        num.textContent = level;
        restartClass(num, 'bump');
        if (level < to) step();
        else burstGems(gems);
      }, level === from ? 450 : 300);
    })();

    clearTimeout(fxTimer);
    fxTimer = setTimeout(function () {
      fx.classList.remove('on');
      document.body.classList.remove('shaking');
    }, 2800 + (to - from - 1) * 300);
  }

  // Replay the effect from the console without earning anything
  // (the gem counter can't go above player.gems).
  window.previewLevelUp = function () {
    var info = levelInfo(player.xp);
    levelUpFx(info, info.level + 1, 10);
  };

  // One big zigzag bolt from the bottom of the screen up to the level counter.
  // It's drawn once; CSS (.fx.on .bolt) slowly widens its strokes, then fades it.
  function lightning() {
    var svg = $('bolt');
    var w = window.innerWidth, h = window.innerHeight;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var cx = w / 2, yEnd = $('lvl-pop').getBoundingClientRect().bottom - 10;
    var y = h + 10, side = Math.random() < 0.5 ? -1 : 1;
    var d = 'M' + cx + ' ' + y;
    while (y > yEnd) {
      y = Math.max(yEnd, y - (70 + Math.random() * 50));
      side = -side;
      var x = y === yEnd ? cx : cx + side * (25 + Math.random() * 35);
      d += ' L' + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    svg.querySelectorAll('path').forEach(function (p) { p.setAttribute('d', d); });
  }

  function burstGems(total) {
    var target = $('gems').getBoundingClientRect();
    var src = $('lvl-pop').getBoundingClientRect();
    var sx = src.left + src.width / 2, sy = src.top + src.height / 2;
    var dx = target.left + target.width / 2 - sx, dy = target.top + target.height / 2 - sy;
    var count = Math.min(total, 12);
    var base = Math.floor(total / count), extra = total % count;

    for (var i = 0; i < count; i++) {
      flyGem(i, count, base + (i < extra ? 1 : 0));
    }

    function flyGem(i, count, value) {
      var gem = document.createElement('span');
      gem.className = 'fly-gem';
      gem.textContent = '💎';
      gem.style.left = sx + 'px';
      gem.style.top = sy + 'px';
      document.body.append(gem);

      var angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      var r = 90 + Math.random() * 70;
      var out = 'translate(calc(-50% + ' + Math.cos(angle) * r + 'px), calc(-50% + ' + Math.sin(angle) * r + 'px)) scale(1.2)';
      var home = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.5)';

      gem.animate([
        { transform: 'translate(-50%, -50%) scale(.3)', opacity: 0 },
        { transform: out, opacity: 1 }
      ], { duration: 380, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).onfinish = function () {
        gem.animate([{ transform: out }, { transform: home }], {
          duration: 550, delay: 120 + i * 60, easing: 'cubic-bezier(.55,0,.8,.45)', fill: 'forwards'
        }).onfinish = function () {
          gem.remove();
          shownGems = Math.min(player.gems, shownGems + value);
          $('gems').textContent = '💎 ' + shownGems;
          restartClass($('gems'), 'bump');
        };
      };
    }
  }

  function toggleDone(item, xp) {
    item.done = !item.done;
    if (item.done && !item.rewarded) {
      item.rewarded = true;
      gainXp(xp);
    }
  }

  function makeItem(item, onToggle, onDelete, tagText) {
    var li = document.createElement('li');
    if (item.done) li.className = 'done';

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = item.done;
    cb.addEventListener('change', onToggle);

    var text = document.createElement('span');
    text.className = 'text';
    text.textContent = item.text || item.title;

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.setAttribute('aria-label', 'Delete');
    del.textContent = '×';
    del.addEventListener('click', onDelete);

    li.append(cb, text);
    if (tagText) {
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = tagText;
      li.append(tag);
    }
    li.append(del);
    return li;
  }

  // ---------- Daily to-do ----------
  var todos = load('hp.todos', { date: todayKey(), items: [] });

  function renderTodos() {
    var list = $('todo-list');
    list.textContent = '';
    todos.items.forEach(function (t) {
      list.append(makeItem(t,
        function () { toggleDone(t, XP_TODO); save('hp.todos', todos); renderTodos(); },
        function () { todos.items = todos.items.filter(function (x) { return x.id !== t.id; }); save('hp.todos', todos); renderTodos(); }
      ));
    });
    var done = todos.items.filter(function (t) { return t.done; }).length;
    var total = todos.items.length;
    $('todo-count').textContent = done + '/' + total;
    setProgress($('todo-fill'), done, total);
    $('todo-empty').hidden = total > 0;
  }

  $('todo-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('todo-input');
    var text = input.value.trim();
    if (!text) return;
    todos.items.push({ id: uid(), text: text, done: false });
    save('hp.todos', todos);
    input.value = '';
    renderTodos();
  });

  // ---------- Homework ----------
  var homework = load('hp.homework', []);

  function renderHomework() {
    var list = $('hw-list');
    list.textContent = '';
    homework.forEach(function (h) {
      list.append(makeItem(h,
        function () { toggleDone(h, XP_HOMEWORK); save('hp.homework', homework); renderHomework(); },
        function () { homework = homework.filter(function (x) { return x.id !== h.id; }); save('hp.homework', homework); renderHomework(); },
        h.subject
      ));
    });
    var done = homework.filter(function (h) { return h.done; }).length;
    var total = homework.length;
    $('hw-percent').textContent = setProgress($('hw-fill'), done, total) + '%';
    $('hw-empty').hidden = total > 0;
    $('hw-clear').hidden = done === 0;
  }

  $('hw-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var title = $('hw-title').value.trim();
    if (!title) return;
    homework.push({ id: uid(), title: title, subject: $('hw-subject').value.trim(), done: false });
    save('hp.homework', homework);
    $('hw-title').value = '';
    $('hw-subject').value = '';
    $('hw-title').focus();
    renderHomework();
  });

  $('hw-clear').addEventListener('click', function () {
    homework = homework.filter(function (h) { return !h.done; });
    save('hp.homework', homework);
    renderHomework();
  });

  // ---------- Deadline ----------
  var deadline = load('hp.deadline', null);

  function toLocalInput(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fillDeadlineForm() {
    $('dl-label').value = deadline ? deadline.label : '';
    $('dl-date').value = deadline ? toLocalInput(new Date(deadline.due)) : '';
  }

  function renderCountdown(now) {
    var box = $('countdown');
    if (!deadline) {
      box.dataset.state = 'none';
      $('cd-label').textContent = 'No deadline set';
      $('cd-d').textContent = '0';
      $('cd-h').textContent = $('cd-m').textContent = $('cd-s').textContent = '00';
      $('cd-due').textContent = 'Pick a date and time below.';
      return;
    }
    var due = new Date(deadline.due);
    var ms = due - now;
    $('cd-label').textContent = deadline.label || 'Deadline';

    var dueText = due.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    if (ms <= 0) {
      box.dataset.state = 'past';
      $('cd-d').textContent = '0';
      $('cd-h').textContent = $('cd-m').textContent = $('cd-s').textContent = '00';
      $('cd-due').textContent = 'Past due · was ' + dueText;
      return;
    }
    box.dataset.state = ms < 3 * 3600e3 ? 'urgent' : ms < 24 * 3600e3 ? 'warn' : 'ok';
    var s = Math.floor(ms / 1000);
    $('cd-d').textContent = Math.floor(s / 86400);
    $('cd-h').textContent = pad(Math.floor(s / 3600) % 24);
    $('cd-m').textContent = pad(Math.floor(s / 60) % 60);
    $('cd-s').textContent = pad(s % 60);
    $('cd-due').textContent = 'Due ' + dueText;
  }

  $('deadline-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var value = $('dl-date').value;
    if (!value) return;
    var due = new Date(value); // datetime-local parses as local time
    if (isNaN(due)) return;
    deadline = { label: $('dl-label').value.trim(), due: due.toISOString() };
    save('hp.deadline', deadline);
    renderCountdown(new Date());
  });

  $('dl-clear').addEventListener('click', function () {
    deadline = null;
    try { localStorage.removeItem('hp.deadline'); } catch (e) { /* ignore */ }
    fillDeadlineForm();
    renderCountdown(new Date());
  });

  // ---------- Export / import (plain text) ----------
  // Format:
  //   Deadline: 2026-10-02 23:59 — All homework   (or "Deadline: none")
  //
  //   Homework:
  //   [ ] Essay (English)
  //   [x] Worksheet
  function exportText() {
    var lines = [];
    if (deadline) {
      var d = new Date(deadline.due);
      var stamp = toLocalInput(d).replace('T', ' ');
      lines.push('Deadline: ' + stamp + (deadline.label ? ' — ' + deadline.label : ''));
    } else {
      lines.push('Deadline: none');
    }
    lines.push('', 'Homework:');
    homework.forEach(function (h) {
      lines.push('[' + (h.done ? 'x' : ' ') + '] ' + h.title + (h.subject ? ' (' + h.subject + ')' : ''));
    });
    return lines.join('\n') + '\n';
  }

  function parseItem(body, done) {
    var m = body.match(/^(.*\S)\s*\(([^()]+)\)$/);
    return { id: uid(), title: m ? m[1] : body, subject: m ? m[2].trim() : '', done: done };
  }

  // Returns { deadline: undefined | null | {label, due}, homework: undefined | [...] }
  // undefined means "not mentioned in the text, leave as is".
  function parseText(text) {
    var result = { deadline: undefined, homework: undefined };
    var inHomework = false;
    text.split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;

      var dl = line.match(/^deadline\s*:\s*(.*)$/i);
      if (dl) {
        inHomework = false;
        var rest = dl[1].trim();
        if (!rest || /^none$/i.test(rest)) { result.deadline = null; return; }
        var m = rest.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})\s*(?:[—–-]\s*)?(.*)$/);
        if (!m) throw new Error('Couldn\'t read the deadline date. Use the form 2026-10-02 23:59.');
        var due = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
        if (isNaN(due)) throw new Error('The deadline date isn\'t valid.');
        result.deadline = { label: m[6].trim(), due: due.toISOString() };
        return;
      }

      if (/^homework\s*:?$/i.test(line)) {
        inHomework = true;
        if (!result.homework) result.homework = [];
        return;
      }

      var item = line.match(/^(?:[-*]\s*)?\[\s*([xX✓]?)\s*\]\s*(.+)$/);
      if (item) {
        if (!result.homework) result.homework = [];
        result.homework.push(parseItem(item[2].trim(), !!item[1]));
      } else if (inHomework) {
        // Plain lines under "Homework:" count as unfinished assignments
        result.homework.push(parseItem(line.replace(/^[-*]\s*/, ''), false));
      }
    });
    return result;
  }

  function setTransferStatus(msg, isError) {
    var el = $('tx-status');
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
  }

  function importText(text) {
    var parsed;
    try {
      parsed = parseText(text);
    } catch (err) {
      setTransferStatus(err.message, true);
      return;
    }
    if (parsed.deadline === undefined && parsed.homework === undefined) {
      setTransferStatus('Nothing to import. Add a "Deadline:" line or "[ ]" homework lines.', true);
      return;
    }
    var parts = [];
    if (parsed.homework !== undefined) {
      homework = parsed.homework;
      save('hp.homework', homework);
      renderHomework();
      parts.push(homework.length + ' assignment' + (homework.length === 1 ? '' : 's'));
    }
    if (parsed.deadline !== undefined) {
      deadline = parsed.deadline;
      if (deadline) save('hp.deadline', deadline);
      else { try { localStorage.removeItem('hp.deadline'); } catch (e) { /* ignore */ } }
      fillDeadlineForm();
      renderCountdown(new Date());
      parts.push(deadline ? 'the deadline' : 'no deadline (cleared)');
    }
    setTransferStatus('Imported ' + parts.join(' and ') + '.');
  }

  $('tx-toggle').addEventListener('click', function () {
    var panel = $('transfer');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      $('tx-text').value = exportText();
      setTransferStatus('');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
  $('tx-close').addEventListener('click', function () { $('transfer').hidden = true; });

  $('tx-refresh').addEventListener('click', function () {
    $('tx-text').value = exportText();
    setTransferStatus('Showing your current homework and deadline.');
  });

  $('tx-copy').addEventListener('click', function () {
    var text = $('tx-text').value;
    var done = function () { setTransferStatus('Copied to clipboard.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        $('tx-text').select(); document.execCommand('copy'); done();
      });
    } else {
      $('tx-text').select(); document.execCommand('copy'); done();
    }
  });

  $('tx-download').addEventListener('click', function () {
    var blob = new Blob([$('tx-text').value], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'homework-' + todayKey() + '.txt';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  $('tx-import').addEventListener('click', function () { importText($('tx-text').value); });

  $('tx-open').addEventListener('click', function () { $('tx-file').click(); });
  $('tx-file').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      $('tx-text').value = reader.result;
      importText(reader.result);
    };
    reader.readAsText(file);
    this.value = '';
  });

  // ---------- Init ----------
  renderPlayer();
  renderTodos();
  renderHomework();
  fillDeadlineForm();
  tick();
  setInterval(tick, 1000);
})();
