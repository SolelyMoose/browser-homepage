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
        function () { t.done = !t.done; save('hp.todos', todos); renderTodos(); },
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
        function () { h.done = !h.done; save('hp.homework', homework); renderHomework(); },
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
  renderTodos();
  renderHomework();
  fillDeadlineForm();
  tick();
  setInterval(tick, 1000);
})();
