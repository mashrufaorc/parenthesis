/* Parenthesis — engine/heap.js
 * Unit 14. Pure functions, no DOM. Mirrors the lecture's Lisp:
 * HPARENT / HLT / HRT, HEAP-UP (swim), HEAP-DOWN (sink, swap with the child
 * that wins COMP), HEAP-PUSH, HEAP-POP, HEAPIFY (Floyd: sink every internal
 * node, last one first) and in-place HEAPSORT.
 * comp(a, b) is like (funcall comp a b): '>' builds a max heap, '<' a min heap.
 */
(function (root) {
  'use strict';
  var E = root.CQ.engine;
  var HP = E.heap = {};
  HP.parent = function (i) { return Math.floor((i - 1) / 2); };   // (floor (- i 1) 2): -1 for the root
  HP.right = function (i) { return (i + 1) * 2; };
  HP.left = function (i) { return HP.right(i) - 1; };
  HP.cmp = { max: function (a, b) { return a > b; }, min: function (a, b) { return a < b; } };

  /* HEAP-UP from index i. Steps: [{i, p, a, b, swap}] (one per comparison). */
  HP.up = function (vec, i, comp) {
    var v = vec.slice(), steps = [], cmp = 0;
    while (i > 0) {
      var p = HP.parent(i), wins = comp(v[i], v[p]);
      cmp++;
      steps.push({ i: i, p: p, child: v[i], parentVal: v[p], swap: wins, before: v.slice() });
      if (!wins) break;
      var t = v[i]; v[i] = v[p]; v[p] = t;
      i = p;
    }
    return { vec: v, steps: steps, comparisons: cmp, final: i };
  };
  HP.push = function (vec, x, comp) { var v = vec.concat([x]); var r = HP.up(v, v.length - 1, comp); r.start = v; return r; };

  /* HEAP-DOWN from beg within [0, end). Steps: [{i, l, r, child, swap}] — child is the one
   * that wins COMP between the children (left if there is no right child). */
  HP.down = function (vec, beg, comp, end) {
    var v = vec.slice(), steps = [], cmp = 0;
    if (end == null) end = v.length;
    var i = beg;
    for (;;) {
      var l = HP.left(i), r = HP.right(i);
      if (l >= end) { steps.push({ i: i, l: l, r: r, child: null, swap: false, leaf: true, before: v.slice() }); break; }
      var child = l;
      if (r < end) { cmp++; child = comp(v[l], v[r]) ? l : r; }
      cmp++;
      var wins = comp(v[child], v[i]);
      steps.push({ i: i, l: l, r: r < end ? r : null, child: child, swap: wins, before: v.slice() });
      if (!wins) break;
      var t = v[i]; v[i] = v[child]; v[child] = t;
      i = child;
    }
    return { vec: v, steps: steps, comparisons: cmp, final: i };
  };
  HP.pop = function (vec, comp) {
    var v = vec.slice(), last = v.length - 1, t = v[0]; v[0] = v[last]; v[last] = t;
    var top = v.pop();
    var r = v.length ? HP.down(v, 0, comp) : { vec: v, steps: [], comparisons: 0 };
    r.value = top; r.afterSwap = v.slice();
    return r;
  };
  /* HEAPIFY (Floyd's method): (heap-down vec (- mid i 1)) for i = 0 … mid−1. */
  HP.heapify = function (vec, comp) {
    var v = vec.slice(), mid = Math.floor(v.length / 2), calls = [], cmp = 0;
    for (var i = 0; i < mid; i++) {
      var at = mid - i - 1, r = HP.down(v, at, comp);
      calls.push({ index: at, value: v[at], steps: r.steps, after: r.vec.slice() });
      cmp += r.comparisons; v = r.vec;
    }
    return { vec: v, calls: calls, comparisons: cmp };
  };
  HP.isHeap = function (v, comp, end) {
    end = end == null ? v.length : end;
    for (var i = 1; i < end; i++) if (comp(v[i], v[HP.parent(i)])) return false;
    return true;
  };
  /* Williams's method (n pushes) for comparison with Floyd's. */
  HP.buildByPush = function (vec, comp) { var v = [], cmp = 0; vec.forEach(function (x) { var r = HP.push(v, x, comp); v = r.vec; cmp += r.comparisons; }); return { vec: v, comparisons: cmp }; };

  /* HEAPSORT as a step generator (works with ui/watcher and ui/runner).
   * comp is the lecture's: '>' (max heap) sorts ascending. Items are {id, v}. */
  E.heapSort = function* (values, comp) {
    var c = E.newCounters(), a = E.toItems(values), n = a.length;
    comp = comp || function (x, y) { return x.v > y.v; };
    function swap(i, j) { var t = a[i]; a[i] = a[j]; a[j] = t; c.swaps++; }
    function* sink(beg, end, phase) {
      var i = beg;
      for (;;) {
        var l = 2 * i + 1, r = l + 1;
        if (l >= end) return;
        var child = l;
        if (r < end) { c.comparisons++; child = comp(a[l], a[r]) ? l : r; }
        c.comparisons++;
        var wins = comp(a[child], a[i]);
        yield E.snap(a, c, { at: 'sink', marks: { i: i, j: child }, compare: [i, child], result: wins, sinkAt: i, child: child, end: end, phase: phase,
          regions: end < n ? [{ from: end, to: n - 1, kind: 'sorted' }] : [],
          msg: (wins ? 'Swap ' + a[i].v + ' with its winning child ' + a[child].v + '.' : a[i].v + ' beats its children: stop sinking.') });
        if (!wins) return;
        swap(i, child);
        i = child;
      }
    }
    yield E.snap(a, c, { at: 'start', msg: 'HEAPIFY first: sink every internal node, last one first.' });
    var mid = Math.floor(n / 2);
    for (var k = 0; k < mid; k++) yield* sink(mid - k - 1, n, 'heapify');
    yield E.snap(a, c, { at: 'heap', msg: 'Max heap built. The root is the largest.' });
    for (var t = 0; t < n - 1; t++) {
      var last = n - t - 1;
      swap(0, last);
      yield E.snap(a, c, { at: 'extract', swap: [0, last], regions: [{ from: last, to: n - 1, kind: 'sorted' }], msg: 'Swap the root (the max) into slot ' + last + ': it is final. The heap shrinks.' });
      yield* sink(0, last, 'sort');
    }
    yield E.snap(a, c, { at: 'done', regions: [{ from: 0, to: Math.max(0, n - 1), kind: 'sorted' }], done: true, msg: 'Sorted in place: ' + c.comparisons + ' comparisons, ' + c.swaps + ' swaps.' });
  };
  E.sorts.heapsort = { gen: E.heapSort, name: 'Heapsort', stable: false, lisp: 'heapsort' };
})(typeof globalThis !== 'undefined' ? globalThis : this);
