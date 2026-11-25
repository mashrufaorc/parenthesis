/* Parenthesis — content/unit12.js
 * Unit 12: Binary search trees (Topic 12). DATA ONLY. Paths, heights and
 * deletions come from engine/bst.js, which mirrors lisp/unit12.lisp.
 */
(function (root) {
  'use strict';
  var C = root.CQ.content;

  var lisp = {
    insert: { title: 'BST-INSERT (lecture)', code: '(defun bst-insert (node item)\n  (cond ((null node)\n         (make-tree-node :key item))\n        ((< item (key node))\n         (setf (lc node)\n               (bst-insert (lc node) item))\n         node)\n        (t  ; item > key\n         (setf (rc node)\n               (bst-insert (rc node) item))\n         node)))', anchors: {} },
    minmax: { title: 'BST-MIN (lecture)', code: '(defun bst-min (node)\n  (cond ((null node) nil)\n        ((null (lc node)) (key node))\n        (t (bst-min (lc node)))))', anchors: {} },
    del: { title: 'BST-DELETE (Hibbard, in the lecture\'s style)', code: '(defun bst-delete (node item)\n  "Hibbard deletion. Returns the root, so always (setf root (bst-delete root k))"\n  (cond ((null node) nil)\n        ((< item (key node)) (setf (lc node) (bst-delete (lc node) item)) node)\n        ((> item (key node)) (setf (rc node) (bst-delete (rc node) item)) node)\n        ((null (lc node)) (rc node))     ; 0 or 1 child: replace with the child\n        ((null (rc node)) (lc node))\n        (t (let ((succ (bst-min-node (rc node))))   ; 2 children: the successor\n             (setf (rc succ) (bst-delete-min (rc node))   ; moves in, by references\n                   (lc succ) (lc node))\n             succ))))', anchors: {} }
  };

  var concepts = {
    'bst-property': 'The BST property',
    'bst-insert': 'Insertion (and SETF the root)',
    'bst-search': 'Searching: h + 1 comparisons',
    'degenerate': 'Degenerate trees',
    'ordered-ops': 'Min, max, successor, predecessor',
    'hibbard': 'Hibbard deletion',
    'flashback': 'Earlier units (flashback)'
  };

  var briefing = {
    core: 'In a binary search tree every key in a node\'s left subtree is smaller and every key in its right subtree is larger, so a search goes left or right at each node: about log₂ n steps if the tree is balanced, but n if it degenerates into a chain.',
    steps: [
      { kind: 'bstWalk', title: 'Left is smaller, right is larger', keys: [50, 30, 70, 20, 40, 60, 80], find: 60,
        text: 'The lecture\'s tree, built from (50 30 70 20 40 60 80). Search for **60**: at each node, go left if 60 is smaller, right if it\'s larger.',
        after: 'Three comparisons for 7 keys: h + 1, where h = 2 is the height. Every subtree is itself a BST, which is why the same rule works at every node. An in-order traversal lists the keys sorted.' },
      { kind: 'bstShapes', title: 'Same keys, different order', text: 'Insert 20 30 40 50 60 70 80 in sorted order instead.',
        after: 'Every key went right: a degenerate tree, really a linked list. Height 6 instead of 2, and search becomes O(n).' },
      { kind: 'check', title: 'Say it in one sentence',
        question: { id: 'brief12-core', type: 'mcq', concept: 'degenerate', prompt: 'When is searching a BST O(log n), and when is it O(n)?',
          choices: ['O(log n) when the tree is balanced (height ≈ log₂ n); O(n) when it degenerates into a chain', 'Always O(log n)', 'Always O(n)', 'It depends on the key, not the shape'], answer: 0,
          explain: { correct: 'A search makes h + 1 comparisons; the shape decides h.', wrong: { 1: 'Insert sorted keys and you get a chain of height n − 1.', 2: 'A balanced tree halves the candidates at each step.', 3: 'The worst case over all keys is set by the height.' } } } }
    ]
  };

  var games = [
    {
      id: 'bstbuild', title: 'BST Builder', verb: 'Go left or right', icon: '🌲',
      blurb: 'Insert keys by walking down: left if smaller, right if larger, until you reach an empty spot.',
      concepts: ['bst-insert', 'bst-property', 'degenerate'],
      levels: [
        { id: 'try', mode: 'try', title: 'The lecture\'s tree', goal: 'Insert 50 30 70 20 40 60 80 and then 45. Hints on.', kind: 'build', keys: [50, 30, 70, 20, 40, 60, 80, 45] },
        { id: 'solo', mode: 'solo', title: 'Random keys', goal: 'Insert eight random keys. No hints.', kind: 'build', tiers: [7, 8, 10] },
        { id: 'shape', mode: 'watch', title: 'Balanced vs degenerate', goal: 'Same keys, two insertion orders: predict the heights.', kind: 'shape' }
      ]
    },
    {
      id: 'bstsearch', title: 'Search & Walk', verb: 'Tap the path', icon: '🧭',
      blurb: 'Tap the path a search takes; find the min, the max, a successor and a predecessor.',
      concepts: ['bst-search', 'ordered-ops'],
      levels: [
        { id: 'try', mode: 'try', title: 'Paths', goal: 'Search, min and max. Hints on.', kind: 'walk', tasks: ['search', 'min', 'max', 'searchMiss'] },
        { id: 'solo', mode: 'solo', title: 'Successor and predecessor', goal: 'Ordered operations, no hints.', kind: 'walk', tasks: ['succ', 'pred', 'search', 'succ'] }
      ]
    },
    {
      id: 'bstdelete', title: 'Hibbard Deletion', verb: 'Pick the case', icon: '✂',
      blurb: 'Delete keys with 0, 1 or 2 children. For two children, find the successor that moves in.',
      concepts: ['hibbard'],
      levels: [
        { id: 'try', mode: 'try', title: 'Three cases', goal: 'Name the case, then pick the replacement. Every slip explains the rule.', kind: 'delete', count: 3 },
        { id: 'solo', mode: 'solo', title: 'Delete the root', goal: 'Harder trees, no hints.', kind: 'delete', count: 4, rootFirst: true }
      ]
    }
  ];

  var templates = {
    buildPrompt: '**{k}** at node **{at}**: left or right?',
    buildWhy: '{k} {rel} {at}, so go **{dir}**.',
    buildDone: '{k} goes in as the {side} child of {parent}. Height is now {h}.',
    walk: {
      search: 'Search for **{k}**: tap each node the search visits, in order.',
      searchMiss: 'Search for **{k}** (it isn\'t in the tree): tap each node visited until the search falls off.',
      min: 'Find the **minimum**: tap each node on the path.',
      max: 'Find the **maximum**: tap each node on the path.',
      succ: 'Tap the **successor** of {k} (the smallest key larger than {k}).',
      pred: 'Tap the **predecessor** of {k} (the largest key smaller than {k}).'
    },
    caseQ: 'Delete **{k}**. Which case is it?',
    caseWhy: ['{k} has no children: just set its parent\'s link to NIL.', '{k} has one child: the parent\'s link now points at that child.', '{k} has two children: its successor (the smallest key in its right subtree) moves into its place.'],
    succQ: 'Tap the node that replaces {k}: its successor.',
    succWhy: 'The successor is the smallest key in {k}\'s right subtree: go right once, then left until there is no left child. That is {s}.'
  };

  var trace = [
    { id: 'u12t1', type: 'predict', concept: 'bst-property', prompt: 'In-order lists a BST\'s keys sorted. What does this return?', code: "(let ((acc nil))\n  (bt-in-order (build-bst '(50 30 70 20 40 60 80))\n               (lambda (k) (push k acc)))\n  (reverse acc))",
      choices: ['(20 30 40 50 60 70 80)', '(50 30 70 20 40 60 80)', '(50 30 20 40 70 60 80)', '(20 40 30 60 80 70 50)'], answer: 0,
      explain: { correct: 'Left subtree, node, right subtree: smaller keys first, so the output is sorted.', wrong: { 1: 'That\'s the insertion order.', 2: 'That\'s pre-order.', 3: 'That\'s post-order.' } },
      verify: { form: "(let ((acc nil)) (bt-in-order (build-bst '(50 30 70 20 40 60 80)) (lambda (k) (push k acc))) (reverse acc))", expect: '(20 30 40 50 60 70 80)' } },
    { id: 'u12t2', type: 'predict', concept: 'degenerate', prompt: 'What does this return?', code: "(list (bst-height (build-bst '(50 30 70 20 40 60 80)))\n      (bst-height (build-bst '(20 30 40 50 60 70 80))))", choices: ['(2 6)', '(2 2)', '(3 7)', '(6 2)'], answer: 0,
      explain: { correct: 'Same keys: balanced height 2 (≈ log₂ 7), sorted insertion height 6 (n − 1).', wrong: { 1: 'Insertion order changes the shape.', 2: 'Height counts edges, not nodes.', 3: 'The sorted order makes the tall chain.' } },
      verify: { form: "(list (bst-height (build-bst '(50 30 70 20 40 60 80))) (bst-height (build-bst '(20 30 40 50 60 70 80))))", expect: '(2 6)' } },
    { id: 'u12t3', type: 'predict', concept: 'ordered-ops', prompt: 'What does this return?', code: "(let ((bt (build-bst '(50 30 70 20 40 60 80))))\n  (list (bst-min bt) (bst-max bt) (bst-min (rc bt))))", choices: ['(20 80 60)', '(20 80 70)', '(50 80 60)', '(20 50 60)'], answer: 0,
      explain: { correct: 'Min follows lc to 20; max follows rc to 80; the min of the right subtree (70\'s subtree) is 60.', wrong: { 1: 'BST-MIN of the right subtree goes left from 70: 60.', 2: 'The min is the leftmost node, not the root.', 3: 'The max is the rightmost node.' } },
      verify: { form: "(let ((bt (build-bst '(50 30 70 20 40 60 80)))) (list (bst-min bt) (bst-max bt) (bst-min (rc bt))))", expect: '(20 80 60)' } },
    { id: 'u12t4', type: 'predict', concept: 'bst-insert', prompt: 'Insert 45 into the lecture\'s tree. What does this return?', code: "(let ((bt (build-bst '(50 30 70 20 40 60 80))))\n  (setf bt (bst-insert bt 45))\n  (key (rc (rc (lc bt)))))", choices: ['45', '40', '30', 'NIL'], answer: 0,
      explain: { correct: '45 < 50 (left), 45 > 30 (right), 45 > 40 (right): it is 40\'s right child.', wrong: { 1: '40 is (rc (lc bt)); one more rc reaches 45.', 2: '30 is (lc bt).', 3: '45 was inserted there.' } },
      verify: { form: "(let ((bt (build-bst '(50 30 70 20 40 60 80)))) (setf bt (bst-insert bt 45)) (key (rc (rc (lc bt)))))", expect: '45' } },
    { id: 'u12t5', type: 'bug', concept: 'bst-insert', prompt: 'This code tries to build a tree but ROOT stays NIL. Tap the buggy line.', code: "(defun build-bst (values)\n  (let ((root nil))\n    (dolist (v values)\n      (bst-insert root v))\n    root))", answer: [4],
      explain: { correct: 'BST-INSERT returns the (new) root. On an empty tree it makes a node and returns it; without (setf root …) that node is thrown away. Always (setf root (bst-insert root v)).', wrong: { any: 'That line is fine. Look at what is done with BST-INSERT\'s return value.' } },
      verify: { defs: '(defun build-bst (values) (let ((root nil)) (dolist (v values) (bst-insert root v)) root))', form: "(build-bst '(5 3 8))", expect: 'NIL' } },
    { id: 'u12t6', type: 'predict', concept: 'hibbard', prompt: 'Delete the root (two children). What does in-order return, and what is the new root?', code: "(let ((bt (build-bst '(50 30 70 20 40 60 80 65))))\n  (setf bt (bst-delete bt 50))\n  (key bt))", choices: ['60', '40', '65', '70'], answer: 0,
      explain: { correct: 'Two children: the successor (min of the right subtree) is 60, and it moves into the root\'s place. 65 takes 60\'s old spot.', wrong: { 1: '40 is the predecessor. Hibbard deletion uses the successor.', 2: '65 is 60\'s right child; it moves up to 60\'s old place.', 3: '70 is the right child, not the smallest key in the right subtree.' } },
      verify: { form: "(let ((bt (build-bst '(50 30 70 20 40 60 80 65)))) (setf bt (bst-delete bt 50)) (key bt))", expect: '60' } },
    { id: 'u12t7', type: 'bigo', concept: 'degenerate', prompt: 'Searching a degenerate BST with n keys costs…', choices: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], answer: 0,
      explain: { correct: 'Height n − 1: it is a linked list.', wrong: { 1: 'Only when height ≈ log₂ n.', 2: 'You walk down the chain.', 3: 'One path, no repeated work.' } },
      misconception: 'BST search is always O(log n).' },
    { id: 'u12t8', type: 'mcq', concept: 'hibbard', prompt: 'Hibbard deletion of a node with two children: why move the successor node itself instead of copying its key?', choices: ['The lecture says to update the actual references: the successor node moves into the spot', 'Copying keys is impossible in Lisp', 'Copying would break the BST property', 'Moving is faster than copying a number'], answer: 0,
      explain: { correct: 'A node may carry more than a key (a value, other references); moving the node keeps it intact. "Don\'t just copy key/value."', wrong: { 1: 'Copying is possible; the lecture asks for reference updates.', 2: 'Copying the successor\'s key would keep the order correct too; the issue is the node\'s other data.', 3: 'It isn\'t about speed.' } } },
    { id: 'u12t9', type: 'mcq', concept: 'bst-search', prompt: 'A complete BST holds 1,000,000 keys. About how many comparisons does a search need?', choices: ['About 20 (log₂ n)', '1,000,000', '1000', '2'], answer: 0,
      explain: { correct: 'log₂ 1,000,000 ≈ 19.9: h + 1 comparisons.', wrong: { 1: 'That\'s the degenerate (chain) case.', 2: 'That\'s √n.', 3: 'Each comparison only halves the candidates.' } } },
    { id: 'u12t10', type: 'mcq', concept: 'bst-property', prompt: 'Is a binary heap a BST?', choices: ['No: a heap orders parent vs children, not left vs right', 'Yes', 'Only a min heap', 'Only when it is complete'], answer: 0,
      explain: { correct: 'In a BST, left < node < right. In a heap, parent ≥ children (max heap); the two children can be in any order.', wrong: { 1: 'A max heap\'s left child can be larger than its right child.', 2: 'Min heaps don\'t order siblings either.', 3: 'Completeness is a heap\'s shape rule, not a BST rule.' } } }
  ];

  var boss = [
    { id: 'u12b1', type: 'task', task: 'bstbuild', concept: 'bst-insert', keys: [40, 20, 60, 10, 30, 50, 70, 35], prompt: 'Hands-on: insert these keys.' },
    { id: 'u12b2', type: 'mcq', concept: 'degenerate', prompt: 'Which insertion order gives the shortest tree for keys 1–7?', choices: ['4 2 6 1 3 5 7', '1 2 3 4 5 6 7', '7 6 5 4 3 2 1', '1 7 2 6 3 5 4'], answer: 0,
      explain: { correct: 'The middle key first, then the middles of each half: height 2.', wrong: { 1: 'Sorted order: a right chain, height 6.', 2: 'Reverse sorted: a left chain, height 6.', 3: 'Zig-zagging still makes a long path.' } } },
    { id: 'u12b3', type: 'predict', concept: 'bst-search', prompt: 'What does this return?', code: "(bst-search (build-bst '(50 30 70)) 65)", choices: ['NIL', '70', '50', 'An error'], answer: 0,
      explain: { correct: '65 > 50: go right to 70; 65 < 70: go left: NIL. Not found.', wrong: { 1: 'The search passes 70 but 70 isn\'t 65.', 2: '50 isn\'t 65.', 3: 'Falling off the tree just returns NIL.' } },
      verify: { form: "(bst-search (build-bst '(50 30 70)) 65)", expect: 'NIL' } },
    { id: 'u12b4', type: 'mcq', concept: 'ordered-ops', prompt: 'The successor of a node with a right subtree is…', choices: ['The minimum of its right subtree', 'Its right child', 'Its parent', 'The maximum of its left subtree'], answer: 0,
      explain: { correct: 'Go right once, then left as far as possible.', wrong: { 1: 'The right child may have a left subtree with smaller keys.', 2: 'Only when there is no right subtree (and it is a left child).', 3: 'That\'s the predecessor.' } } },
    { id: 'u12b5', type: 'mcq', concept: 'hibbard', prompt: 'Deleting a node with one child:', choices: ['Point the parent\'s link at that child', 'Find the successor', 'Set the node\'s key to NIL', 'Rebuild the tree'], answer: 0,
      explain: { correct: 'The child (and its subtree) takes the node\'s place.', wrong: { 1: 'That\'s for two children.', 2: 'That\'s lazy deletion (a tombstone), which the lecture warns fills the tree up.', 3: 'One link update is enough.' } } },
    { id: 'u12b6', type: 'predict', concept: 'ordered-ops', prompt: 'What does this return?', code: "(bst-max (lc (build-bst '(50 30 70 20 40 60 80))))", choices: ['40', '80', '30', '50'], answer: 0,
      explain: { correct: 'The left subtree is rooted at 30; following rc gives 40.', wrong: { 1: '80 is the max of the whole tree.', 2: '30 has a right child.', 3: '50 isn\'t in the left subtree.' } },
      verify: { form: "(bst-max (lc (build-bst '(50 30 70 20 40 60 80))))", expect: '40' } },
    { id: 'u12b7', type: 'mcq', concept: 'flashback', flashback: 'Unit 5 · Binary search', prompt: 'A balanced BST search and binary search on a sorted array are both O(log n). What does the BST add?', choices: ['O(log n) insertion and deletion (when balanced), instead of O(n) shifting', 'Faster search', 'Less memory', 'Sorting for free on any input'], answer: 0,
      explain: { correct: 'Inserting into a sorted array shifts elements; a balanced BST just links a new node.', wrong: { 1: 'Both searches are O(log n).', 2: 'Nodes need references: more memory.', 3: 'A BST can degenerate on sorted input.' } } },
    { id: 'u12b8', type: 'mcq', concept: 'flashback', flashback: 'Unit 11 · Trees', prompt: 'Which traversal of a BST visits keys in sorted order?', choices: ['In-order', 'Pre-order', 'Post-order', 'Level order'], answer: 0,
      explain: { correct: 'Left (smaller), node, right (larger).', wrong: { 1: 'Pre-order visits the root first.', 2: 'Post-order visits the root last.', 3: 'Level order goes top to bottom.' } } }
  ];

  var cards = {
    'u12-bst': { title: 'Binary search tree', unit: 12, def: 'Every key in the left subtree is smaller, every key in the right subtree larger. Every subtree is a BST. In-order = sorted.', cost: 'Search/insert/delete O(h): O(log n) balanced, O(n) degenerate', lisp: '(setf root (bst-insert root k))  ; always store the root' },
    'u12-degen': { title: 'Degenerate BST', unit: 12, def: 'Inserting sorted keys makes a chain (each node has one child): a linked list in disguise.', cost: 'Height n − 1; shuffle the keys, or rebalance (splay, AVL, …)', lisp: "(bst-height (build-bst '(20 30 40 50 60 70 80)))  ; 6" },
    'u12-ops': { title: 'Ordered operations', unit: 12, def: 'Min: follow lc. Max: follow rc. Successor: min of the right subtree (if any). Predecessor: max of the left subtree (if any).', cost: 'O(h) each', lisp: '(bst-min (rc node))  ; successor when there is a right subtree' },
    'u12-hibbard': { title: 'Hibbard deletion', unit: 12, def: '0 children: unlink. 1 child: link the parent to the child. 2 children: the successor node moves into the spot (update references, don\'t just copy keys).', cost: 'O(h); repeated deletions can unbalance the tree', lisp: '(setf root (bst-delete root k))' }
  };

  C.unitData[12] = {
    id: 12, title: 'Binary search trees', room: 'The Signpost Maze', bossTitle: 'The Maze Keeper',
    intro: 'In the Signpost Maze every junction says "smaller: left, larger: right". Follow the signs, build new paths, and don\'t let the maze turn into one long corridor.',
    lisp: lisp, explain: {}, prompts: {}, templates: templates, concepts: concepts, briefing: briefing,
    games: games, trace: trace, boss: boss, cards: cards,
    summary: { canExplain: [
      'The BST property, and why in-order traversal comes out sorted.',
      'How BST-INSERT walks down, and why its result must be stored with SETF.',
      'Why insertion order decides the shape, and what a degenerate tree costs.',
      'How to find the min, max, successor and predecessor.',
      'Hibbard deletion\'s three cases, and why the successor node moves in.'
    ] }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
