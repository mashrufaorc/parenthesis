/* Parenthesis — ui/games/bst.js
 * Unit 12 (BST Builder, Search & Walk, Hibbard Deletion) and Unit 13 (Rotation
 * Lab, Splay It, Hot Keys). Every path, case, successor and rotation comes from
 * engine/bst.js, which tests cross-check against the lecture Lisp.
 */
(function (root) {
  'use strict';
  var CQ = root.CQ, U = CQ.ui, E = CQ.engine, B = E.bst, G = CQ.games, h = U.h;

  /* View with per-key state / badge / sub. */
  function view(rt, st) {
    st = st || {};
    var v = B.view(rt);
    (function w(x) {
      if (!x || x.hidden) return;
      var k = x.key;
      x.state = st.state ? st.state[k] || null : null;
      x.badge = st.badge ? st.badge[k] || null : null;
      if (st.sub && st.sub[k] != null) x.sub = st.sub[k];
      x.children.forEach(w);
    })(v);
    return v;
  }
  function tview(el, label, onPick, selectable) {
    return U.treeView(el, { label: label, nodeW: 42, gapX: 6, slots: true, onPick: onPick,
      selectable: function (x) { return !x.hidden && (!selectable || selectable(x)); } });
  }
  function randomKeys(n, seed, lo, hi) {
    var r = E.rng(seed), out = [], used = {};
    lo = lo || 10; hi = hi || 99;
    while (out.length < n) { var k = E.randInt(r, lo, hi); if (!used[k]) { used[k] = 1; out.push(k); } }
    return out;
  }
  /* A random tree that isn't too lopsided (height ≤ size/2 + 1). */
  function niceTree(n, seed) {
    for (var t = 0; t < 40; t++) { var ks = randomKeys(n, seed + t * 7919); var rt = B.build(ks); if (B.height(rt) <= Math.ceil(n / 2) + 1) return { keys: ks, root: rt }; }
    var k2 = randomKeys(n, seed); return { keys: k2, root: B.build(k2) };
  }
  function keysOf(rt) { return B.inorder(rt); }

  /* ================= Unit 12 ================= */

  /* ---------- BST Builder: insert keys by choosing left/right at each node ---------- */
  G.bstBuildTask = function (el, opts) {
    var T = opts.unit.templates, keys = opts.keys, rt = null, k = 0, misses = 0, hints = 0;
    var head = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(head);
    var queue = h('p.small'); el.appendChild(queue);
    var tv = tview(el, 'Binary search tree');
    var row = h('div.choice-row'); el.appendChild(row);
    var tools = h('div.tools'); el.appendChild(tools);
    var fb = U.feedback(el);
    var cur = null, step = 0;
    if (opts.hints) tools.appendChild(U.button('Why?', function () { if (!cur || step >= cur.path.length) return; hints++; fb.show({ info: true, title: 'Rule', why: whyAt() }); }));
    function whyAt() { var at = cur.path[step], d = cur.dirs[step]; return U.fmt(T.buildWhy, { k: keys[k], at: at, rel: d === 'L' ? '<' : '>', dir: d === 'L' ? 'left' : 'right' }); }
    function draw() {
      var st = { state: {}, badge: {} };
      if (cur) { cur.path.slice(0, step).forEach(function (p) { st.state[p] = 'done'; }); if (step < cur.path.length) { st.state[cur.path[step]] = 'active'; st.badge[cur.path[step]] = keys[k] + '?'; } }
      tv.render(rt ? view(rt, st) : null);
      queue.textContent = 'Keys to insert: ' + keys.map(function (x, i) { return i < k ? '✓' + x : i === k ? '[' + x + ']' : String(x); }).join(' ');
    }
    function nextKey() {
      fb.hide();
      if (k >= keys.length) {
        U.clear(row); U.clear(tools);
        head.textContent = 'All ' + keys.length + ' keys inserted. Height ' + B.height(rt) + '; in-order: ' + B.inorder(rt).join(' ') + '.';
        draw();
        return opts.onDone({ misses: misses, hints: hints, summary: keys.length + ' keys, height ' + B.height(rt) + '.' });
      }
      cur = B.insert(rt, keys[k]); step = 0;
      if (!rt) { rt = cur.root; k++; return nextKey(); }   // the first key becomes the root
      ask();
    }
    function ask() {
      draw();
      head.innerHTML = ''; head.appendChild(U.rich(U.fmt(T.buildPrompt, { k: keys[k], at: cur.path[step] })));
      U.clear(row);
      [['L', '← Left (smaller)'], ['R', 'Right (larger) →']].forEach(function (d) {
        row.appendChild(U.button(d[1], function () { choose(d[0]); }, { cls: 'choice' }));
      });
      var f = row.querySelector('button'); if (f) setTimeout(function () { f.focus(); }, 20);
    }
    function choose(d) {
      if (d === cur.dirs[step]) {
        CQ.store.record('bst-insert', true, true);
        step++;
        if (step >= cur.path.length) {
          rt = cur.root; draw();
          fb.show({ ok: true, title: 'Placed ' + keys[k], why: U.fmt(T.buildDone, { k: keys[k], side: cur.side === 'L' ? 'left' : 'right', parent: cur.parentKey, h: B.height(rt) }) });
          k++; U.clear(row);
          var b = U.button('Next key', function () { nextKey(); }, { cls: 'primary' }); row.appendChild(b); setTimeout(function () { b.focus(); }, 20);
        } else { fb.hide(); ask(); }
      } else {
        misses++; CQ.store.record('bst-property', false, true);
        if (opts.gameId) CQ.store.noteMiss(opts.gameId, 'bst-property');
        fb.show({ ok: false, title: 'Other way', why: whyAt() });
      }
    }
    nextKey();
  };

  function build(el, ctx) {
    var L0 = ctx.level, keys = L0.keys || randomKeys(ctx.size || 8, ctx.seed);
    G.bstBuildTask(el, { unit: ctx.unit, keys: keys, hints: ctx.hints, gameId: ctx.gameId, onDone: function (r) {
      CQ.store.noteRound(ctx.gameId, r.misses === 0);
      G.continueBtn(el, 'Finish level', function () { ctx.complete({ stars: G.stars(r.hints, r.misses === 0), summary: r.summary + ' ' + r.misses + ' wrong turn(s).' }); });
    } });
  }

  /* ---------- Balanced vs degenerate ---------- */
  function shape(el, ctx) {
    var ks = [40, 20, 60, 10, 30, 50, 70], sorted = ks.slice().sort(function (a, b) { return a - b; });
    var hb = B.height(B.build(ks)), hs = B.height(B.build(sorted));
    var q = G.choiceQ({ id: 'bst-shape', concept: 'degenerate', seed: ctx.seed, prompt: 'Insert the same 7 keys in two orders: (' + ks.join(' ') + ') and (' + sorted.join(' ') + '). What are the two heights?',
      misconception: 'The shape depends only on which keys are stored.',
      options: [
        { text: hb + ' and ' + hs, ok: true, why: 'Middle-first order gives a bushy tree; sorted order sends every key right.' },
        { text: hb + ' and ' + hb, misconception: true, why: 'The order matters: sorted keys always go right.' },
        { text: (hb + 1) + ' and ' + (hs + 1), why: 'Height counts edges, not nodes.' },
        { text: hs + ' and ' + hb, why: 'It\'s the sorted order that makes the chain.' }
      ] });
    G.predictThen(el, q, 'Build both ▶', function (ft) {
      var cols = h('div.rec-cols'); el.appendChild(cols);
      [[ks, 'Middle first'], [sorted, 'Sorted']].forEach(function (p) {
        var c = h('div'); cols.appendChild(c);
        c.appendChild(h('h3.pane-title', null, p[1] + ': height ' + B.height(B.build(p[0]))));
        var rt = B.build(p[0]), worst = 0; keysOf(rt).forEach(function (k) { worst = Math.max(worst, B.search(rt, k).comparisons); });
        tview(c, p[1] + ' tree').render(view(rt));
        c.appendChild(h('p.small', null, 'Worst search: ' + worst + ' comparisons (h + 1).'));
      });
      G.note(el, 'With n keys: balanced height ≈ log₂ n, degenerate height n − 1. Searching 1,000,000 sorted-inserted keys could take 1,000,000 comparisons instead of 20.');
      CQ.store.noteRound(ctx.gameId, ft);
      G.continueBtn(el, 'Finish level', function () { ctx.complete({ stars: G.stars(0, ft), summary: 'Heights ' + hb + ' vs ' + hs + ': the order decides the shape.' }); });
    });
  }

  /* ---------- Search & Walk ---------- */
  function walkTask(el, opts) {
    var T = opts.unit.templates, rt = opts.root, task = opts.task, r = E.rng(opts.seed), all = keysOf(rt);
    var path, k = null, single = false, concept = 'bst-search', why;
    if (task === 'search') { k = all[E.randInt(r, 0, all.length - 1)]; path = B.search(rt, k).path; }
    else if (task === 'searchMiss') { do { k = E.randInt(r, 5, 99); } while (all.indexOf(k) >= 0); path = B.search(rt, k).path; }
    else if (task === 'min') { path = B.minPath(rt); concept = 'ordered-ops'; }
    else if (task === 'max') { path = B.maxPath(rt); concept = 'ordered-ops'; }
    else {
      concept = 'ordered-ops'; single = true;
      var cands = all.filter(function (x) { return task === 'succ' ? B.succ(rt, x) != null : B.pred(rt, x) != null; });
      var withSub = cands.filter(function (x) { var n = B.find(rt, x); return task === 'succ' ? n.rc : n.lc; });
      var pool = withSub.length && r() < 0.65 ? withSub : cands;
      k = pool[E.randInt(r, 0, pool.length - 1)];
      var ans = task === 'succ' ? B.succ(rt, k) : B.pred(rt, k), node = B.find(rt, k);
      path = [ans];
      why = task === 'succ'
        ? (node.rc ? k + ' has a right subtree, so its successor is the minimum there: go right to ' + node.rc.key + ', then left as far as possible: ' + ans + '.' : k + ' has no right subtree, so its successor is the nearest ancestor that ' + k + ' sits to the left of: ' + ans + '.')
        : (node.lc ? k + ' has a left subtree, so its predecessor is the maximum there: go left to ' + node.lc.key + ', then right as far as possible: ' + ans + '.' : k + ' has no left subtree, so its predecessor is the nearest ancestor that ' + k + ' sits to the right of: ' + ans + '.');
    }
    var p = h('p.q-prompt', { 'aria-live': 'polite' }); p.appendChild(U.rich(U.fmt(T.walk[task], { k: k }))); el.appendChild(p);
    var stepI = 0, misses = 0, hints = 0, done = false, bad = null;
    var tv = tview(el, 'Binary search tree', pick, function () { return !done; });
    var out = h('p.status', { 'aria-live': 'polite' }); el.appendChild(out);
    var tools = h('div.tools'); el.appendChild(tools);
    var fb = U.feedback(el);
    function ruleAt(i) {
      var at = path[i - 1];
      if (task === 'min') return 'The minimum is found by following lc until it is NIL: from ' + at + ' go left.';
      if (task === 'max') return 'The maximum is found by following rc until it is NIL: from ' + at + ' go right.';
      return k + (k < at ? ' < ' + at + ': go left.' : ' > ' + at + ': go right.');
    }
    if (opts.hints) tools.appendChild(U.button('Why?', function () { if (done) return; hints++; fb.show({ info: true, title: 'Rule', why: single ? why.split(',')[0] + '.' : stepI === 0 ? 'Every search starts at the root.' : ruleAt(stepI) }); }));
    function draw() {
      var st = { state: {}, badge: {} };
      path.slice(0, stepI).forEach(function (x, i) { st.state[x] = 'done'; st.badge[x] = '#' + (i + 1); });
      if (k != null && !single && all.indexOf(k) >= 0 && done) st.state[k] = 'ok';
      if (single && k != null) { st.state[k] = st.state[k] || 'hit'; st.badge[k] = st.badge[k] || 'k'; }
      if (bad != null) st.state[bad] = 'bad';
      tv.render(view(rt, st));
      if (!single) out.textContent = 'Comparisons: ' + stepI + (stepI ? ' · path ' + path.slice(0, stepI).join(' → ') : '');
    }
    function pick(x) {
      if (done) return;
      bad = null;
      if (x.key === path[stepI]) {
        CQ.store.record(concept, true, true);
        stepI++; fb.hide();
        if (stepI >= path.length) {
          done = true; U.clear(tools);
          var msg = single ? why
            : task === 'searchMiss' ? 'The next link is NIL, so ' + k + ' is not in the tree: ' + path.length + ' comparisons, then BST-SEARCH returns NIL.'
            : task === 'search' ? 'Found ' + k + ' with ' + path.length + ' comparisons: its depth + 1.'
            : (task === 'min' ? 'Minimum: ' : 'Maximum: ') + path[path.length - 1] + '. ' + path.length + ' nodes on the path.';
          fb.show({ ok: true, title: 'Right', why: msg });
          draw();
          return opts.onDone({ misses: misses, hints: hints });
        }
      } else {
        misses++; bad = x.key; CQ.store.record(concept, false, true);
        if (opts.gameId) CQ.store.noteMiss(opts.gameId, concept);
        var w = single ? why : stepI === 0 ? 'Every search starts at the root, ' + path[0] + '.' : ruleAt(stepI) + ' The next node is ' + path[stepI] + '.';
        fb.show({ ok: false, title: 'Not ' + x.key, why: w, misconception: task === 'succ' && x.key === (B.find(rt, k).rc || {}).key && x.key !== path[0] ? 'The successor is always the right child.' : null });
      }
      draw();
    }
    draw();
    setTimeout(function () { tv.focus(); }, 40);
  }
  function walk(el, ctx) {
    var tasks = ctx.level.tasks, i = 0, misses = 0, hints = 0;
    var area = h('div'); el.appendChild(area);
    function next() {
      U.clear(area);
      if (i >= tasks.length) { CQ.store.noteRound(ctx.gameId, misses === 0); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(hints, misses === 0), summary: tasks.length + ' walks, ' + misses + ' wrong tap(s).' }); }); }
      area.appendChild(h('h3', null, 'Walk ' + (i + 1) + ' of ' + tasks.length));
      var t = niceTree(9, ctx.seed + i * 31);
      walkTask(area, { unit: ctx.unit, root: t.root, task: tasks[i], seed: ctx.seed + i, hints: ctx.hints, gameId: ctx.gameId, onDone: function (r) { misses += r.misses; hints += r.hints; i++; G.continueBtn(area, 'Next', next); } });
    }
    next();
  }

  /* ---------- Hibbard Deletion ---------- */
  function delTask(el, opts) {
    var T = opts.unit.templates, rt = opts.root, k = opts.key, info = B.remove(rt, k), node = B.find(rt, k), misses = 0;
    var cs = info.case, repl = cs === 2 ? info.successor : cs === 1 ? (node.lc || node.rc).key : null;
    var p = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(p);
    var phase = 'case', bad = null;
    var tv = tview(el, 'Binary search tree', pick, function () { return phase === 'tap'; });
    var row = h('div.choice-row'); el.appendChild(row);
    var fb = U.feedback(el);
    function draw() { var st = { state: {}, badge: {} }; st.state[k] = 'hit'; st.badge[k] = 'del'; if (bad != null) st.state[bad] = 'bad'; tv.render(view(rt, st)); }
    function askCase() {
      p.innerHTML = ''; p.appendChild(U.rich(U.fmt(T.caseQ, { k: k })));
      var tries = 0;
      ['0 children: unlink it', '1 child: link past it', '2 children: the successor moves in'].forEach(function (lab, c) {
        var b = U.button(lab, function () {
          if (b.disabled) return;
          if (c === cs) {
            CQ.store.record('hibbard', true, tries === 0);
            fb.show({ ok: true, title: 'Case: ' + c + ' child' + (c === 1 ? '' : 'ren'), why: U.fmt(T.caseWhy[c], { k: k }) });
            U.clear(row);
            if (cs === 0) return finish();
            phase = 'tap'; p.innerHTML = '';
            p.appendChild(U.rich(cs === 2 ? U.fmt(T.succQ, { k: k }) : 'Tap the node that takes ' + k + '\'s place.'));
            draw(); setTimeout(function () { tv.focus(); }, 30);
          } else {
            tries++; misses++; b.disabled = true; CQ.store.record('hibbard', false, tries === 1);
            if (opts.gameId) CQ.store.noteMiss(opts.gameId, 'hibbard');
            fb.show({ ok: false, title: 'Count ' + k + '\'s children', why: k + ' has ' + B.children(node) + ' child' + (B.children(node) === 1 ? '' : 'ren') + '. ' + U.fmt(T.caseWhy[cs], { k: k }) });
          }
        }, { cls: 'choice' });
        row.appendChild(b);
      });
      draw();
    }
    function pick(x) {
      if (phase !== 'tap') return;
      if (x.key === repl) { CQ.store.record('hibbard', true, true); bad = null; finish(); }
      else {
        misses++; bad = x.key; CQ.store.record('hibbard', false, true);
        var pred = B.pred(rt, k);
        fb.show({ ok: false, title: 'Not ' + x.key, why: cs === 2 ? U.fmt(T.succWhy, { k: k, s: repl }) : k + '\'s only child, ' + repl + ', takes its place (with its whole subtree).',
          misconception: cs === 2 && x.key === pred ? 'Hibbard deletion uses the predecessor.' : null });
        draw();
      }
    }
    function finish() {
      phase = 'done';
      var nt = info.root;
      el.appendChild(h('h3.pane-title', null, 'After (setf root (bst-delete root ' + k + '))'));
      var st = { state: {}, badge: {} }; if (repl != null) { st.state[repl] = 'ok'; st.badge[repl] = 'moved'; }
      tview(el, 'Tree after deletion').render(nt ? view(nt, st) : null);
      var sorted = B.inorder(nt).join(' ');
      fb.show({ ok: true, title: k + ' deleted', why: (cs === 2 ? U.fmt(T.succWhy, { k: k, s: repl }) + ' ' : '') + 'In-order is still sorted: ' + (sorted || '(empty)') + '.' });
      opts.onDone({ misses: misses, root: nt });
    }
    askCase();
  }
  function del(el, ctx) {
    var L0 = ctx.level, count = L0.count, i = 0, misses = 0, r = E.rng(ctx.seed);
    var area = h('div'); el.appendChild(area);
    function pickKey(rt, wantCase) {
      var ks = keysOf(rt).filter(function (k) { return B.children(B.find(rt, k)) === wantCase; });
      return ks.length ? ks[E.randInt(r, 0, ks.length - 1)] : keysOf(rt)[0];
    }
    function next() {
      U.clear(area);
      if (i >= count) { CQ.store.noteRound(ctx.gameId, misses === 0); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(0, misses === 0), summary: count + ' deletions, ' + misses + ' slip(s).' }); }); }
      var t = niceTree(L0.rootFirst ? 11 : 9, ctx.seed + i * 17), rt = t.root, k;
      if (L0.rootFirst && i === 0) { for (var tr = 1; B.children(rt) < 2; tr++) rt = niceTree(11, ctx.seed + tr * 101).root; k = rt.key; }
      else k = pickKey(rt, L0.rootFirst ? [2, 1, 0, 2][i % 4] : [0, 1, 2][i % 3]);
      area.appendChild(h('h3', null, 'Deletion ' + (i + 1) + ' of ' + count));
      delTask(area, { unit: ctx.unit, root: rt, key: k, gameId: ctx.gameId, onDone: function (res) { misses += res.misses; i++; G.continueBtn(area, 'Next', next); } });
    }
    next();
  }

  /* ================= Unit 13 ================= */

  /* ---------- Rotation Lab ---------- */
  function rotateTask(el, opts) {
    var T = opts.unit.templates, rt = opts.root, x = opts.key, rot = B.rotateUp(rt, x), misses = 0;
    var xn = B.find(rt, x), p = rot.parent, pn = B.find(rt, p);
    var side = rot.kind === 'LT' ? 'right' : 'left', pside = rot.kind === 'LT' ? 'left' : 'right';
    var q1 = h('p.q-prompt', { 'aria-live': 'polite' }); q1.appendChild(U.rich(U.fmt(T.rotQ, { x: x, p: p }))); el.appendChild(q1);
    var st = { state: {}, badge: {} }; st.state[x] = 'active'; st.badge[x] = 'x'; st.state[p] = 'hit'; st.badge[p] = 'p'; if (rot.grandparent != null) st.badge[rot.grandparent] = 'g';
    tview(el, 'Before the rotation').render(view(rt, st));
    var row = h('div.choice-row'); el.appendChild(row);
    var fb = U.feedback(el);
    var tries = 0;
    [['LT', 'LT-Rot (x is a left child)'], ['RT', 'RT-Rot (x is a right child)']].forEach(function (o) {
      var b = U.button(o[1], function () {
        if (b.disabled) return;
        if (o[0] === rot.kind) { CQ.store.record('rotation', true, tries === 0); fb.show({ ok: true, title: o[0] + '-Rot', why: U.fmt(T.rotWhy[rot.kind], { x: x, p: p }) }); U.clear(row); askMoved(); }
        else { tries++; misses++; b.disabled = true; CQ.store.record('rotation', false, tries === 1); if (opts.gameId) CQ.store.noteMiss(opts.gameId, 'rotation'); fb.show({ ok: false, title: 'Look at which side', why: x + ' is ' + p + '\'s ' + (rot.kind === 'LT' ? 'left' : 'right') + ' child. ' + U.fmt(T.rotWhy[rot.kind], { x: x, p: p }) }); }
      }, { cls: 'choice' });
      row.appendChild(b);
    });
    function askMoved() {
      var q2 = h('p.q-prompt'); q2.appendChild(U.rich(U.fmt(T.movedQ, { x: x, p: p }))); el.appendChild(q2);
      var opts2 = [];
      function sub(n, lab) { if (n) opts2.push({ key: n.key, text: 'The subtree rooted at ' + n.key + ' (' + lab + ')' }); }
      sub(rot.kind === 'LT' ? xn.rc : xn.lc, x + '\'s ' + side + ' subtree');
      sub(rot.kind === 'LT' ? xn.lc : xn.rc, x + '\'s ' + pside + ' subtree');
      sub(rot.kind === 'LT' ? pn.rc : pn.lc, p + '\'s other subtree');
      opts2.push({ key: null, text: 'Nothing: that subtree is empty' });
      var row2 = h('div.choices'); el.appendChild(row2);
      var fb2 = U.feedback(el), t2 = 0;
      E.shuffle(opts2, E.rng(opts.seed || 3)).forEach(function (o) {
        var b = U.button(o.text, function () {
          if (b.disabled) return;
          var why = rot.moved != null ? U.fmt(T.movedWhy.some, { x: x, p: p, side: side, pside: pside, m: rot.moved }) : U.fmt(T.movedWhy.none, { x: x, side: side });
          if (o.key === rot.moved) {
            CQ.store.record('rotation-bst', true, t2 === 0); b.classList.add('is-right');
            fb2.show({ ok: true, title: 'Right', why: why + ' In-order before and after: ' + B.inorder(rt).join(' ') + '.' });
            U.clear(row2);
            el.appendChild(h('h3.pane-title', null, 'After ' + rot.kind + '-Rot'));
            var s2 = { state: {}, badge: {} }; s2.state[x] = 'active'; s2.badge[x] = 'x'; s2.badge[p] = 'p'; if (rot.moved != null) { s2.state[rot.moved] = 'ok'; s2.badge[rot.moved] = 'T2'; }
            tview(el, 'After the rotation').render(view(rot.root, s2));
            opts.onDone({ misses: misses, root: rot.root });
          } else { t2++; misses++; b.disabled = true; b.classList.add('is-wrong'); CQ.store.record('rotation-bst', false, t2 === 1); fb2.show({ ok: false, title: 'That one stays put', why: why, misconception: o.key != null && o.key === (rot.kind === 'LT' ? (pn.rc || {}).key : (pn.lc || {}).key) ? 'A rotation moves the parent\'s other subtree.' : null }); }
        }, { cls: 'choice' });
        row2.appendChild(b);
      });
    }
  }
  function rotate(el, ctx) {
    var count = ctx.level.count, i = 0, misses = 0, r = E.rng(ctx.seed);
    var area = h('div'); el.appendChild(area);
    U.codePanel(el, { code: ctx.unit.lisp.rotate.code, title: ctx.unit.lisp.rotate.title, collapsed: true });
    function next() {
      U.clear(area);
      if (i >= count) { CQ.store.noteRound(ctx.gameId, misses === 0); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(0, misses === 0), summary: count + ' rotations, ' + misses + ' slip(s).' }); }); }
      var t = niceTree(8, ctx.seed + i * 13), rt = t.root;
      // Prefer nodes whose moving subtree is non-empty (more interesting), but not always.
      var cands = keysOf(rt).filter(function (k) { return k !== rt.key; });
      var rich = cands.filter(function (k) { return B.rotateUp(rt, k).moved != null; });
      var pool = rich.length && r() < 0.75 ? rich : cands, x = pool[E.randInt(r, 0, pool.length - 1)];
      area.appendChild(h('h3', null, 'Rotation ' + (i + 1) + ' of ' + count));
      rotateTask(area, { unit: ctx.unit, root: rt, key: x, seed: ctx.seed + i, gameId: ctx.gameId, onDone: function (res) { misses += res.misses; i++; G.continueBtn(area, 'Next', next); } });
    }
    next();
  }

  /* ---------- Splay It ---------- */
  G.splayTask = function (el, opts) {
    var T = opts.unit.templates, rt = opts.root, keys = opts.keys, ki = 0, misses = 0, hints = 0;
    var head = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(head);
    var tv = tview(el, 'Splay tree');
    var printed = h('p.plainq'); el.appendChild(printed);
    var row = h('div.choice-row'); el.appendChild(row);
    var tools = h('div.tools'); el.appendChild(tools);
    var fb = U.feedback(el);
    var sp = null, fi = 0;
    if (opts.hints) tools.appendChild(U.button('Why?', function () { if (!sp || fi + 1 >= sp.frames.length) return; hints++; var f = sp.frames[fi + 1]; fb.show({ info: true, title: 'Rule', why: U.fmt(T.rotWhy[f.kind], { x: keys[ki], p: f.parent }) }); }));
    function draw() {
      var k = keys[ki], cur = sp ? sp.frames[fi].root : rt, st = { state: {}, badge: {} };
      st.state[k] = 'active'; st.badge[k] = 'x';
      if (sp && fi + 1 < sp.frames.length) { st.state[sp.frames[fi + 1].parent] = 'hit'; st.badge[sp.frames[fi + 1].parent] = 'p'; }
      tv.render(view(cur, st));
      printed.textContent = 'Lisp prints: ' + B.bracket(cur);
    }
    function start() {
      fb.hide();
      if (ki >= keys.length) { U.clear(row); U.clear(tools); head.textContent = 'All searches done.'; return opts.onDone({ misses: misses, hints: hints, root: rt }); }
      sp = B.splay(rt, keys[ki]); fi = 0;
      draw();
      el.dataset.chain = sp.chain.join(' ');
      if (!sp.found) { head.textContent = keys[ki] + ' is not in the tree: ST-SEARCH returns NIL and nothing moves.'; ki++; return start(); }
      ask();
    }
    function ask() {
      var f = sp.frames[fi + 1];
      head.innerHTML = '';
      head.appendChild(U.rich(U.fmt(T.splayPrompt, { k: keys[ki], d: sp.frames[fi].depth, p: f.parent })));
      U.clear(row);
      [['LT', 'LT-Rot'], ['RT', 'RT-Rot']].forEach(function (o) {
        var b = U.button(o[1], function () {
          if (b.disabled) return;
          if (o[0] === f.kind) {
            CQ.store.record('splaying', true, true); fb.hide();
            fi++; draw();
            if (fi + 1 >= sp.frames.length) {
              rt = sp.root; U.clear(row);
              fb.show({ ok: true, title: keys[ki] + ' is the root', why: U.fmt(T.splayDone, { k: keys[ki], n: sp.frames.length - 1, chain: sp.chain.slice(1).join(', ') || 'none' }) + ' (setf v (st-search ' + keys[ki] + ' v)) stores the new root.' });
              ki++;
              var nb = U.button(ki < keys.length ? 'Next search: ' + keys[ki] : 'Done', function () { start(); }, { cls: 'primary' });
              row.appendChild(nb); setTimeout(function () { nb.focus(); }, 20);
            } else ask();
          } else {
            misses++; b.disabled = true; CQ.store.record('splaying', false, true);
            if (opts.gameId) CQ.store.noteMiss(opts.gameId, 'rotation');
            fb.show({ ok: false, title: 'Other rotation', why: keys[ki] + ' is ' + f.parent + '\'s ' + (f.kind === 'LT' ? 'left' : 'right') + ' child, so ' + f.kind + '-Rot.' });
          }
        }, { cls: 'choice' });
        row.appendChild(b);
      });
      var first = row.querySelector('button'); if (first) setTimeout(function () { first.focus(); }, 20);
    }
    start();
  };
  function splay(el, ctx) {
    var L0 = ctx.level, rt = B.build(ctx.unit.trees[L0.tree]);
    G.splayTask(el, { unit: ctx.unit, root: rt, keys: L0.keys, hints: ctx.hints, gameId: ctx.gameId, onDone: function (r) {
      CQ.store.noteRound(ctx.gameId, r.misses === 0);
      G.continueBtn(el, 'Finish level', function () { ctx.complete({ stars: G.stars(r.hints, r.misses === 0), summary: L0.keys.length + ' keys splayed, ' + r.misses + ' wrong rotation(s).' }); });
    } });
    U.codePanel(el, { code: ctx.unit.lisp.splay.code, title: ctx.unit.lisp.splay.title, collapsed: true });
  }

  /* ---------- Hot Keys: plain BST vs splay tree on the same searches ---------- */
  function accessCosts(keys, seq) {
    var plain = B.build(keys), sp = B.build(keys), a = 0, b = 0, ptsA = [[0, 0]], ptsB = [[0, 0]];
    seq.forEach(function (k, i) {
      a += B.search(plain, k).comparisons;
      b += B.search(sp, k).comparisons; sp = B.splay(sp, k).root;
      ptsA.push([i + 1, a]); ptsB.push([i + 1, b]);
    });
    return { plain: a, splay: b, ptsA: ptsA, ptsB: ptsB };
  }
  G.accessSeq = function (seed) {
    var keys = [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15], r = E.rng(seed);
    var hot = [1, 7, 15], skew = [], uni = [];
    for (var i = 0; i < 20; i++) { skew.push(r() < 0.85 ? hot[E.randInt(r, 0, 2)] : keys[E.randInt(r, 0, 14)]); uni.push(keys[E.randInt(r, 0, 14)]); }
    return { keys: keys, hot: hot, skew: skew, uni: uni };
  };
  function access(el, ctx) {
    var T = ctx.unit.templates, A = G.accessSeq(ctx.seed);
    var sk = accessCosts(A.keys, A.skew), un = accessCosts(A.keys, A.uni);
    el.appendChild(h('p.small', null, 'A balanced BST of 1–15 (height 3). The searches: ' + A.skew.join(' ') + '. Hot keys ' + A.hot.join(', ') + ' are leaves of the balanced tree.'));
    var q = G.choiceQ({ id: 'splay-access', concept: 'splay-cost', seed: ctx.seed, prompt: T.accessQ, misconception: 'Restructuring the tree always costs more than it saves.',
      options: [
        { text: 'The splay tree', ok: sk.splay < sk.plain, why: 'Hot keys get splayed to the top and stay near it.' },
        { text: 'The plain BST', ok: sk.splay >= sk.plain, misconception: true, why: 'Searching a leaf of the balanced tree costs 4 comparisons every time; after splaying, a hot key is found in 1 or 2.' },
        { text: 'Exactly the same', why: 'The splay tree changes shape after each search, so its costs change.' }
      ] });
    G.predictThen(el, q, 'Run the 20 searches ▶', function (ft) {
      U.chart(el, { label: 'Total comparisons over 20 searches', xLabel: 'Searches done', yLabel: 'Total comparisons',
        series: [{ label: 'Plain BST', points: sk.ptsA }, { label: 'Splay tree', points: sk.ptsB }] });
      G.note(el, 'Skewed searches: plain BST **' + sk.plain + '** comparisons, splay tree **' + sk.splay + '**. With 20 uniform random searches instead: plain ' + un.plain + ', splay ' + un.splay + '. Splaying pays off when keys repeat (locality); without it, it\'s roughly a wash or worse.');
      CQ.store.noteRound(ctx.gameId, ft);
      G.continueBtn(el, 'Finish level', function () { ctx.complete({ stars: G.stars(0, ft), summary: 'Skewed: ' + sk.plain + ' vs ' + sk.splay + ' comparisons.' }); });
    });
  }

  /* ---------- briefing kinds ---------- */
  G.briefingKinds = G.briefingKinds || {};
  G.briefingKinds.bstWalk = function (area, s, unit, after) {
    var rt = B.build(s.keys), path = B.search(rt, s.find).path, done = false;
    var tv = tview(area, 'The lecture\'s BST');
    var msg = h('p.narration', { 'aria-live': 'polite' }); area.appendChild(msg);
    var ctrl = h('div'); area.insertBefore(ctrl, tv.el);
    U.stepper(ctrl, { count: path.length + 1, onShow: function (k) {
      var st = { state: {}, badge: {} };
      path.slice(0, k).forEach(function (x, i) { st.state[x] = x === s.find ? 'ok' : 'done'; st.badge[x] = '#' + (i + 1); });
      tv.render(view(rt, st));
      var at = path[k - 1];
      msg.textContent = !k ? 'Start at the root.' : at === s.find ? 'Found ' + s.find + ' after ' + k + ' comparisons.' : s.find + (s.find < at ? ' < ' : ' > ') + at + ': go ' + (s.find < at ? 'left.' : 'right.');
      if (k === path.length && !done) { done = true; after(); }
    } }).play();
  };
  G.briefingKinds.bstShapes = function (area, s, unit, after) {
    var cols = h('div.rec-cols'); area.appendChild(cols);
    var a = h('div'), b = h('div'); cols.appendChild(a); cols.appendChild(b);
    var bal = B.build([50, 30, 70, 20, 40, 60, 80]);
    a.appendChild(h('h3.pane-title', null, '(50 30 70 20 40 60 80): height ' + B.height(bal)));
    tview(a, 'Balanced').render(view(bal));
    G.continueBtn(b, 'Insert 20 … 80 in order', function () {
      var deg = B.build([20, 30, 40, 50, 60, 70, 80]);
      b.appendChild(h('h3.pane-title', null, '(20 30 … 80): height ' + B.height(deg)));
      tview(b, 'Degenerate').render(view(deg));
      after();
    });
  };
  G.briefingKinds.rotateDemo = function (area, s, unit, after) {
    var rt = B.build(unit.trees[s.tree]), rot = B.rotateUp(rt, s.x);
    var st = { state: {}, badge: {} }; st.state[s.x] = 'active'; st.badge[s.x] = 'x'; st.state[rot.parent] = 'hit'; st.badge[rot.parent] = 'p'; if (rot.moved != null) st.badge[rot.moved] = 'T2';
    area.appendChild(h('h3.pane-title', null, 'Before: ' + B.bracket(rt)));
    tview(area, 'Before').render(view(rt, st));
    G.continueBtn(area, rot.kind + '-Rot ' + s.x + ' ▶', function () {
      var s2 = { state: {}, badge: {} }; s2.state[s.x] = 'active'; s2.badge[s.x] = 'x'; s2.badge[rot.parent] = 'p'; if (rot.moved != null) { s2.state[rot.moved] = 'ok'; s2.badge[rot.moved] = 'T2'; }
      area.appendChild(h('h3.pane-title', null, 'After: ' + B.bracket(rot.root)));
      tview(area, 'After').render(view(rot.root, s2));
      after();
    });
  };
  G.briefingKinds.splayDemo = function (area, s, unit, after) {
    var sp = B.splay(B.build(unit.trees[s.tree]), s.key), done = false;
    var ctrl = h('div'); area.appendChild(ctrl);
    var tv = tview(area, 'Splaying ' + s.key);
    var msg = h('p.narration', { 'aria-live': 'polite' }); area.appendChild(msg);
    U.stepper(ctrl, { count: sp.frames.length, onShow: function (k) {
      var f = sp.frames[k], st = { state: {}, badge: {} }; st.state[s.key] = 'active'; st.badge[s.key] = 'x';
      tv.render(view(f.root, st));
      msg.textContent = k === 0 ? 'Found ' + s.key + ' at depth ' + f.depth + '. Chain (closest first): ' + sp.chain.join(', ') + '.' : f.kind + '-Rot with parent ' + f.parent + '. Depth now ' + f.depth + '. ' + B.bracket(f.root);
      if (k === sp.frames.length - 1 && !done) { done = true; after(); }
    } }).play();
  };

  G.tasks = G.tasks || {};
  G.tasks.bstbuild = function (container, q, unit, done) { G.bstBuildTask(container, { unit: unit, keys: q.keys, hints: false, onDone: function (r) { done({ misses: r.misses, summary: r.summary }); } }); };
  G.tasks.splay = function (container, q, unit, done) {
    var u13 = CQ.content.unitData[13];
    G.splayTask(container, { unit: u13, root: B.build(u13.trees[q.tree]), keys: [q.key], hints: false, onDone: function (r) { done({ misses: r.misses, summary: q.key + ' splayed to the root.' }); } });
  };

  G.bstbuild = { mount: function (el, ctx) { (ctx.level.kind === 'shape' ? shape : build)(el, ctx); } };
  G.bstsearch = { mount: walk };
  G.bstdelete = { mount: del };
  G.rotlab = { mount: rotate };
  G.splayit = { mount: splay };
  G.access = { mount: access };
  G._bst = { view: view, niceTree: niceTree, accessCosts: accessCosts };
})(typeof globalThis !== 'undefined' ? globalThis : this);
