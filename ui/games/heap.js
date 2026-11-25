/* Parenthesis — ui/games/heap.js
 * Unit 14: Index Map, Swim Up (HEAP-PUSH), Sink Down (HEAP-POP), Heapify &
 * Heapsort. Every swap, stop and index comes from engine/heap.js.
 * The heap is always shown twice: as a complete tree and as the array it lives in.
 */
(function (root) {
  'use strict';
  var CQ = root.CQ, U = CQ.ui, E = CQ.engine, HP = E.heap, G = CQ.games, h = U.h;

  /* Twin view: tree + array. st: { state: {i: s}, badge: {i: text}, end } (end = heap size; later slots are "sorted / outside"). */
  G.heapView = function (container, opts) {
    opts = opts || {};
    var wrap = h('div.heapview'); container.appendChild(wrap);
    var tv = U.treeView(wrap, { label: opts.label || 'Heap as a tree', nodeW: 42, gapX: 6, slots: true,
      onPick: opts.onPick ? function (x) { opts.onPick(x.idx); } : null, selectable: function (x) { return !x.hidden && (!opts.selectable || opts.selectable(x.idx)); } });
    var cells = h('div.hcells', { role: 'group', 'aria-label': 'Heap as an array' }); wrap.appendChild(cells);
    function render(vec, st) {
      st = st || {};
      var end = st.end == null ? vec.length : st.end;
      function node(i) {
        var kids = [];
        var l = 2 * i + 1, r = l + 1;
        if (l < end) { kids.push(node(l)); kids.push(r < end ? node(r) : { id: 'h' + i + '_r', label: '', children: [], hidden: true }); }
        return { id: 'h' + i, idx: i, label: String(vec[i]), sub: 'i' + i, children: kids, state: st.state && st.state[i] || null, badge: st.badge && st.badge[i] || null };
      }
      tv.render(end ? node(0) : null);
      U.clear(cells);
      vec.forEach(function (v, i) {
        var s = st.state && st.state[i], out = i >= end;
        var c = h(opts.onPick && !out ? 'button.hcell' : 'div.hcell', { type: opts.onPick && !out ? 'button' : null, 'aria-label': 'index ' + i + ', value ' + v + (s ? ', ' + s : '') + (out ? ', sorted' : '') });
        if (s) c.classList.add('is-' + s);
        if (out) c.classList.add('is-out');
        c.appendChild(h('span.hv', null, String(v)));
        c.appendChild(h('span.hi', null, String(i)));
        if (st.badge && st.badge[i]) c.appendChild(h('span.hb', null, st.badge[i]));
        if (opts.onPick && !out) c.addEventListener('click', function () { if (!opts.selectable || opts.selectable(i)) opts.onPick(i); });
        cells.appendChild(c);
      });
    }
    return { el: wrap, render: render, focus: function () { tv.focus(); } };
  };

  function cmpOf(name) { return HP.cmp[name || 'max']; }
  function randVals(n, seed, lo, hi) { var r = E.rng(seed), out = [], used = {}; while (out.length < n) { var k = E.randInt(r, lo || 1, hi || 99); if (!used[k]) { used[k] = 1; out.push(k); } } return out; }
  function randHeap(n, seed, comp) { return HP.heapify(randVals(n, seed), comp).vec; }

  /* ---------- Index Map ---------- */
  function index(el, ctx) {
    var T = ctx.unit.templates, r = E.rng(ctx.seed), vec = randHeap(11, ctx.seed, HP.cmp.max), count = ctx.level.count;
    var k = 0, misses = 0, hints = 0, q = null, bad = null;
    var p = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(p);
    var hv = G.heapView(el, { onPick: pick, selectable: function () { return !!q; } });
    var tools = h('div.tools'); el.appendChild(tools);
    var fb = U.feedback(el);
    var area = h('div'); el.appendChild(area);
    if (ctx.hints) tools.appendChild(U.button('Formula', function () { if (!q) return; hints++; fb.show({ info: true, title: 'Formula', why: { parent: 'parent(i) = floor((i − 1) / 2)', left: 'left(i) = 2i + 1', right: 'right(i) = 2i + 2' }[q.kind] }); }));
    function draw() { var st = { state: {}, badge: {} }; if (q) { st.state[q.i] = 'active'; st.badge[q.i] = 'i'; } if (bad != null) st.state[bad] = 'bad'; hv.render(vec, st); }
    function next() {
      U.clear(area); bad = null; fb.hide();
      if (k >= count) { q = null; draw(); p.textContent = 'All done.'; CQ.store.noteRound(ctx.gameId, misses === 0); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(hints, misses === 0), summary: count + ' indexes, ' + misses + ' slip(s).' }); }); }
      var kinds = ['parent', 'left', 'right'], kind = kinds[k % 3], i;
      if (kind === 'parent') i = E.randInt(r, 1, vec.length - 1);
      else { var hi = kind === 'left' ? Math.floor((vec.length - 2) / 2) : Math.floor((vec.length - 3) / 2); i = E.randInt(r, 0, hi); }
      var a = kind === 'parent' ? HP.parent(i) : kind === 'left' ? HP.left(i) : HP.right(i);
      q = { kind: kind, i: i, a: a };
      p.innerHTML = ''; p.appendChild(U.rich(U.fmt(T.indexQ[kind], { i: i })));
      draw();
    }
    function pick(i) {
      if (!q) return;
      var why = U.fmt(T.indexWhy[q.kind], { i: q.i, a: q.a });
      if (i === q.a) { CQ.store.record('heap-index', true, bad == null); fb.show({ ok: true, title: 'Index ' + i, why: why }); var cur = q; q = null; bad = null; var st = { state: {}, badge: {} }; st.state[cur.i] = 'active'; st.badge[cur.i] = 'i'; st.state[i] = 'ok'; st.badge[i] = cur.kind; hv.render(vec, st); k++; G.continueBtn(area, 'Next', next); }
      else {
        misses++; bad = i; CQ.store.record('heap-index', false, true); if (ctx.gameId) CQ.store.noteMiss(ctx.gameId, 'heap-index');
        fb.show({ ok: false, title: 'Not index ' + i, why: why, misconception: (q.kind === 'left' && i === 2 * q.i) || (q.kind === 'right' && i === 2 * q.i + 1) || (q.kind === 'parent' && i === Math.floor(q.i / 2)) ? 'The formulas for a 1-based heap work with a 0-based array.' : null });
        draw();
      }
    }
    next();
  }

  /* ---------- Heap or not? ---------- */
  function isheap(el, ctx) {
    var count = ctx.level.count, r = E.rng(ctx.seed), k = 0, misses = 0;
    var area = h('div'); el.appendChild(area);
    function make(valid) {
      var v = randHeap(E.randInt(r, 6, 9), ctx.seed + k * 37, HP.cmp.max);
      if (valid) return v;
      // break it: swap some child with its parent (or a sorted-descending-looking near miss)
      var i = E.randInt(r, 1, v.length - 1), p = HP.parent(i), t = v[i]; v[i] = v[p]; v[p] = t;
      return v;
    }
    function next() {
      U.clear(area);
      if (k >= count) { CQ.store.noteRound(ctx.gameId, misses === 0); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(0, misses === 0), summary: count + ' arrays judged, ' + misses + ' slip(s).' }); }); }
      var v = make(r() < 0.5), ok = HP.isHeap(v, HP.cmp.max);
      area.appendChild(h('h3', null, 'Array ' + (k + 1) + ' of ' + count + ': #(' + v.join(' ') + ')'));
      var hv = G.heapView(area, {});
      hv.render(v);
      var bad = []; for (var i = 1; i < v.length; i++) if (v[i] > v[HP.parent(i)]) bad.push(i);
      var why = ok ? 'Every parent is ≥ both children, and a complete tree always fits an array with no gaps.' : 'Index ' + bad[0] + ' holds ' + v[bad[0]] + ', larger than its parent at index ' + HP.parent(bad[0]) + ' (' + v[HP.parent(bad[0])] + ').';
      var row = h('div.choice-row'); area.appendChild(row);
      var fb = U.feedback(area), tries = 0;
      [[true, 'Valid max heap'], [false, 'Not a max heap']].forEach(function (o) {
        var b = U.button(o[1], function () {
          if (b.disabled) return;
          if (o[0] === ok) {
            CQ.store.record('heap-props', true, tries === 0);
            if (!ok) { var st = { state: {}, badge: {} }; st.state[bad[0]] = 'bad'; st.badge[bad[0]] = '!'; st.state[HP.parent(bad[0])] = 'hit'; hv.render(v, st); }
            fb.show({ ok: true, title: o[1], why: why }); U.clear(row); k++; G.continueBtn(area, 'Next', next);
          } else { tries++; misses++; b.disabled = true; CQ.store.record('heap-props', false, tries === 1); fb.show({ ok: false, title: 'Look again', why: why, misconception: ok ? null : 'A heap only needs the root to be the largest.' }); }
        }, { cls: 'choice' });
        row.appendChild(b);
      });
    }
    next();
  }

  /* ---------- Swim Up ---------- */
  function pushTask(el, opts) {
    var T = opts.unit.templates, comp = cmpOf(opts.comp), res = HP.push(opts.vec, opts.x, comp), si = 0, misses = 0, hints = 0;
    var cur = res.start.slice();
    var p = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(p);
    var hv = G.heapView(el, {});
    var cnt = U.counters(el, ['comparisons', 'swaps']);
    var row = h('div.choice-row'); el.appendChild(row);
    var tools = h('div.tools'); el.appendChild(tools);
    var fb = U.feedback(el);
    var sw = 0;
    if (opts.hints) tools.appendChild(U.button('Why?', function () { var s = res.steps[si]; if (!s) return; hints++; fb.show({ info: true, title: 'Rule', why: 'HEAP-UP swaps while (funcall comp child parent) is true: is ' + s.child + ' ' + (opts.comp === 'min' ? '<' : '>') + ' ' + s.parentVal + '?' }); }));
    function ask() {
      var s = res.steps[si];
      var st = { state: {}, badge: {} };
      if (!s) {
        st.state[res.final] = 'ok'; st.badge[res.final] = 'x'; hv.render(cur, st); U.clear(row); U.clear(tools);
        var why = res.final === 0 && (res.steps.length === 0 || res.steps[res.steps.length - 1].swap) ? T.pushWhy.root : 'It stopped at index ' + res.final + '.';
        fb.show({ ok: true, title: 'Pushed ' + opts.x, why: why + ' ' + res.comparisons + ' comparison(s); the most it could be is h + 1 = ' + (Math.floor(Math.log2(cur.length)) + 1) + '. #(' + cur.join(' ') + ')' });
        return opts.onDone({ misses: misses, hints: hints, vec: cur });
      }
      st.state[s.i] = 'active'; st.badge[s.i] = 'x'; st.state[s.p] = 'hit'; st.badge[s.p] = 'parent';
      hv.render(cur, st);
      p.innerHTML = ''; p.appendChild(U.rich(U.fmt(T.pushPrompt, { x: opts.x, i: s.i, v: s.child, p: s.p, pv: s.parentVal })));
      U.clear(row);
      [[true, 'Swap ↑'], [false, 'Stop']].forEach(function (o) {
        var b = U.button(o[1], function () {
          if (b.disabled) return;
          var why = U.fmt(s.swap ? T.pushWhy.swap : T.pushWhy.stop, { v: s.child, pv: s.parentVal, rel: opts.comp === 'min' ? '<' : '>' });
          cnt.set({ comparisons: si + 1, swaps: sw });
          if (o[0] === s.swap) {
            CQ.store.record('heap-up', true, true); fb.show({ ok: true, title: o[1], why: why });
            if (s.swap) { var t = cur[s.i]; cur[s.i] = cur[s.p]; cur[s.p] = t; sw++; cnt.set({ comparisons: si + 1, swaps: sw }); }
            si++; ask();
          } else {
            misses++; b.disabled = true; CQ.store.record('heap-up', false, true); if (opts.gameId) CQ.store.noteMiss(opts.gameId, 'heap-up');
            fb.show({ ok: false, title: 'Not quite', why: why, misconception: !s.swap && opts.comp === 'min' && s.child > s.parentVal ? 'A min heap swaps when the child is larger.' : null });
          }
        }, { cls: 'choice' });
        row.appendChild(b);
      });
      setTimeout(function () { var f = row.querySelector('button'); if (f) f.focus(); }, 20);
    }
    ask();
  }
  function push(el, ctx) {
    var L0 = ctx.level, comp = cmpOf(L0.comp), r = E.rng(ctx.seed), count = L0.count, k = 0, misses = 0, hints = 0;
    var vec = randHeap(7, ctx.seed, comp), used = {}; vec.forEach(function (v) { used[v] = 1; });
    var area = h('div'); el.appendChild(area);
    U.codePanel(el, { code: ctx.unit.lisp.up.code, title: ctx.unit.lisp.up.title, collapsed: true });
    function next() {
      U.clear(area);
      if (k >= count) { CQ.store.noteRound(ctx.gameId, misses === 0); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(hints, misses === 0), summary: count + ' pushes, ' + misses + ' slip(s).' }); }); }
      // mix of values: some that swim to the top, some that stop early
      var x; do { x = k % 2 === 0 ? (L0.comp === 'min' ? E.randInt(r, 1, 20) : E.randInt(r, 75, 99)) : E.randInt(r, 1, 99); } while (used[x]);
      used[x] = 1;
      area.appendChild(h('h3', null, 'Push ' + (k + 1) + ' of ' + count + ': ' + x));
      pushTask(area, { unit: ctx.unit, vec: vec, x: x, comp: L0.comp, hints: ctx.hints, gameId: ctx.gameId, onDone: function (res) { vec = res.vec; misses += res.misses; hints += res.hints; k++; G.continueBtn(area, 'Next', next); } });
    }
    next();
  }

  /* ---------- Sink Down ---------- */
  G.popTask = function (el, opts) {
    var T = opts.unit.templates, comp = cmpOf(opts.comp), res = HP.pop(opts.vec, comp), si = 0, misses = 0, hints = 0, bad = null;
    var cur = res.afterSwap.slice(), last = opts.vec.length - 1;
    var p = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(p);
    p.appendChild(U.rich('Pop **' + opts.vec[0] + '**: the last item, **' + opts.vec[last] + '**, moves to the root and sinks.'));
    var hv = G.heapView(el, { onPick: pick, selectable: function (i) { var s = res.steps[si]; return s && !s.leaf && (i === s.l || i === s.r); } });
    var q = h('p.q-prompt', { 'aria-live': 'polite' }); el.appendChild(q);
    var row = h('div.choice-row'); el.appendChild(row);
    var tools = h('div.tools'); el.appendChild(tools);
    var fb = U.feedback(el);
    if (opts.hints) tools.appendChild(U.button('Why?', function () { var s = res.steps[si]; if (!s || s.leaf) return; hints++; fb.show({ info: true, title: 'Rule', why: 'First compare the two children; the winner (' + cur[s.child] + ') is the only candidate. Then swap only if it beats ' + cur[s.i] + '.' }); }));
    function why(s) { return U.fmt(T.popWhy, { c: cur[s.child], ci: s.child, v: cur[s.i] }) + (s.swap ? ' ' + cur[s.child] + ' wins: swap.' : ' It doesn\'t: stop.'); }
    function draw() {
      var s = res.steps[si], st = { state: {}, badge: {} };
      if (s) { st.state[s.i] = 'active'; st.badge[s.i] = 'sink'; if (!s.leaf) { st.badge[s.l] = 'L'; if (s.r != null) st.badge[s.r] = 'R'; } }
      if (bad != null) st.state[bad] = 'bad';
      hv.render(cur, st);
    }
    function ask() {
      var s = res.steps[si];
      bad = null;
      if (!s || s.leaf || (si > 0 && !res.steps[si - 1].swap)) return finish(s && s.leaf);
      draw();
      q.innerHTML = ''; q.appendChild(U.rich(U.fmt(T.popPrompt, { v: cur[s.i], i: s.i })));
      U.clear(row);
      var stop = U.button('Stop: it beats its children', function () { choose('stop'); }, { cls: 'choice' });
      row.appendChild(stop);
      setTimeout(function () { hv.focus(); }, 20);
    }
    function pick(i) { choose(i); }
    function choose(c) {
      var s = res.steps[si];
      var want = s.swap ? s.child : 'stop';
      if (c === want) {
        CQ.store.record('heap-down', true, true);
        fb.show({ ok: true, title: c === 'stop' ? 'Stop' : 'Swap with ' + cur[s.child], why: why(s) });
        if (s.swap) { var t = cur[s.i]; cur[s.i] = cur[s.child]; cur[s.child] = t; si++; ask(); }
        else finish(false);
      } else {
        misses++; CQ.store.record('heap-down', false, true); if (opts.gameId) CQ.store.noteMiss(opts.gameId, 'heap-down');
        if (c !== 'stop') bad = c;
        var other = c !== 'stop' && c !== s.child;
        fb.show({ ok: false, title: c === 'stop' ? 'Not yet' : 'Not that child', why: why(s), misconception: other && s.r != null ? 'Any child that beats the parent will do.' : null });
        draw();
      }
    }
    function finish(leaf) {
      U.clear(row); U.clear(tools);
      var st = { state: {}, badge: {} }; st.state[res.final] = 'ok'; hv.render(cur, st);
      q.textContent = 'Popped ' + res.value + '. ' + (leaf ? 'It reached a leaf: stop. ' : '') + 'Heap restored: #(' + cur.join(' ') + '). ' + res.comparisons + ' comparison(s), at most 2h.';
      opts.onDone({ misses: misses, hints: hints, vec: cur, value: res.value });
    }
    ask();
  };
  function pop(el, ctx) {
    var L0 = ctx.level, comp = cmpOf(L0.comp), count = L0.count, k = 0, misses = 0, hints = 0, out = [];
    var vec = randHeap(11, ctx.seed, comp);
    var area = h('div'); el.appendChild(area);
    U.codePanel(el, { code: ctx.unit.lisp.down.code, title: ctx.unit.lisp.down.title, collapsed: true });
    function next() {
      U.clear(area);
      if (k >= count || vec.length < 2) { CQ.store.noteRound(ctx.gameId, misses === 0); area.appendChild(h('p.status', null, 'Popped in order: ' + out.join(', ') + '. Repeated pops come out sorted: that is heapsort\'s idea.')); return G.continueBtn(area, 'Finish level', function () { ctx.complete({ stars: G.stars(hints, misses === 0), summary: count + ' pops, ' + misses + ' slip(s).' }); }); }
      area.appendChild(h('h3', null, 'Pop ' + (k + 1) + ' of ' + count));
      G.popTask(area, { unit: ctx.unit, vec: vec, comp: L0.comp, hints: ctx.hints, gameId: ctx.gameId, onDone: function (r) { vec = r.vec; out.push(r.value); misses += r.misses; hints += r.hints; k++; G.continueBtn(area, 'Next', next); } });
    }
    next();
  }

  /* ---------- Heapify & Heapsort ---------- */
  function heapify(el, ctx) {
    var vals = [10, 5, 2, 6, 12, 15, 1, 9, 7, 8], n = vals.length, mid = Math.floor(n / 2), hf = HP.heapify(vals, HP.cmp.max), wb = HP.buildByPush(vals, HP.cmp.max);
    el.appendChild(h('p.small', null, 'V = #(' + vals.join(' ') + '), n = ' + n + '. HEAPIFY calls (heap-down vec (- mid i 1) #\'>) for i from 0 to mid − 1, where mid = floor(n/2) = ' + mid + '.'));
    var q = G.choiceQ({ id: 'heapify-first', concept: 'heapify', seed: ctx.seed, prompt: 'Which index does HEAPIFY sink first?', misconception: 'HEAPIFY starts at the root.',
      options: [
        { text: 'Index ' + (mid - 1) + ' (the last internal node)', ok: true, why: 'Leaves (indexes ' + mid + '–' + (n - 1) + ') are already heaps, so Floyd starts at mid − 1 and works back to the root.' },
        { text: 'Index 0 (the root)', misconception: true, why: 'The root is sunk last, once both its subtrees are heaps.' },
        { text: 'Index ' + (n - 1) + ' (the last slot)', why: 'That\'s a leaf: nothing to sink.' },
        { text: 'Index ' + mid, why: 'Index ' + mid + ' is the first leaf.' }
      ] });
    G.predictThen(el, q, 'Watch HEAPIFY ▶', function (ft) {
      var frames = [{ vec: vals, index: null }].concat(hf.calls.map(function (c) { return { vec: c.after, index: c.index, value: c.value, steps: c.steps }; }));
      var ctrl = h('div'); el.appendChild(ctrl);
      var hv = G.heapView(el, {});
      var msg = h('p.narration', { 'aria-live': 'polite' }); el.appendChild(msg);
      var cmpSoFar = 0, done = false;
      U.stepper(ctrl, { count: frames.length, onShow: function (k) {
        var f = frames[k], st = { state: {}, badge: {} };
        if (f.index != null) { st.state[f.index] = 'active'; st.badge[f.index] = 'sank'; }
        for (var j = f.index == null ? mid : f.index; j < n; j++) if (j !== f.index) st.state[j] = st.state[j] || 'done';
        hv.render(f.vec, st);
        cmpSoFar = hf.calls.slice(0, k).reduce(function (a, c) { var s = 0; c.steps.forEach(function (x) { if (!x.leaf) s += x.r != null ? 2 : 1; }); return a + s; }, 0);
        msg.textContent = k === 0 ? 'Start: leaves ' + mid + '–' + (n - 1) + ' are already one-node heaps.' : 'heap-down at index ' + f.index + ' (value ' + f.value + '): ' + f.steps.filter(function (s) { return s.swap; }).length + ' swap(s). Comparisons so far: ' + cmpSoFar + '.';
        if (k === frames.length - 1 && !done) {
          done = true;
          G.note(el, 'Result: #(' + hf.vec.join(' ') + '). Floyd\'s HEAPIFY: **' + hf.comparisons + '** comparisons. Building the same heap with ' + n + ' pushes (Williams): **' + wb.comparisons + '**. Floyd is O(n): most nodes are near the bottom and barely sink.');
          CQ.store.noteRound(ctx.gameId, ft);
          G.continueBtn(el, 'Finish level', function () { ctx.complete({ stars: G.stars(0, ft), summary: 'HEAPIFY: ' + hf.comparisons + ' comparisons vs ' + wb.comparisons + ' for n pushes.' }); });
        }
      } }).play();
    });
  }
  function sortCompare(el, ctx) {
    var vals = E.makeInput('random', 12, ctx.seed);
    var q = G.choiceQ({ id: 'heapsort-mem', concept: 'heapsort', seed: ctx.seed, prompt: 'All three are O(n log n) on average. Which one sorts in place with O(1) extra memory AND has no O(n²) worst case?', misconception: 'Every O(n log n) sort needs extra memory.',
      options: [
        { text: 'Heapsort', ok: true, why: 'The heap and the sorted tail share one vector; every pass is one O(log n) sink.' },
        { text: 'Merge sort', misconception: true, why: 'Merge sort needs O(n) extra space for merging.' },
        { text: 'Quicksort (Lomuto)', why: 'In place, but a bad pivot sequence makes it O(n²).' }
      ] });
    G.predictThen(el, q, 'Run all three ▶', function (ft) {
      var w = U.watcher(el, [{ algo: 'heapsort', values: vals }, { algo: 'merge', values: vals, title: 'Merge sort' }, { algo: 'quickLomuto', values: vals, title: 'Quicksort (Lomuto)' }], { unit: ctx.unit, code: false, bars: true });
      w.stepper.speed(2);
      G.note(el, 'Watch heapsort\'s sorted tail (striped) grow from the right: each pass swaps the root, the current max, into the last heap slot. Heapsort isn\'t stable: those long-distance swaps reorder equal keys.');
      CQ.store.noteRound(ctx.gameId, ft);
      G.continueBtn(el, 'Finish level', function () { w.destroy(); ctx.complete({ stars: G.stars(0, ft), summary: 'Heapsort compared with merge sort and quicksort.' }); }, true);
    });
  }
  function sandbox(el, ctx) {
    var form = h('form.sandbox-form');
    var inp = h('input', { type: 'text', value: '9 6 10 7 8 3 12 1', 'aria-label': 'Array values, separated by spaces', inputmode: 'numeric' });
    var sel = h('select', { 'aria-label': 'Comparison' }, h('option', { value: 'max' }, "#'> max heap: ascending"), h('option', { value: 'min' }, "#'< min heap: descending"));
    form.appendChild(h('label.wide', null, 'Array (up to 20 numbers) ', inp));
    form.appendChild(h('div.row', null, h('label', null, 'COMP ', sel)));
    form.appendChild(U.button('Run ▶', null, { cls: 'primary', attrs: { type: 'submit' } }));
    var err = h('p.error', { role: 'alert' });
    el.appendChild(form); el.appendChild(err);
    var out = h('div'); el.appendChild(out);
    var w = null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = E.parseNumberList(inp.value, 20);
      err.textContent = p.error || '';
      if (p.error) return;
      if (w) w.destroy();
      U.clear(out);
      var c = cmpOf(sel.value), hf = HP.heapify(p.values, c);
      out.appendChild(h('h3.pane-title', null, 'After (heapify vec ' + (sel.value === 'min' ? "#'<" : "#'>") + '): #(' + hf.vec.join(' ') + '), ' + hf.comparisons + ' comparisons'));
      G.heapView(out, {}).render(hf.vec);
      w = U.watcher(out, [{ algo: 'heapsort', values: p.values, comp: sel.value === 'min' ? function (x, y) { return x.v < y.v; } : null, title: 'Heapsort' }], { unit: ctx.unit, bars: true });
      G.continueBtn(out, 'Done practising', function () { ctx.complete({ stars: 1, summary: 'Practice logged.' }); }, true);
    });
  }

  /* ---------- briefing kinds ---------- */
  G.briefingKinds = G.briefingKinds || {};
  G.briefingKinds.heapTwin = function (area, s, unit, after) {
    var seen = 0, info = h('p.narration', { 'aria-live': 'polite' }, 'Tap a slot, in the tree or the array.');
    var hv = G.heapView(area, { onPick: function (i) {
      var v = s.values, p = HP.parent(i), l = HP.left(i), r = HP.right(i), st = { state: {}, badge: {} };
      st.state[i] = 'active'; st.badge[i] = 'i'; if (p >= 0) { st.state[p] = 'hit'; st.badge[p] = 'parent'; }
      if (l < v.length) { st.state[l] = 'ok'; st.badge[l] = 'L'; } if (r < v.length) { st.state[r] = 'ok'; st.badge[r] = 'R'; }
      hv.render(v, st);
      info.textContent = 'Index ' + i + ' (' + v[i] + '): parent ' + (p >= 0 ? p + ' (' + v[p] + ')' : '−1, none: the root') + ', children ' + (l < v.length ? l + (r < v.length ? ' and ' + r : ' only') : 'none (a leaf)') + '.';
      if (++seen === 2) after();
    } });
    area.appendChild(info);
    hv.render(s.values);
  };
  G.briefingKinds.heapPushDemo = function (area, s, unit, after) {
    var res = HP.push(s.values, s.x, HP.cmp.max), frames = [{ vec: res.start, at: res.start.length - 1 }], v = res.start.slice(), done = false;
    res.steps.forEach(function (st) { if (st.swap) { var t = v[st.i]; v[st.i] = v[st.p]; v[st.p] = t; frames.push({ vec: v.slice(), at: st.p, step: st }); } else frames.push({ vec: v.slice(), at: st.i, step: st, stop: true }); });
    var ctrl = h('div'); area.appendChild(ctrl);
    var hv = G.heapView(area, {});
    var msg = h('p.narration', { 'aria-live': 'polite' }); area.appendChild(msg);
    U.stepper(ctrl, { count: frames.length, onShow: function (k) {
      var f = frames[k], st = { state: {}, badge: {} }; st.state[f.at] = f.stop ? 'ok' : 'active'; st.badge[f.at] = String(s.x);
      hv.render(f.vec, st);
      msg.textContent = k === 0 ? 'VECTOR-PUSH-EXTEND puts ' + s.x + ' at index ' + f.at + '.' : f.stop ? s.x + ' < ' + f.step.parentVal + ': stop. ' + res.comparisons + ' comparisons.' : s.x + ' > ' + f.step.parentVal + ': swap up to index ' + f.at + '.';
      if (k === frames.length - 1 && !done) { done = true; after(); }
    } }).play();
  };

  G.tasks = G.tasks || {};
  G.tasks.heappop = function (container, q, unit, done) { G.popTask(container, { unit: unit, vec: q.values, comp: 'max', hints: false, onDone: function (r) { done({ misses: r.misses, summary: 'Popped ' + r.value + '.' }); } }); };

  G.heapidx = { mount: function (el, ctx) { (ctx.level.kind === 'isheap' ? isheap : index)(el, ctx); } };
  G.heappush = { mount: push };
  G.heappop = { mount: pop };
  G.heapsortlab = { mount: function (el, ctx) { ({ heapify: heapify, sort: sortCompare, sandbox: sandbox })[ctx.level.kind](el, ctx); } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
