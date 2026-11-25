/* Parenthesis — content/unit13.js
 * Unit 13: Splay trees (Topic 13). DATA ONLY. The lecture's splay rotates the
 * found node with its parent, one rotation at a time, until it is the root.
 * Rotations and chains come from engine/bst.js, which mirrors lisp/unit13.lisp.
 */
(function (root) {
  'use strict';
  var C = root.CQ.content;

  var lisp = {
    rotate: { title: 'TREE-ROTATE (lecture)', code: '(defun tree-rotate (node parent grandparent)\n  (cond ; update structure of parent node\n    ((eql node (lc parent)) (setf (lc parent) (rc node)\n                                  (rc node) parent))\n    ((eql node (rc parent)) (setf (rc parent) (lc node)\n                                  (lc node) parent))\n    (t (error "NODE (~A) is not the child of PARENT (~A)"\n              node parent)))\n  (cond ; update structure of grandparent node\n    ((null grandparent) node)\n    ((eql parent (lc grandparent)) (setf (lc grandparent) node))\n    ((eql parent (rc grandparent)) (setf (rc grandparent) node))\n    (t (error "PARENT (~A) is not the child of GRANDPARENT (~A)"\n              parent grandparent))))', anchors: {} },
    splay: { title: 'SPLAY and ST-SEARCH (lecture)', code: '(defun splay (node chain)\n  (loop for (parent grandparent) on chain do\n    (tree-rotate node parent grandparent))\n  node)\n\n(defun st-search (item root)\n  (multiple-value-bind (node chain)\n      (node-chain item root)\n    (when node\n      (splay (car chain) (cdr chain)))))', anchors: {} }
  };

  /* Example trees (insertion orders for a plain BST). */
  var trees = {
    v: [9, 6, 10, 3, 8, 1, 4, 7],          // the lecture's v
    w: [9, 7, 10, 3, 8, 1, 4],             // splay 3 example shape
    r: [6, 4, 8, 1, 5, 7, 0, 2],           // the lecture's TREE-ROTATE example
    a: [9, 6, 10, 3, 8, 1, 4, 7, 2],
    b: [5, 2, 8, 1, 3, 7, 9, 6]
  };

  var concepts = {
    'balanced': 'Balanced BSTs',
    'rotation': 'Tree rotations (LT-Rot, RT-Rot)',
    'rotation-bst': 'Rotations keep the BST property',
    'splaying': 'Splaying to the root',
    'splay-cost': 'Amortized O(log n), locality',
    'st-search': 'ST-SEARCH and SETF',
    'flashback': 'Earlier units (flashback)'
  };

  var briefing = {
    core: 'A splay tree is a self-adjusting BST: every search rotates the found node up to the root, one rotation at a time, so recently used keys stay near the top; rotations change the shape without breaking the BST property.',
    steps: [
      { kind: 'rotateDemo', title: 'One rotation', tree: 'r', x: 1,
        text: 'Node 1 is the left child of 4. An **LT-Rot** lifts 1 above 4. Watch which subtree changes parents.',
        after: '1 moved up, 4 became 1\'s right child, and 1\'s old right subtree (2) switched to 4\'s left. The grandparent 6 now points at 1. In-order is unchanged, so it\'s still a BST, and only O(1) work.' },
      { kind: 'splayDemo', title: 'Splay to the root', tree: 'v', key: 7,
        text: 'ST-SEARCH 7 in the lecture\'s tree: find it (9 → 6 → 8 → 7), then rotate it with its parent until it is the root.',
        after: 'Three ancestors, three rotations (LT, RT, LT). Search 7 again and it is found at the root on the first comparison.' },
      { kind: 'check', title: 'Say it in one sentence',
        question: { id: 'brief13-core', type: 'mcq', concept: 'splaying', prompt: 'What does ST-SEARCH do when it finds a key?',
          choices: ['Rotates that node up to the root, one rotation at a time, and returns the new root', 'Swaps the key with the root\'s key', 'Rebuilds a balanced tree', 'Nothing: it just returns the node'], answer: 0,
          explain: { correct: 'So you must store it: (setf v (st-search 7 v)).', wrong: { 1: 'Swapping keys would break the BST property; rotations preserve it.', 2: 'Splaying only restructures the search path.', 3: 'A plain BST search does that. A splay tree adjusts itself.' } } } }
    ]
  };

  var games = [
    {
      id: 'rotlab', title: 'Rotation Lab', verb: 'Rotate', icon: '🔄',
      blurb: 'Pick LT-Rot or RT-Rot to lift a node over its parent, and spot the subtree that switches parents.',
      concepts: ['rotation', 'rotation-bst'],
      levels: [
        { id: 'try', mode: 'try', title: 'Lift a node', goal: 'Choose the rotation, then the subtree that moves. Every slip explains the rule.', kind: 'rotate', count: 3 },
        { id: 'solo', mode: 'solo', title: 'Rotations everywhere', goal: 'Five rotations, no hints.', kind: 'rotate', count: 5 }
      ]
    },
    {
      id: 'splayit', title: 'Splay It', verb: 'Splay to the root', icon: '🌀',
      blurb: 'Run ST-SEARCH by hand: rotate the found node up the chain until it is the root.',
      concepts: ['splaying', 'st-search'],
      levels: [
        { id: 'try', mode: 'try', title: 'Search 7', goal: 'The lecture\'s example, rotation by rotation. Hints on.', kind: 'splay', tree: 'v', keys: [7, 3] },
        { id: 'solo', mode: 'solo', title: 'More searches', goal: 'Splay several keys in a row. No hints.', kind: 'splay', tree: 'a', keys: [2, 8, 10] }
      ]
    },
    {
      id: 'access', title: 'Hot Keys', verb: 'Compare costs', icon: '🔥',
      blurb: 'The same searches on a plain BST and on a splay tree: when keys repeat, splaying pays off.',
      concepts: ['splay-cost'],
      levels: [
        { id: 'watch', mode: 'watch', title: 'Locality', goal: 'Predict which tree does less work on repeated searches.', kind: 'access' }
      ]
    }
  ];

  var templates = {
    rotQ: 'Lift **{x}** above its parent **{p}**. Which rotation?',
    rotWhy: { LT: '{x} is {p}\'s **left** child: LT-Rot. {x} becomes the parent; {p} becomes {x}\'s right child.', RT: '{x} is {p}\'s **right** child: RT-Rot. {x} becomes the parent; {p} becomes {x}\'s left child.' },
    movedQ: 'Which subtree switches parents (from {x} to {p})?',
    movedWhy: { some: 'T2: {x}\'s old {side} subtree, rooted at {m}, becomes {p}\'s new {pside} child. T1 and T3 don\'t move.', none: '{x}\'s old {side} subtree is empty, so nothing switches parents.' },
    splayPrompt: '{k} is at depth {d}. Its parent is {p}. Which rotation comes next?',
    splayDone: '{k} is the root. {n} rotations, one per ancestor on the chain ({chain}).',
    accessQ: 'Search 20 times, mostly for the same three keys. Which tree does fewer comparisons in total?'
  };

  var trace = [
    { id: 'u13t1', type: 'predict', concept: 'st-search', prompt: 'The lecture\'s tree v. What does ST-SEARCH return?', code: "(defvar v (build-tree '(9 6 10 3 8 1 4 7)))\n(setf v (st-search 7 v))",
      choices: ['[7-[6-[3-[1--]-[4--]]-]-[9-[8--]-[10--]]]', '[9-[6-[3-[1--]-[4--]]-[8-[7--]-]]-[10--]]', '[7--]', 'NIL'], answer: 0,
      explain: { correct: '7 is rotated up through 8, 6 and 9 and becomes the root; 8 ends up as 9\'s left child.', wrong: { 1: 'That\'s v before the search: splaying changes the tree.', 2: 'The whole tree is printed, rooted at 7.', 3: '7 is in the tree.' } },
      verify: { setup: "(defvar v (build-tree '(9 6 10 3 8 1 4 7)))", form: '(setf v (st-search 7 v))', expect: '[7-[6-[3-[1--]-[4--]]-]-[9-[8--]-[10--]]]' } },
    { id: 'u13t2', type: 'predict', concept: 'st-search', prompt: 'Searching for a key that isn\'t there:', code: "(st-search 11 (build-tree '(9 6 10 3 8 1 4 7)))", choices: ['NIL', '[10--]', '[9-…-[10--]]', 'An error'], answer: 0,
      explain: { correct: 'NODE-CHAIN returns NIL, so no splay: ST-SEARCH returns NIL. Don\'t (setf v …) on a miss or you lose the tree!', wrong: { 1: 'The search falls off after 10; nothing is splayed.', 2: 'It returns NIL, not the tree.', 3: 'A miss is not an error.' } },
      verify: { form: "(st-search 11 (build-tree '(9 6 10 3 8 1 4 7)))", expect: 'NIL' } },
    { id: 'u13t3', type: 'predict', concept: 'rotation', prompt: 'NODE-CHAIN returns two values: the node, and the chain of nodes on its path. What are the keys in the chain?', code: "(mapcar #'key\n  (second (multiple-value-list\n    (node-chain 8 (build-tree '(9 6 10 3 8 1 4 7))))))",
      choices: ['(8 6 9)', '(9 6 8)', '(6 9)', '(8)'], answer: 0,
      explain: { correct: 'Closest first: the node itself, its parent 6, then the root 9. SPLAY walks this list with LOOP … ON, rotating 8 with each (parent grandparent) pair.', wrong: { 1: 'The chain is built by pushing as the search goes down, so it comes out closest first.', 2: 'The chain starts with the node itself; SPLAY gets (car chain) as the node.', 3: 'The chain holds every node on the path.' } },
      verify: { form: "(mapcar #'key (second (multiple-value-list (node-chain 8 (build-tree '(9 6 10 3 8 1 4 7))))))", expect: '(8 6 9)' } },
    { id: 'u13t4', type: 'predict', concept: 'rotation', prompt: 'TREE-ROTATE node 1 with parent 4 (grandparent 6). What does R print as afterwards?', code: "(let ((r (build-tree '(6 4 8 1 5 7 0 2))))\n  (tree-rotate (lc (lc r)) (lc r) r)\n  r)",
      choices: ['[6-[1-[0--]-[4-[2--]-[5--]]]-[8-[7--]-]]', '[1-[0--]-[4-[2--]-[5--]]]', '[6-[4-[1-[0--]-[2--]]-[5--]]-[8-[7--]-]]', '[4-[1-[0--]-[2--]]-[6-[5--]-[8-[7--]-]]]'], answer: 0,
      explain: { correct: 'LT-Rot: 1 moves up, 4 becomes its right child, 2 switches to 4\'s left; 6\'s left pointer now points at 1.', wrong: { 1: 'That\'s TREE-ROTATE\'s return value (node 1); R is still rooted at 6.', 2: 'That\'s before the rotation.', 3: 'That would rotate 4 with 6.' } },
      verify: { form: "(let ((r (build-tree '(6 4 8 1 5 7 0 2)))) (tree-rotate (lc (lc r)) (lc r) r) r)", expect: '[6-[1-[0--]-[4-[2--]-[5--]]]-[8-[7--]-]]' } },
    { id: 'u13t5', type: 'predict', concept: 'rotation', prompt: 'LOOP …ON walks a list and its tails. What does this collect?', code: "(let ((acc nil))\n  (loop for (a b) on '(1 2 3) do (push (list a b) acc))\n  (reverse acc))", choices: ['((1 2) (2 3) (3 NIL))', '((1 2) (3 NIL))', '((1 2) (2 3))', '(1 2 3)'], answer: 0,
      explain: { correct: 'ON gives (1 2 3), (2 3), (3): the first two of each. The last pair has NIL: SPLAY uses that for "no grandparent".', wrong: { 1: 'ON steps by one, not two.', 2: 'The last tail (3) still runs, with b = NIL.', 3: 'Each step binds a and b.' } },
      verify: { form: "(let ((acc nil)) (loop for (a b) on '(1 2 3) do (push (list a b) acc)) (reverse acc))", expect: '((1 2) (2 3) (3 NIL))' } },
    { id: 'u13t6', type: 'mcq', concept: 'rotation-bst', prompt: 'Why is the tree still a BST after LT-Rot?', choices: ['The in-order sequence T1 < x < T2 < p < T3 is unchanged', 'Rotations swap keys to restore order', 'Only leaves move', 'It isn\'t: you must re-sort afterwards'], answer: 0,
      explain: { correct: 'A rotation re-hangs subtrees but keeps their left-to-right order.', wrong: { 1: 'No keys are swapped: references change.', 2: 'Internal nodes move too.', 3: 'Rotations are designed to preserve the BST property.' } } },
    { id: 'u13t7', type: 'mcq', concept: 'splay-cost', prompt: 'A splay tree search is…', choices: ['O(log n) amortized; a single search can still be O(n)', 'Always O(log n)', 'Always O(1)', 'O(n log n)'], answer: 0,
      explain: { correct: 'Expensive searches restructure the tree so that later ones are cheap: averaged over a sequence, O(log n).', wrong: { 1: 'One search on a chain-shaped splay tree walks the whole chain.', 2: 'Only when the key is already at the root.', 3: 'One search follows one path.' } },
      misconception: 'Splay trees guarantee O(log n) for every search.' },
    { id: 'u13t8', type: 'mcq', concept: 'balanced', prompt: 'What does a splay tree store in each node to stay balanced?', choices: ['Nothing extra: just key, lc and rc', 'A height', 'A colour', 'A balance factor'], answer: 0,
      explain: { correct: 'Unlike AVL (heights / balance factors) or red-black trees (colours), splay trees store no balance information.', wrong: { 1: 'That\'s AVL trees.', 2: 'That\'s red-black trees.', 3: 'That\'s AVL trees.' } } },
    { id: 'u13t9', type: 'mcq', concept: 'splay-cost', prompt: 'Which workload suits a splay tree best?', choices: ['Repeated searches for a few popular keys (like a cache)', 'Each key searched exactly once in random order', 'Keys accessed in sorted order once each', 'No searches at all'], answer: 0,
      explain: { correct: 'Popular keys stay near the root, so they are found in a step or two.', wrong: { 1: 'Without repetition, splaying is mostly overhead.', 2: 'Sorted one-pass access gains nothing from locality.', 3: 'Then any structure will do.' } } },
    { id: 'u13t10', type: 'mcq', concept: 'st-search', prompt: 'Why must you write (setf v (st-search 7 v))?', choices: ['Splaying changes the root; ST-SEARCH returns the new one', 'ST-SEARCH copies the tree', 'SETF is needed to search', 'It frees memory'], answer: 0,
      explain: { correct: 'After splaying, the old root is somewhere inside the tree; only the return value is the real root.', wrong: { 1: 'It restructures the same nodes.', 2: 'The search itself works without SETF; you\'d just lose the new root.', 3: 'Nothing is freed.' } } }
  ];

  var boss = [
    { id: 'u13b1', type: 'task', task: 'splay', concept: 'splaying', tree: 'b', key: 6, prompt: 'Hands-on: splay 6 to the root.' },
    { id: 'u13b2', type: 'mcq', concept: 'rotation', prompt: 'x is p\'s right child. After RT-Rot…', choices: ['p is x\'s left child, and x\'s old left subtree becomes p\'s right subtree', 'p is x\'s right child', 'x and p swap keys', 'p is removed'], answer: 0,
      explain: { correct: 'RT-Rot is the mirror of LT-Rot.', wrong: { 1: 'That\'s LT-Rot.', 2: 'Keys never move between nodes.', 3: 'No node is removed.' } } },
    { id: 'u13b3', type: 'predict', concept: 'st-search', prompt: 'What does this print?', code: "(let ((w (build-tree '(9 7 10 3 8 1 4))))\n  (setf w (st-search 3 w))\n  (key w))", choices: ['3', '9', '7', 'NIL'], answer: 0,
      explain: { correct: '3 was rotated with 7, then with 9: it is the root.', wrong: { 1: '9 was the root before the search.', 2: '7 was 3\'s parent.', 3: '3 is in the tree.' } },
      verify: { form: "(let ((w (build-tree '(9 7 10 3 8 1 4)))) (setf w (st-search 3 w)) (key w))", expect: '3' } },
    { id: 'u13b4', type: 'mcq', concept: 'splaying', prompt: 'A key is at depth 4. How many TREE-ROTATE calls does splaying it take (lecture version)?', choices: ['4', '2', '1', '8'], answer: 0,
      explain: { correct: 'One rotation per ancestor on the chain.', wrong: { 1: 'This version rotates with the parent one step at a time.', 2: 'Each rotation lifts the node one level.', 3: 'One rotation per level, not two.' } } },
    { id: 'u13b5', type: 'mcq', concept: 'splay-cost', prompt: 'You search for the same key twice in a row in a splay tree. The second search costs…', choices: ['One comparison: it is at the root', 'The same as the first', 'Twice as much', 'O(log n) exactly'], answer: 0,
      explain: { correct: 'The first search splayed it to the root.', wrong: { 1: 'In a plain BST, yes. Splaying changes the shape.', 2: 'It got cheaper.', 3: 'It is O(1) here.' } } },
    { id: 'u13b6', type: 'mcq', concept: 'rotation-bst', prompt: 'How much work is one rotation?', choices: ['O(1): a few reference updates', 'O(n)', 'O(log n)', 'O(h)'], answer: 0,
      explain: { correct: 'Only x, p and the grandparent\'s pointer change.', wrong: { 1: 'Subtrees move as whole units.', 2: 'No search inside a rotation.', 3: 'Height doesn\'t matter for one rotation.' } } },
    { id: 'u13b7', type: 'mcq', concept: 'flashback', flashback: 'Unit 12 · BSTs', prompt: 'Insert 1, 2, 3, 4, 5 into a plain BST, then search for 5. Comparisons?', choices: ['5', '3', '1', '2'], answer: 0,
      explain: { correct: 'Sorted inserts make a right chain: the search walks all 5 nodes.', wrong: { 1: 'That would need a balanced tree.', 2: '5 is at the bottom of the chain.', 3: 'It\'s a chain of 5.' } } },
    { id: 'u13b8', type: 'mcq', concept: 'flashback', flashback: 'Unit 9 · Hashing', prompt: 'A cache keeps recently used items handy. Splay tree or hash table?', choices: ['Hash table for O(1) average lookups; a splay tree if you also need keys in order', 'Always a splay tree', 'Always a linked list', 'Neither can be a cache'], answer: 0,
      explain: { correct: 'Splay trees shine when access is skewed AND you need the BST\'s ordered operations.', wrong: { 1: 'Hash tables are faster on average for plain lookups.', 2: 'A list is O(n).', 3: 'Both are used in caches.' } } }
  ];

  var cards = {
    'u13-rot': { title: 'Tree rotations', unit: 13, def: 'LT-Rot lifts a left child x over its parent p (p becomes x\'s right child; x\'s right subtree T2 moves to p\'s left). RT-Rot is the mirror. The grandparent then points at x.', cost: 'O(1); in-order unchanged, so still a BST', lisp: '(tree-rotate node parent grandparent)' },
    'u13-splay': { title: 'Splay trees', unit: 13, def: 'A self-adjusting BST: ST-SEARCH finds the node (NODE-CHAIN), then rotates it with its parent until it is the root. No balance data stored.', cost: 'O(log n) amortized; one search can be O(n); repeated keys are cheap', lisp: '(setf v (st-search 7 v))  ; but not on a miss!' }
  };

  C.unitData[13] = {
    id: 13, title: 'Splay trees', room: 'The Spinning Gallery', bossTitle: 'The Whirligig',
    intro: 'In the Spinning Gallery, whatever you look at swings to the front. Learn the rotations that keep the shelves in order while they spin.',
    lisp: lisp, trees: trees, explain: {}, prompts: {}, templates: templates, concepts: concepts, briefing: briefing,
    games: games, trace: trace, boss: boss, cards: cards,
    summary: { canExplain: [
      'What LT-Rot and RT-Rot do, and why a rotation keeps the BST property.',
      'How ST-SEARCH splays a found node to the root, one rotation per ancestor.',
      'Why you store ST-SEARCH\'s result, and why not on a miss.',
      'Why splay trees are O(log n) amortized, and when they beat a plain BST.'
    ] }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
