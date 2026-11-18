/* Capra Studios: "Ask a second brain" demo.
   Hand-built and static: no AI calls, no network requests, no dependencies.
   It reads window.CAPRA_BRAIN_DEMO (brain-data.js) and shows prepared answers with their sources.
   Without this script, or without the data, the markup still shows the first question and its answer. */
(function () {
  'use strict';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var SMALL_WORDS = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'can', 'do', 'does', 'for', 'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'our', 's', 'should', 'the', 'there', 'to', 'we', 'what', 'when', 'who', 'with'];
  var NO_MATCH = 'This demo only has prepared questions. A real second brain answers anything in your documents.';
  var CANNOT_OPEN = 'That answer rests on a document this role cannot open.';

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function niceDate(iso) {
    var p = String(iso).split('-');
    return MONTHS[Number(p[1]) - 1] + ' ' + Number(p[2]) + ', ' + p[0];
  }
  function andList(list) {
    return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  function theRole(role) { return role === 'crew lead' ? 'a crew lead' : 'the ' + role; }
  function words(s) { return String(s).toLowerCase().replace(/[^a-z0-9$]+/g, ' ').split(' ').filter(Boolean); }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
  function calm() {
    return document.documentElement.classList.contains('motion-off') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* The document body as one paragraph, with the supporting passages wrapped in <mark>. */
  function markedBody(body, passages) {
    var p = make('p', 'brain-doc-body');
    var spans = [];
    passages.forEach(function (text) {
      var at = body.indexOf(text);
      if (at > -1) spans.push([at, at + text.length]);
    });
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var pos = 0;
    spans.forEach(function (span) {
      if (span[0] < pos) return;
      if (span[0] > pos) p.appendChild(document.createTextNode(body.slice(pos, span[0])));
      p.appendChild(make('mark', null, body.slice(span[0], span[1])));
      pos = span[1];
    });
    if (pos < body.length) p.appendChild(document.createTextNode(body.slice(pos)));
    return p;
  }

  function sourcePanel(doc, passages, open) {
    var details = make('details', 'brain-source');
    details.open = !!open;
    var summary = make('summary');
    var title = make('b', null, doc.title);
    title.appendChild(make('small', null, cap(doc.type) + ' · ' + doc.owner + ' · ' + niceDate(doc.date)));
    var plus = make('span', null, '+');
    plus.setAttribute('aria-hidden', 'true');
    summary.appendChild(title);
    summary.appendChild(plus);
    details.appendChild(summary);
    details.appendChild(markedBody(doc.body, passages));
    details.appendChild(make('p', 'brain-doc-readers', 'Open to: ' + andList(doc.roles) + '.'));
    return details;
  }

  function mount() {
    var root = document.getElementById('brain-demo');
    var data = window.CAPRA_BRAIN_DEMO;
    if (!root || root.getAttribute('data-mounted')) return;
    if (!data || !data.documents || !data.questions || !data.questions.length) return;

    var find = function (name) { return root.querySelector('[data-brain="' + name + '"]'); };
    var ui = {
      ask: find('ask'), who: find('who'), roles: find('roles'), scope: find('scope'), view: find('view'),
      filter: root.querySelector('.brain-filter'), filterStatus: find('filter-status'), questions: find('questions'),
      count: find('count'), next: find('next'), result: find('result'), sources: find('sources')
    };
    for (var key in ui) { if (!ui[key]) return; }
    root.setAttribute('data-mounted', 'true');

    var docs = {};
    data.documents.forEach(function (doc) { docs[doc.id] = doc; });
    var secondHolds = {};
    var secondBrain = data.secondBrain || { person: 'Dana', documents: [] };
    secondBrain.documents.forEach(function (id) { secondHolds[id] = true; });
    var firstName = String(secondBrain.person).split(' ')[0];
    var roles = data.roles && data.roles.length ? data.roles : ['crew lead', 'office manager', 'owner'];
    var state = { mode: 'second', role: roles[0], q: data.questions[0].id };

    var modeButtons = Array.prototype.slice.call(ui.who.querySelectorAll('[data-mode]'));
    var roleButtons = Array.prototype.slice.call(ui.roles.querySelectorAll('[data-role]'));

    function canOpen(doc) {
      return state.mode === 'second' ? !!secondHolds[doc.id] : doc.roles.indexOf(state.role) > -1;
    }

    /* ----- the prepared questions ----- */
    var items = data.questions.map(function (q, index) {
      var li = make('li');
      var button = make('button', null, q.question);
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () { pick(q.id, true); });
      li.appendChild(button);
      ui.questions.appendChild(li);
      return { q: q, li: li, button: button, index: index, hay: words(q.question + ' ' + (q.keywords || []).join(' ')).join(' ') };
    });
    function current() {
      for (var i = 0; i < items.length; i++) { if (items[i].q.id === state.q) return items[i]; }
      return items[0];
    }
    function visible() { return items.filter(function (item) { return !item.li.hidden; }); }

    /* Typing narrows the list. It never answers free text. */
    function applyFilter() {
      var typed = words(ui.filter.value);
      var tokens = typed.filter(function (t) { return SMALL_WORDS.indexOf(t) < 0; });
      if (!tokens.length) tokens = typed;
      var shown = 0;
      items.forEach(function (item) {
        var hit = tokens.every(function (t) { return item.hay.indexOf(t) > -1; });
        item.li.hidden = !hit;
        if (hit) shown++;
      });
      ui.next.disabled = !shown;
      if (!typed.length) setText(ui.filterStatus, 'Typing narrows the ' + items.length + ' prepared questions. It does not answer free text.');
      else if (!shown) setText(ui.filterStatus, NO_MATCH);
      else setText(ui.filterStatus, shown + ' of ' + items.length + ' prepared questions match.');
    }

    /* ----- the answer and its sources ----- */
    function scopeText() {
      var all = data.documents.length;
      var open = data.documents.filter(canOpen).length;
      if (state.mode === 'second') {
        return firstName + '’s second brain holds ' + open + ' of the ' + all + ' documents: her own notes and the crew documents.';
      }
      return 'The Third Brain holds all ' + all + ' documents. ' + cap(theRole(state.role)) + ' can open ' + (open === all ? 'all of them' : open + ' of them') + '.';
    }

    function jumpButton(label, go) {
      var button = make('button', 'brain-jump', label);
      button.type = 'button';
      button.addEventListener('click', go);
      return button;
    }

    function render(fresh) {
      var item = current();
      var q = item.q;
      var fade = fresh ? 'brain-fade is-new' : 'brain-fade';

      setText(ui.scope, scopeText());
      setText(ui.count, 'Prepared question ' + (item.index + 1) + ' of ' + items.length);
      modeButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state.mode)); });
      roleButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-role') === state.role)); });
      ui.roles.hidden = state.mode !== 'third';
      items.forEach(function (other) { other.button.setAttribute('aria-pressed', String(other === item)); });

      var sources = q.sources.map(function (s) { return { doc: docs[s.doc], passages: s.passages || [] }; })
        .filter(function (s) { return s.doc; });
      var closed = sources.filter(function (s) { return !canOpen(s.doc); });
      var answer = make('div', fade);
      var proof = make('div', fade);
      answer.appendChild(make('h4', null, q.question));

      function tagLine(text) {
        var line = make('p', 'brain-flagline');
        line.appendChild(make('span', 'demo-tag', text));
        answer.appendChild(line);
      }

      if (!closed.length) {
        if (q.noAnswer) tagLine('Not in the documents');
        answer.appendChild(make('p', 'brain-text', q.answer));
        var cite = make('p', 'brain-cite', q.noAnswer ? 'Closest document: ' : (sources.length > 1 ? 'Sources: ' : 'Source: '));
        sources.forEach(function (s, i) {
          if (i) cite.appendChild(document.createTextNode(' and '));
          cite.appendChild(make('b', null, s.doc.title));
        });
        answer.appendChild(cite);

        var head = make('div', 'brain-sources-head');
        head.appendChild(make('p', 'demo-label', q.noAnswer ? 'Closest document' : (sources.length > 1 ? 'The sources' : 'The source')));
        if (!q.noAnswer) head.appendChild(make('p', 'hand', 'underlined: what it rests on'));
        proof.appendChild(head);
        sources.forEach(function (s, i) { proof.appendChild(sourcePanel(s.doc, s.passages, i === 0)); });
      } else if (q.noAnswer) {
        tagLine('Not in the documents');
        answer.appendChild(make('p', 'brain-text', 'The documents this view can open do not say.'));
      } else {
        var many = closed.length > 1;
        tagLine('Withheld');
        if (state.mode === 'second') {
          answer.appendChild(make('p', 'brain-text', firstName + '’s second brain does not hold the ' + (many ? 'documents' : 'document') + ' this answer rests on.'));
          answer.appendChild(make('p', 'brain-why', 'It holds her own notes and the crew documents. The Third Brain holds the whole company’s documents, with permissions by role.'));
          answer.appendChild(jumpButton('Ask the Third Brain', function () {
            state.mode = 'third';
            render(true);
            modeButtons.forEach(function (b) { if (b.getAttribute('data-mode') === 'third') b.focus(); });
          }));
        } else {
          var readers = roles.filter(function (role) {
            return closed.every(function (s) { return s.doc.roles.indexOf(role) > -1; });
          });
          answer.appendChild(make('p', 'brain-text', many ? 'That answer rests on documents this role cannot open.' : CANNOT_OPEN));
          if (readers.length) {
            answer.appendChild(make('p', 'brain-why', (many ? 'They are' : 'It is') + ' open to ' +
              andList(readers.map(function (r) { return 'the ' + r; })) + (readers.length === 1 ? ' only.' : '.')));
            answer.appendChild(jumpButton('Ask as ' + readers[0], function () {
              state.role = readers[0];
              render(true);
              roleButtons.forEach(function (b) { if (b.getAttribute('data-role') === readers[0]) b.focus(); });
            }));
          }
        }
        var locked = make('div', 'brain-locked');
        var line = make('p');
        line.appendChild(make('b', null, closed.length + (many ? ' documents withheld. ' : ' document withheld. ')));
        line.appendChild(document.createTextNode('This view does not show ' + (many ? 'their titles or their contents.' : 'its title or its contents.')));
        locked.appendChild(line);
        proof.appendChild(locked);
      }

      ui.result.textContent = '';
      ui.result.appendChild(answer);
      ui.sources.textContent = '';
      ui.sources.hidden = !proof.firstChild;
      if (proof.firstChild) ui.sources.appendChild(proof);
    }

    /* On one column the answer sits below the question list, so bring it into view when a question is picked:
       the line that says who is asking goes to the top, with the answer straight under it.
       On two columns the page only moves if the answer column has scrolled off the top. */
    function reveal() {
      var tall = window.innerHeight || document.documentElement.clientHeight;
      var oneColumn = window.matchMedia && window.matchMedia('(max-width: 800px)').matches;
      var box = (oneColumn ? ui.result : ui.view).getBoundingClientRect();
      if (box.top < 0 || (oneColumn && box.top > tall * 0.4)) {
        (oneColumn ? ui.scope : ui.view).scrollIntoView({ behavior: calm() ? 'instant' : 'smooth', block: 'start' });
      }
    }

    function pick(id, show) {
      state.q = id;
      render(true);
      if (show) reveal();
    }

    /* ----- wiring ----- */
    modeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var mode = button.getAttribute('data-mode');
        if (mode === state.mode) return;
        state.mode = mode;
        render(true);
      });
    });
    roleButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var role = button.getAttribute('data-role');
        if (role === state.role) return;
        state.role = role;
        render(true);
      });
    });
    ui.filter.addEventListener('input', applyFilter);
    ui.filter.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      var first = visible()[0];
      if (first) first.button.focus();
    });
    ui.next.addEventListener('click', function () {
      var list = visible();
      if (!list.length) return;
      var at = list.indexOf(current());
      pick(list[(at + 1) % list.length].q.id, false);
    });

    /* First paint: same state as the markup, so stay quiet for screen readers while the controls appear. */
    ui.result.setAttribute('aria-live', 'off');
    ui.scope.setAttribute('aria-live', 'off');
    ui.filterStatus.setAttribute('aria-live', 'off');
    root.classList.add('demo-live');
    ui.ask.hidden = false;
    ui.who.hidden = false;
    ui.next.hidden = false;
    applyFilter();
    render(false);
    window.setTimeout(function () {
      ui.result.setAttribute('aria-live', 'polite');
      ui.scope.removeAttribute('aria-live');
      ui.filterStatus.removeAttribute('aria-live');
    }, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
