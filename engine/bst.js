/* Parenthesis — engine/bst.js
 * Units 12 and 13. Pure functions, no DOM. Mirrors the lectures' Lisp:
 * BST-INSERT / BST-MIN / BST-MAX / Hibbard deletion (Unit 12), and the splay
 * tree's TREE-ROTATE / NODE-CHAIN / SPLAY / ST-SEARCH (Unit 13), which rotates
 * the found node with its parent, again and again, until it is the root.
 * Trees are immutable here: every operation returns a fresh tree.
 * node: { id, key, lc, rc }   (lc / rc are nodes or null)
 */
(function (root) {
  'use strict';
  var E = root.CQ.engine;
  var BST = E.bst = {};
  var idc = 0;
  function mk(key, lc, rc) { return { id: 'b' + (++idc), key: key, lc: lc || null, rc: rc || null }; }
  BST.node = mk;
  BST.clone = function cl(n) { return n ? { id: n.id, key: n.key, lc: cl(n.lc), rc: cl(n.rc) } : null; };

  /* ---------- Unit 12 ---------- */
  /* BST-INSERT: returns { root, path: [keys visited], dirs: ['L'|'R'], parentKey, side }. Duplicates go right (the lecture assumes none). */
  BST.insert = function (rootN, item) {
    var r = BST.clone(rootN), path = [], dirs = [];
    if (!r) return { root: mk(item), path: [], dirs: [], parentKey: null, side: null };
    var n = r;
    for (;;) {
      path.push(n.key);
      if (item < n.key) { dirs.push('L'); if (!n.lc) { n.lc = mk(item); return { root: r, path: path, dirs: dirs, parentKey: n.key, side: 'L' }; } n = n.lc; }
      else { dirs.push('R'); if (!n.rc) { n.rc = mk(item); return { root: r, path: path, dirs: dirs, parentKey: n.key, side: 'R' }; } n = n.rc; }
    }
  };
  BST.build = function (keys) { var r = null; keys.forEach(function (k) { r = BST.insert(r, k).root; }); return r; };
  BST.search = function (rootN, item) {
    var n = rootN, path = [];
    while (n) { path.push(n.key); if (item === n.key) return { found: true, path: path, comparisons: path.length }; n = item < n.key ? n.lc : n.rc; }
    return { found: false, path: path, comparisons: path.length };
  };
  BST.minPath = function (n) { var p = []; while (n) { p.push(n.key); n = n.lc; } return p; };
  BST.maxPath = function (n) { var p = []; while (n) { p.push(n.key); n = n.rc; } return p; };
  BST.height = function h(n) { return n ? 1 + Math.max(h(n.lc), h(n.rc)) : -1; };   // like BST-HEIGHT: NIL is −1
  BST.size = function s(n) { return n ? 1 + s(n.lc) + s(n.rc) : 0; };
  BST.inorder = function (n) { var out = []; (function w(x) { if (!x) return; w(x.lc); out.push(x.key); w(x.rc); })(n); return out; };
  BST.find = function (n, k) { while (n && n.key !== k) n = k < n.key ? n.lc : n.rc; return n; };
  BST.succ = function (rootN, k) { var s = null, n = rootN; while (n) { if (k < n.key) { s = n.key; n = n.lc; } else n = n.rc; } return s; };
  BST.pred = function (rootN, k) { var p = null, n = rootN; while (n) { if (k > n.key) { p = n.key; n = n.rc; } else n = n.lc; } return p; };
  BST.children = function (n) { return (n.lc ? 1 : 0) + (n.rc ? 1 : 0); };

  /* Hibbard deletion. Returns { root, case: 0|1|2, successor, path }.
   * Case 2: the successor (min of the right subtree) moves into the deleted
   * node's place by reference: it takes over the left child and the right subtree minus itself. */
  BST.remove = function (rootN, item) {
    var info = { case: null, successor: null, path: BST.search(rootN, item).path };
    function delMin(n) { if (!n.lc) return n.rc; n.lc = delMin(n.lc); return n; }
    function minNode(n) { while (n.lc) n = n.lc; return n; }
    function del(n) {
      if (!n) return null;
      if (item < n.key) { n.lc = del(n.lc); return n; }
      if (item > n.key) { n.rc = del(n.rc); return n; }
      info.case = BST.children(n);
      if (!n.lc) return n.rc;
      if (!n.rc) return n.lc;
      var s = minNode(n.rc);
      info.successor = s.key;
      s.rc = delMin(n.rc); s.lc = n.lc;
      return s;
    }
    var r = del(BST.clone(rootN));
    info.root = r;
    return info;
  };

  /* Lecture printing for splay nodes: [key-lc-rc], children omitted when NIL. */
  BST.bracket = function br(n) { return n ? '[' + n.key + '-' + (n.lc ? br(n.lc) : '') + '-' + (n.rc ? br(n.rc) : '') + ']' : 'NIL'; };

  /* For ui/treeView: binary shape with hidden placeholders so left/right stay visible. */
  BST.view = function vw(n, opts) {
    opts = opts || {};
    if (!n) return null;
    var kids = [n.lc ? vw(n.lc, opts) : { id: n.id + '_l', label: '', children: [], hidden: true }, n.rc ? vw(n.rc, opts) : { id: n.id + '_r', label: '', children: [], hidden: true }];
    if (!n.lc && !n.rc) kids = [];
    return { id: n.id, key: n.key, label: String(n.key), children: kids };
  };

  /* ---------- Unit 13: splay trees (lecture version) ---------- */
  /* TREE-ROTATE on keys: rotate node x with its parent p (LT-Rot if x is p's left child,
   * RT-Rot if right); the grandparent's pointer to p now points at x. Returns the new root. */
  BST.rotateUp = function (rootN, xKey) {
    var r = BST.clone(rootN), chain = [], n = r;
    while (n && n.key !== xKey) { chain.push(n); n = xKey < n.key ? n.lc : n.rc; }
    if (!n || !chain.length) return { root: r, kind: null };
    var x = n, p = chain[chain.length - 1], g = chain.length > 1 ? chain[chain.length - 2] : null, kind, moved;
    if (p.lc === x) { kind = 'LT'; moved = x.rc; p.lc = x.rc; x.rc = p; }
    else { kind = 'RT'; moved = x.lc; p.rc = x.lc; x.lc = p; }
    if (!g) r = x; else if (g.lc === p) g.lc = x; else g.rc = x;
    return { root: r, kind: kind, parent: p.key, grandparent: g ? g.key : null, moved: moved ? moved.key : null };
  };
  /* ST-SEARCH: node-chain to the key, then rotate it up to the root one step at a time.
   * Returns { found, chain: [keys, node first], frames: [{root, kind, parent, grandparent, moved, depth}] }. */
  BST.splay = function (rootN, key) {
    var s = BST.search(rootN, key);
    if (!s.found) return { found: false, chain: s.path.slice().reverse(), frames: [], root: rootN };
    var frames = [], r = BST.clone(rootN), depth = s.path.length - 1;
    frames.push({ root: r, kind: null, depth: depth });
    while (depth > 0) {
      var st = BST.rotateUp(r, key);
      r = st.root; depth--;
      frames.push({ root: r, kind: st.kind, parent: st.parent, grandparent: st.grandparent, moved: st.moved, depth: depth });
    }
    return { found: true, chain: s.path.slice().reverse(), frames: frames, root: r };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
