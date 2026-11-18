/* Capra Studios: "Watch one workflow" demo.
   A hand-built simulation: no AI calls, no network requests, no dependencies. Nothing is sent anywhere.
   The markup already holds the whole run for readers without JavaScript. This script hides steps 2 to 8,
   then shows them one at a time, pauses for a person at the approval, and writes every action to the log.
   Document titles come from brain-data.js (window.CAPRA_BRAIN_DEMO) when it is on the page. */
(function () {
  'use strict';

  /* Built-in titles, used when brain-data.js is not loaded. Keep them the same as the titles there. */
  var TITLES = {
    'client-okafor': 'Client record: Okafor residence',
    'reschedule-policy': 'Scheduling and reschedule policy',
    'price-sheet': '2026 residential price sheet'
  };

  var LAST = 8;
  var APPROVAL = 6;
  var STEP_MS = 1500;
  var START = 7 * 3600 + 42 * 60 + 8; /* 7:42:08 a.m. on the scenario's clock */

  var ALONE = 'Allowed alone';
  var NEEDS = 'Needs approval';
  var NO_RISK = 'Does not apply';
  var NOBODY = 'Not needed';
  var YOU = 'You, as Marcus';
  var SWITCH = 'You, with the off switch';

  /* What each step writes to the log: seconds since the entry before it, then [action, risk level, approved by]. */
  var STEP_LOG = {
    1: { after: 0, rows: [['Email arrived in the shared inbox', NO_RISK, NOBODY]] },
    2: { after: 2, rows: [['Read the email and found two requests', ALONE, NOBODY]] },
    3: { after: 3, rows: [['Looked up three documents and the crew calendar', ALONE, NOBODY]] },
    4: { after: 5, rows: [['Drafted a reply and a calendar change', ALONE, NOBODY]] },
    5: { after: 1, rows: [['Rated three planned actions for risk', ALONE, NOBODY]] },
    6: { after: 1, rows: [['Paused and asked a person to decide', NEEDS, 'Asked Marcus']] }
  };
  var MOVED = ['Moved the booking to Thursday, April 16 (simulated)', NEEDS, YOU];
  var FILED = ['Filed the email under the client record (simulated)', ALONE, NOBODY];
  var DECISION_LOG = {
    approve: [['Sent the reply to the customer (simulated)', NEEDS, YOU], MOVED, FILED],
    edit: [['Sent the reply as edited by a person (simulated)', NEEDS, YOU], MOVED, FILED],
    reject: [['Did not send the reply or move the booking', NEEDS, 'Rejected by you, as Marcus'], ['Left the email in the inbox, flagged for a person', ALONE, NOBODY]]
  };
  var DECISION_TEXT = {
    approve: 'You approved the reply and the calendar change as written.',
    edit: 'You edited the reply, then approved it and the calendar change.',
    reject: 'You rejected both. The agent may not send or move anything.'
  };
  var OUTCOME = {
    approve: ['Reply sent to Ngozi Okafor.', 'Booking moved to Thursday, April 16, 12:30 to 4:30 p.m.', 'Email filed under the client record.'],
    edit: ['Your edited reply sent to Ngozi Okafor.', 'Booking moved to Thursday, April 16, 12:30 to 4:30 p.m.', 'Email filed under the client record.'],
    reject: ['No reply was sent.', 'The booking stays on Tuesday, April 14, 8:00 a.m. to 12:00 p.m.', 'The email stays in the inbox, flagged for a person.']
  };
  var STATUS = {
    1: 'The email has arrived. The agent has not acted yet.',
    2: 'The agent read the email and found two requests.',
    3: 'It looked up three documents and the crew calendar.',
    4: 'It drafted a reply and a calendar change. Nothing has gone out.',
    5: 'It rated three actions. Two need approval.',
    6: 'The agent is waiting for a person. Approve, edit or reject.',
    8: 'The run is in the log. Reset to watch it again.'
  };
  var STATUS_DECIDED = {
    approve: 'Approved. Simulated. Nothing was sent.',
    edit: 'Approved with your edits. Simulated. Nothing was sent.',
    reject: 'Rejected. Nothing was sent and the booking did not move.'
  };

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(seconds) {
    var h = Math.floor(seconds / 3600) % 24;
    return (h % 12 || 12) + ':' + pad(Math.floor(seconds % 3600 / 60)) + ':' + pad(seconds % 60) + (h < 12 ? ' a.m.' : ' p.m.');
  }
  function calm() {
    return document.documentElement.classList.contains('motion-off') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount() {
    var root = document.getElementById('agent-demo');
    if (!root || root.getAttribute('data-mounted')) return;

    var find = function (name) { return root.querySelector('[data-agent="' + name + '"]'); };
    var ui = {
      controls: find('controls'), next: find('next'), run: find('run'), reset: find('reset'),
      off: find('switch'), offState: find('switch-state'), status: find('status'),
      approval: find('approval'), approve: find('approve'), edit: find('edit'), reject: find('reject'),
      editor: find('editor'), editText: find('edit-text'), editError: find('edit-error'),
      sendEdit: find('send-edit'), cancelEdit: find('cancel-edit'), decision: find('decision'),
      draft: find('draft'), outcomeTitle: find('outcome-title'), outcome: find('outcome'), summary: find('summary'),
      logBox: find('log-box'), logScroll: find('log-scroll'), log: find('log')
    };
    for (var key in ui) { if (!ui[key]) return; }
    var steps = Array.prototype.slice.call(root.querySelectorAll('.agent-step'));
    if (steps.length !== LAST) return;
    root.setAttribute('data-mounted', 'true');

    /* Cite the same documents as the second brain demo when its data is on the page. */
    var brain = window.CAPRA_BRAIN_DEMO;
    var brainTitles = {};
    if (brain && brain.documents) brain.documents.forEach(function (doc) { brainTitles[doc.id] = doc.title; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-doc]'), function (node) {
      var id = node.getAttribute('data-doc');
      var title = brainTitles[id] || TITLES[id];
      if (title) node.textContent = title;
    });

    /* The draft is read from the markup, so the page and the editor always hold the same words. */
    var draftText = Array.prototype.map.call(ui.draft.querySelectorAll('p'), function (p) {
      return Array.prototype.map.call(p.childNodes, function (n) { return n.nodeName === 'BR' ? '\n' : n.textContent; }).join('').trim();
    }).join('\n\n');

    var state, log, timer = 0, painted = 0;

    function addRows(entry) {
      state.clock += entry.after;
      entry.rows.forEach(function (row, i) {
        if (i) state.clock += 1;
        log.push({ time: stamp(state.clock), action: row[0], risk: row[1], by: row[2] });
      });
    }
    function fresh() {
      state = { step: 1, decision: null, auto: false, stopped: false, edited: '', clock: START };
      log = [];
      addRows(STEP_LOG[1]);
    }
    function waiting() { return state.step === APPROVAL && !state.decision; }
    function done() { return state.step >= LAST; }
    function stepNode(n) { return steps[n - 1]; }

    /* ----- painting ----- */
    function paintLog(quiet) {
      ui.log.textContent = '';
      log.forEach(function (row, i) {
        var tr = make('tr', !quiet && i >= painted ? 'is-new' : '');
        tr.setAttribute('role', 'row');
        [['Time', row.time], ['Action', row.action], ['Risk level', row.risk], ['Approved by', row.by]].forEach(function (cell, column) {
          var td = make('td');
          td.setAttribute('role', 'cell');
          td.setAttribute('data-label', cell[0]);
          if (column === 2 && row.risk !== NO_RISK) td.appendChild(make('span', row.risk === NEEDS ? 'demo-tag' : 'demo-tag is-plain', cell[1]));
          else td.textContent = cell[1];
          tr.appendChild(td);
        });
        ui.log.appendChild(tr);
      });
      painted = log.length;
      ui.logScroll.scrollTop = ui.logScroll.scrollHeight;
      fitLog();
    }
    /* When the log scrolls inside its box, the box must be reachable from the keyboard. */
    function fitLog() {
      if (ui.logScroll.scrollHeight > ui.logScroll.clientHeight + 1) {
        ui.logScroll.setAttribute('tabindex', '0');
        ui.logScroll.setAttribute('role', 'region');
        ui.logScroll.setAttribute('aria-label', 'The log. Scroll to read earlier entries.');
      } else {
        ui.logScroll.removeAttribute('tabindex');
        ui.logScroll.removeAttribute('role');
        ui.logScroll.removeAttribute('aria-label');
      }
    }

    function paintOutcome() {
      var kind = state.decision;
      ui.outcome.textContent = '';
      if (!kind) return;
      ui.outcomeTitle.textContent = kind === 'reject' ? 'It stops' : 'It carries out what was approved';
      var list = make('ul', 'agent-list agent-done');
      OUTCOME[kind].forEach(function (line) { list.appendChild(make('li', null, line)); });
      ui.outcome.appendChild(list);
      if (kind === 'edit') {
        var card = make('div', 'agent-card');
        card.appendChild(make('p', 'demo-label', 'The reply as you edited it'));
        card.appendChild(make('p', 'agent-pre', state.edited));
        ui.outcome.appendChild(card);
      }
      var flag = make('p', 'agent-simulated');
      flag.appendChild(make('span', 'demo-tag', 'Simulated. Nothing was sent.'));
      ui.outcome.appendChild(flag);
    }

    function summaryText() {
      var count = log.length + ' entries. ';
      if (state.decision === 'reject') return count + 'Two actions needed approval and you rejected them, so neither happened.';
      if (state.decision === 'edit') return count + 'Two actions needed approval. You edited the reply, then approved both.';
      return count + 'Two actions needed approval, and neither happened before you said yes.';
    }

    function statusText() {
      if (state.stopped) return 'Stopped by a person at step ' + state.step + ' of ' + LAST + '. The agent does nothing more until it is switched back on.';
      var text = state.step === 7 ? STATUS_DECIDED[state.decision] : STATUS[state.step];
      return 'Step ' + state.step + ' of ' + LAST + '. ' + text;
    }

    function paint(note, quiet) {
      steps.forEach(function (li, i) {
        var show = i + 1 <= state.step;
        if (show && li.hidden && !quiet) li.classList.add('is-new');
        li.hidden = !show;
      });

      ui.approval.hidden = !!state.decision;
      ui.decision.hidden = !state.decision;
      ui.decision.textContent = state.decision ? DECISION_TEXT[state.decision] : '';
      [ui.approve, ui.edit, ui.reject, ui.sendEdit, ui.cancelEdit, ui.editText].forEach(function (control) { control.disabled = state.stopped; });
      paintOutcome();
      ui.summary.textContent = summaryText();

      ui.next.disabled = state.stopped || state.auto || waiting() || done();
      ui.run.disabled = state.stopped || waiting() || done();
      ui.run.textContent = state.auto && !waiting() && !done() ? 'Pause' : 'Run it';
      ui.reset.disabled = state.step === 1 && log.length === 1;
      ui.off.setAttribute('aria-pressed', String(state.stopped));
      ui.offState.textContent = state.stopped ? 'The agent is off.' : 'The agent is on.';
      ui.logBox.classList.toggle('is-read', done());
      var status = (note ? note + ' ' : '') + statusText();
      if (ui.status.textContent !== status) ui.status.textContent = status;
      paintLog(quiet);
    }

    /* Keep the newest step and the controls in view. The page only moves when something is out of sight. */
    function follow(node) {
      var tall = window.innerHeight || document.documentElement.clientHeight;
      var behavior = calm() ? 'instant' : 'smooth';
      var box = node.getBoundingClientRect();
      var wide = window.matchMedia && window.matchMedia('(min-width: 801px)').matches;
      if (wide) {
        if (box.top < 0 || box.bottom > tall) node.scrollIntoView({ behavior: behavior, block: box.height > tall - 140 ? 'start' : 'nearest' });
        return;
      }
      var bar = ui.controls.getBoundingClientRect();
      if (bar.bottom - box.top > tall - 90) node.scrollIntoView({ behavior: behavior, block: 'start' });
      else if (bar.bottom > tall || box.top < 0) ui.controls.scrollIntoView({ behavior: behavior, block: 'end' });
    }

    /* If the control that had focus has just been disabled or hidden, hand focus to the next sensible one. */
    function keepFocus(wasInside) {
      if (!wasInside) return;
      var active = document.activeElement;
      var lost = !active || active === document.body || active.disabled || (root.contains(active) && active.closest('[hidden]'));
      if (!lost) return;
      var order = waiting() && !state.stopped ? [ui.approve] : [ui.next, ui.run, ui.reset, ui.off];
      for (var i = 0; i < order.length; i++) {
        if (!order[i].disabled) { order[i].focus({ preventScroll: true }); return; }
      }
    }
    function inside() { return root.contains(document.activeElement); }

    /* ----- moving through the run ----- */
    function step() {
      if (state.stopped || done() || waiting()) return false;
      state.step += 1;
      if (STEP_LOG[state.step]) addRows(STEP_LOG[state.step]);
      return true;
    }
    function advance() {
      var had = inside();
      if (!step()) return;
      if (done()) state.auto = false;
      paint();
      keepFocus(had);
      follow(stepNode(state.step));
    }
    function play() {
      window.clearTimeout(timer);
      if (!state.auto || state.stopped || waiting() || done()) return;
      if (calm()) {
        /* No timed playback with motion off: go straight to the next point where a person is needed. */
        var had = inside();
        while (step()) { /* keep going */ }
        if (done()) state.auto = false;
        paint(null, true);
        keepFocus(had);
        follow(stepNode(state.step));
        return;
      }
      timer = window.setTimeout(function () { advance(); play(); }, STEP_MS);
    }

    function decide(kind) {
      if (state.stopped || !waiting()) return;
      var had = inside();
      state.decision = kind;
      state.step = 7;
      addRows({ after: 800, rows: DECISION_LOG[kind] });
      ui.editor.hidden = true;
      ui.edit.setAttribute('aria-expanded', 'false');
      paint();
      keepFocus(had);
      follow(stepNode(7));
      play();
    }

    /* ----- wiring ----- */
    ui.next.addEventListener('click', advance);
    ui.run.addEventListener('click', function () {
      if (state.auto) {
        state.auto = false;
        window.clearTimeout(timer);
        paint();
        return;
      }
      state.auto = true;
      if (calm()) { play(); return; }
      advance();
      play();
    });
    ui.reset.addEventListener('click', function () {
      window.clearTimeout(timer);
      fresh();
      painted = 0;
      ui.editor.hidden = true;
      ui.edit.setAttribute('aria-expanded', 'false');
      ui.editText.value = '';
      ui.editError.textContent = '';
      paint('Reset.', true);
      ui.next.focus({ preventScroll: true });
      if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: calm() ? 'instant' : 'smooth', block: 'start' });
    });
    ui.off.addEventListener('click', function () {
      window.clearTimeout(timer);
      if (!state.stopped) {
        state.stopped = true;
        state.auto = false;
        addRows({ after: 4, rows: [['Stopped by a person', NO_RISK, SWITCH]] });
        paint();
      } else {
        state.stopped = false;
        addRows({ after: 25, rows: [['Switched back on by a person', NO_RISK, SWITCH]] });
        paint('Switched back on.');
      }
    });
    ui.approve.addEventListener('click', function () { decide('approve'); });
    ui.reject.addEventListener('click', function () { decide('reject'); });
    ui.edit.addEventListener('click', function () {
      if (ui.editor.hidden) {
        if (!ui.editText.value) ui.editText.value = draftText;
        ui.editor.hidden = false;
        ui.edit.setAttribute('aria-expanded', 'true');
        ui.editText.focus({ preventScroll: true });
        follow(stepNode(APPROVAL));
      } else {
        ui.editor.hidden = true;
        ui.edit.setAttribute('aria-expanded', 'false');
      }
    });
    ui.cancelEdit.addEventListener('click', function () {
      ui.editor.hidden = true;
      ui.edit.setAttribute('aria-expanded', 'false');
      ui.editError.textContent = '';
      ui.edit.focus();
    });
    ui.sendEdit.addEventListener('click', function () {
      var text = ui.editText.value.trim();
      if (!text) {
        ui.editError.textContent = 'The reply is empty. Write a reply, or cancel and reject.';
        ui.editText.focus();
        return;
      }
      ui.editError.textContent = '';
      state.edited = text;
      decide('edit');
    });
    ui.editText.addEventListener('input', function () { ui.editError.textContent = ''; });
    window.addEventListener('resize', fitLog);

    /* First paint: show the controls and step 1, and stay quiet for screen readers while that happens. */
    fresh();
    ui.status.setAttribute('aria-live', 'off');
    root.classList.add('demo-live');
    ui.controls.hidden = false;
    paint(null, true);
    window.setTimeout(function () { ui.status.removeAttribute('aria-live'); }, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
