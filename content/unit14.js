/* Parenthesis — content/unit14.js
 * Unit 14: Heaps and heapsort (Topic 14). DATA ONLY. Every swap and index comes
 * from engine/heap.js, which mirrors lisp/unit14.lisp.
 */
(function (root) {
  'use strict';
  var C = root.CQ.content;

  var lisp = {
    up: { title: 'HEAP-PUSH and HEAP-UP (lecture)', code: '(defun heap-up (vec i comp)\n  (when (and (> i 0) (funcall comp (aref vec i) (aref vec (hparent i))))\n    (rotatef (aref vec i) (aref vec (hparent i)))  ; swap child and parent\n    (heap-up vec (hparent i) comp))                ; moves item further up\n  vec)\n\n(defun heap-push (node vec comp)\n  "Note: comp should be #\'< for min heap or #\'> for max heap"\n  ; inserts item at fillpoint position (end of the array)\n  (vector-push-extend node vec)\n  (heap-up vec (1- (length vec)) comp))', anchors: {} },
    down: { title: 'HEAP-DOWN (lecture)', code: '(defun heap-down (vec beg comp &optional (end (length vec)))\n  (labels ((hrt (i) (* (+ i 1) 2))   ;; local function\n           (hlt (i) (- (hrt i) 1)))  ;; local function\n    (let ((l (hlt beg))   ;; left child index, could be OOB\n          (r (hrt beg)))  ;; right child index, could be OOB\n      (when (< l end)     ;; ensure left child not OOB\n        (let ((child (if (or (>= r end)   ;; ensure right child not OOB\n                             (funcall comp (aref vec l) (aref vec r)))\n                         l    ;; left is bigger\n                         r))) ;; right is bigger\n          (when (funcall comp (aref vec child) (aref vec beg))\n            (rotatef (aref vec beg) (aref vec child))\n            (heap-down vec child comp end)))))))', anchors: {} },
    heapsort: { title: 'HEAPSORT (lecture)', code: '(defun heapsort (vec comp)\n  (heapify vec comp)\n  (dotimes (i (- (length vec) 1))\n    (let ((last (- (length vec) i 1)))\n      (rotatef (aref vec 0)\n               (aref vec last))\n      (heap-down vec 0 comp last)))\n  vec)', anchors: { start: 2, sink: 7, heap: 2, extract: 5, done: 8 } }
  };

  var concepts = {
    'pq': 'Priority queue ADT',
    'heap-props': 'Shape and heap properties',
    'heap-index': 'Array indexes: parent and children',
    'heap-up': 'HEAP-PUSH: swim up',
    'heap-down': 'HEAP-POP: sink down',
    'heapify': 'HEAPIFY (Floyd) is O(n)',
    'heapsort': 'Heapsort: in place, O(n log n)',
    'flashback': 'Earlier units (flashback)'
  };

  var briefing = {
    core: 'A binary heap is a complete binary tree stored in an array where every parent beats its children (max heap: parent ≥ children); the top is always at index 0, and push or pop only swims or sinks along one path, so both are O(log n).',
    steps: [
      { kind: 'heapTwin', title: 'A tree in an array', values: [100, 19, 36, 17, 3, 25, 1, 2, 7],
        text: 'The lecture\'s max heap, as a tree and as an array. Tap any slot to see its parent and children.',
        after: 'No pointers needed: the parent of i is floor((i−1)/2), its children are 2i+1 and 2i+2. Complete trees pack with no gaps.' },
      { kind: 'heapPushDemo', title: 'Push 77', values: [100, 19, 36, 17, 3, 25, 1, 2, 7], x: 77,
        text: '77 goes in at the end (index 9), then swims up while it beats its parent.',
        after: '77 swapped with 3, then with 19, then stopped under 100: 3 comparisons. At most h + 1 = floor(log₂ n) + 1.' },
      { kind: 'check', title: 'Say it in one sentence',
        question: { id: 'brief14-core', type: 'mcq', concept: 'heap-props', prompt: 'What does the max-heap property promise?',
          choices: ['Every parent is ≥ its children, so the max is at the root', 'The array is sorted', 'Left child < parent < right child', 'Every level has the same values'], answer: 0,
          explain: { correct: 'Peek is O(1): (aref vec 0).', wrong: { 1: 'Only parent-vs-child order is promised; siblings are unordered.', 2: 'That\'s a BST. A heap is not a BST.', 3: 'Values differ; the property is about parent vs children.' } } } }
    ]
  };

  var games = [
    {
      id: 'heapidx', title: 'Index Map', verb: 'Tap parent & children', icon: '🗺',
      blurb: 'The same heap as a tree and as an array. Find parents and children by index arithmetic.',
      concepts: ['heap-index', 'heap-props'],
      levels: [
        { id: 'try', mode: 'try', title: 'Parent and children', goal: 'Tap the slot the question asks for. Hints on.', kind: 'index', count: 6 },
        { id: 'heapq', mode: 'solo', title: 'Heap or not?', goal: 'Is this array a valid max heap? No hints.', kind: 'isheap', count: 6 }
      ]
    },
    {
      id: 'heappush', title: 'Swim Up', verb: 'Swap or stop', icon: '🏊',
      blurb: 'HEAP-PUSH: the new item enters at the end and swims up while it beats its parent.',
      concepts: ['heap-up'],
      levels: [
        { id: 'try', mode: 'try', title: 'Push into a max heap', goal: 'At each comparison: swap or stop? Hints on.', kind: 'push', count: 4, comp: 'max' },
        { id: 'solo', mode: 'solo', title: 'Min heap', goal: 'Same code with #\'<. No hints.', kind: 'push', count: 4, comp: 'min' }
      ]
    },
    {
      id: 'heappop', title: 'Sink Down', verb: 'Pick the child', icon: '⚓',
      blurb: 'HEAP-POP: the last item takes the root and sinks, always swapping with the winning child.',
      concepts: ['heap-down'],
      levels: [
        { id: 'try', mode: 'try', title: 'Pop the max', goal: 'Tap the child to swap with, or stop. Hints on.', kind: 'pop', count: 3, comp: 'max' },
        { id: 'solo', mode: 'solo', title: 'Pop repeatedly', goal: 'Five pops in a row. No hints.', kind: 'pop', count: 5, comp: 'max' }
      ]
    },
    {
      id: 'heapsortlab', title: 'Heapify & Heapsort', verb: 'Watch it build', icon: '⛰',
      blurb: 'Floyd\'s HEAPIFY sinks every internal node, last one first; heapsort then swaps the root into the sorted tail.',
      concepts: ['heapify', 'heapsort'],
      levels: [
        { id: 'heapify', mode: 'watch', title: 'HEAPIFY', goal: 'Predict which index is sunk first, then watch.', kind: 'heapify' },
        { id: 'sort', mode: 'watch', title: 'Heapsort vs the others', goal: 'Heapsort next to merge sort and quicksort.', kind: 'sort' },
        { id: 'sandbox', mode: 'sandbox', title: 'Heap bench', goal: 'Your own array: heapify and heapsort.', kind: 'sandbox' }
      ]
    }
  ];

  var templates = {
    pushPrompt: 'Push **{x}**. It is at index {i} ({v}); its parent is index {p} ({pv}). Swap or stop?',
    pushWhy: { swap: '{v} {rel} {pv}: it wins COMP against its parent, so swap and keep swimming.', stop: '{v} does not beat {pv}: stop. The heap property holds.', root: 'It reached index 0, the root: stop.' },
    popPrompt: 'Sinking {v} at index {i}. Tap the child to swap with, or press Stop.',
    popWhy: 'HEAP-DOWN compares the two children and picks the winner ({c} at index {ci}); it swaps only if that child beats {v}.',
    indexQ: { parent: 'Tap the **parent** of index {i}.', left: 'Tap the **left child** of index {i}.', right: 'Tap the **right child** of index {i}.' },
    indexWhy: { parent: 'parent(i) = floor((i − 1) / 2) = floor(({i} − 1) / 2) = {a}.', left: 'left(i) = 2i + 1 = {a}.', right: 'right(i) = 2i + 2 = {a}.' }
  };

  var trace = [
    { id: 'u14t1', type: 'predict', concept: 'heap-index', prompt: 'What does this return?', code: '(list (hparent 4) (hlt 1) (hrt 1) (hparent 0))', choices: ['(1 3 4 -1)', '(2 2 3 0)', '(1 2 3 -1)', '(2 3 4 0)'], answer: 0,
      explain: { correct: 'parent(4) = floor(3/2) = 1; children of 1 are 3 and 4; the root has no parent: −1.', wrong: { 1: 'Use floor((i − 1)/2) and 2i + 1, 2i + 2 (root at index 0).', 2: 'Children of 1: 2·1 + 1 = 3 and 2·1 + 2 = 4.', 3: '(floor -1 2) is −1.' } },
      verify: { form: '(list (hparent 4) (hlt 1) (hrt 1) (hparent 0))', expect: '(1 3 4 -1)' } },
    { id: 'u14t2', type: 'predict', concept: 'heap-up', prompt: 'Four pushes into an empty max heap. What is the vector?', code: "(let ((h (make-array 0 :adjustable t :fill-pointer 0)))\n  (heap-push 11 h #'>)\n  (heap-push 19 h #'>)\n  (heap-push 9 h #'>)\n  (heap-push 20 h #'>))", choices: ['#(20 19 9 11)', '#(9 11 19 20)', '#(20 19 11 9)', '#(11 19 9 20)'], answer: 0,
      explain: { correct: '20 enters at index 3, beats 11 (swap), beats 19 (swap): it is the root.', wrong: { 1: 'A max heap keeps the max at index 0.', 2: 'A heap is not sorted: 11 sits at index 3 after 20 passes it.', 3: 'HEAP-UP moves 20 up.' } },
      verify: { form: "(let ((h (make-array 0 :adjustable t :fill-pointer 0))) (heap-push 11 h #'>) (heap-push 19 h #'>) (heap-push 9 h #'>) (heap-push 20 h #'>))", expect: '#(20 19 9 11)' } },
    { id: 'u14t3', type: 'predict', concept: 'heap-down', prompt: 'HEAP-POP on the max heap #(20 19 18 7 11 5). What does this return?', code: "(let ((a (make-array 0 :adjustable t :fill-pointer 0)))\n  (dolist (i '(20 19 18 7 11 5)) (vector-push-extend i a))\n  (list (heap-pop a #'>) a))", choices: ['(20 #(19 11 18 7 5))', '(5 #(20 19 18 7 11))', '(20 #(19 18 11 7 5))', '(20 #(5 19 18 7 11))'], answer: 0,
      explain: { correct: '5 takes the root and sinks: swap with 19 (bigger child), then with 11.', wrong: { 1: 'HEAP-POP returns the root (the max), via PROG1.', 2: 'A heap is not sorted; 5 sinks along one path.', 3: 'The new root sinks.' } },
      verify: { form: "(let ((a (make-array 0 :adjustable t :fill-pointer 0))) (dolist (i '(20 19 18 7 11 5)) (vector-push-extend i a)) (list (heap-pop a #'>) a))", expect: '(20 #(19 11 18 7 5))' } },
    { id: 'u14t4', type: 'predict', concept: 'heapify', prompt: 'Floyd\'s HEAPIFY. What does V hold afterwards?', code: "(let ((v (vector 10 5 2 6 12 15 1 9 7 8)))\n  (heapify v #'>)\n  v)", choices: ['#(15 12 10 9 8 2 1 6 7 5)', '#(15 12 10 9 8 7 6 5 2 1)', '#(1 2 5 6 7 8 9 10 12 15)', '#(10 5 2 6 12 15 1 9 7 8)'], answer: 0,
      explain: { correct: 'Sinks indexes 4, 3, 2, 1, 0 in that order. A max heap, but not sorted.', wrong: { 1: 'That\'s sorted descending; a heap only orders parents over children.', 2: 'HEAPIFY doesn\'t sort.', 3: 'HEAPIFY changes V in place.' } },
      verify: { form: "(let ((v (vector 10 5 2 6 12 15 1 9 7 8))) (heapify v #'>) v)", expect: '#(15 12 10 9 8 2 1 6 7 5)' } },
    { id: 'u14t5', type: 'predict', concept: 'heapsort', prompt: 'What does this return?', code: "(heapsort (vector 9 6 10 7 8) #'>)", choices: ['#(6 7 8 9 10)', '#(10 9 8 7 6)', '#(10 9 6 7 8)', '#(9 6 10 7 8)'], answer: 0,
      explain: { correct: 'A max heap (#\'>) sorts ascending: each pass swaps the max into the end.', wrong: { 1: 'That\'s with #\'< (min heap).', 2: 'That\'s just after HEAPIFY.', 3: 'It sorts in place.' } },
      verify: { form: "(heapsort (vector 9 6 10 7 8) #'>)", expect: '#(6 7 8 9 10)' } },
    { id: 'u14t6', type: 'predict', concept: 'heap-down', prompt: 'PROG1 vs PROGN. What does this return?', code: "(let ((x 1))\n  (prog1 x (setf x 2)))", choices: ['1', '2', 'NIL', '(1 2)'], answer: 0,
      explain: { correct: 'PROG1 returns its first form\'s value. HEAP-POP uses it to return the popped root after HEAP-DOWN runs.', wrong: { 1: 'PROGN would return 2.', 2: 'It returns a value.', 3: 'Only one value comes back.' } },
      verify: { form: '(let ((x 1)) (prog1 x (setf x 2)))', expect: '1' } },
    { id: 'u14t7', type: 'bigo', concept: 'heapify', prompt: 'HEAPIFY calls HEAP-DOWN floor(n/2) times. Its total cost is…', choices: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'], answer: 0,
      explain: { correct: 'Most nodes are near the bottom and sink only a little: n/4·1 + n/8·2 + … ≤ n.', wrong: { 1: 'That\'s the easy upper bound; the tight bound is O(n).', 2: 'Every internal node is sunk.', 3: 'Each sink is at most log n.' } } },
    { id: 'u14t8', type: 'mcq', concept: 'pq', prompt: 'A priority queue on an unsorted list: enqueue and dequeue cost…', choices: ['O(1) and O(n)', 'O(n) and O(1)', 'O(log n) and O(log n)', 'O(1) and O(1)'], answer: 0,
      explain: { correct: 'Append is O(1); finding the highest priority means scanning. A binary heap makes both O(log n).', wrong: { 1: 'That\'s a sorted list.', 2: 'That\'s the binary heap.', 3: 'Someone has to find the max.' } } },
    { id: 'u14t9', type: 'mcq', concept: 'heapsort', prompt: 'Heapsort vs merge sort:', choices: ['Both O(n log n); heapsort is in place (O(1) extra), merge sort needs O(n)', 'Heapsort is O(n²)', 'Merge sort is in place', 'Heapsort is stable'], answer: 0,
      explain: { correct: 'The sorted tail grows at the end of the same vector.', wrong: { 1: 'Every pass is one O(log n) sink.', 2: 'Merging needs a helper array.', 3: 'Long-distance swaps break stability.' } } },
    { id: 'u14t10', type: 'mcq', concept: 'heap-props', prompt: 'Why must a heap be a complete binary tree?', choices: ['So it fits an array with no gaps, and its height stays floor(log₂ n)', 'So it is sorted', 'So it is a BST', 'So nodes can have three children'], answer: 0,
      explain: { correct: 'Completeness gives the index formulas and the O(log n) height.', wrong: { 1: 'Heaps aren\'t sorted.', 2: 'Heaps aren\'t BSTs.', 3: 'Binary heaps have at most two children.' } } }
  ];

  var boss = [
    { id: 'u14b1', type: 'task', task: 'heappop', concept: 'heap-down', values: [36, 19, 25, 17, 3, 7, 1, 2], prompt: 'Hands-on: pop the max and sink the new root.' },
    { id: 'u14b2', type: 'mcq', concept: 'heap-up', prompt: 'Pushing into a max heap of n items makes at most how many comparisons?', choices: ['floor(log₂ n) + 1', 'n', '2 log₂ n', '1'], answer: 0,
      explain: { correct: 'One per level as it swims: h + 1.', wrong: { 1: 'It only follows one path up.', 2: 'That\'s HEAP-POP (two compares per level).', 3: 'Only if it doesn\'t beat its parent.' } } },
    { id: 'u14b3', type: 'predict', concept: 'heapsort', prompt: 'A min heap (#\'<) sorts…', code: "(heapsort (vector 3 1 4 1 5) #'<)", choices: ['#(5 4 3 1 1)', '#(1 1 3 4 5)', '#(3 1 4 1 5)', '#(1 3 1 4 5)'], answer: 0,
      explain: { correct: 'Each pass moves the min to the end: descending order.', wrong: { 1: 'That\'s #\'> (max heap).', 2: 'It sorts.', 3: 'Heapsort produces fully sorted output.' } },
      verify: { form: "(heapsort (vector 3 1 4 1 5) #'<)", expect: '#(5 4 3 1 1)' } },
    { id: 'u14b4', type: 'mcq', concept: 'heap-index', prompt: 'A heap holds 10 items (indexes 0–9). Which indexes are leaves?', choices: ['5 to 9', '0 to 4', 'Only 9', '8 and 9'], answer: 0,
      explain: { correct: 'Indexes ≥ floor(n/2) have no children, which is why HEAPIFY starts at mid − 1 = 4.', wrong: { 1: 'Those are the internal nodes.', 2: 'Half the nodes are leaves.', 3: 'Leaves start at floor(10/2) = 5.' } } },
    { id: 'u14b5', type: 'mcq', concept: 'heap-down', prompt: 'When a node sinks in a max heap, it swaps with…', choices: ['The larger of its two children (if that child is larger than it)', 'The left child always', 'The smaller child', 'Its parent'], answer: 0,
      explain: { correct: 'Swapping with the larger child keeps the heap property for the other child.', wrong: { 1: 'Only if the left child wins COMP.', 2: 'That would put a smaller value above a larger one.', 3: 'Sinking goes down.' } } },
    { id: 'u14b6', type: 'mcq', concept: 'heapify', prompt: 'Building a heap by n pushes (Williams) vs HEAPIFY (Floyd):', choices: ['O(n log n) vs O(n)', 'Both O(n)', 'Both O(n log n)', 'O(n) vs O(n log n)'], answer: 0,
      explain: { correct: 'Floyd\'s sinks do little work near the bottom, where most nodes are.', wrong: { 1: 'n pushes can each climb log n levels.', 2: 'HEAPIFY\'s tight bound is O(n).', 3: 'Reversed.' } } },
    { id: 'u14b7', type: 'mcq', concept: 'flashback', flashback: 'Unit 6 · Quicksort', prompt: 'Heapsort vs quicksort on already sorted input:', choices: ['Heapsort stays O(n log n); last-pivot quicksort degrades to O(n²)', 'Both O(n²)', 'Both O(n)', 'Heapsort degrades'], answer: 0,
      explain: { correct: 'Heapsort\'s cost doesn\'t depend on the input order.', wrong: { 1: 'Heapsort has no bad inputs.', 2: 'Neither is linear.', 3: 'Its height-based cost is fixed.' } } },
    { id: 'u14b8', type: 'mcq', concept: 'flashback', flashback: 'Unit 8 · Queues', prompt: 'A queue is FIFO. A priority queue removes…', choices: ['The highest-priority item, whatever arrived first', 'The oldest item', 'The newest item', 'A random item'], answer: 0,
      explain: { correct: 'Priority decides, not arrival order.', wrong: { 1: 'That\'s a plain queue.', 2: 'That\'s a stack.', 3: 'Removal is by priority.' } } }
  ];

  var cards = {
    'u14-heap': { title: 'Binary heap', unit: 14, def: 'A complete binary tree with the heap property (max heap: parent ≥ children), stored in an array. Not a BST.', cost: 'Peek O(1), push O(log n), pop O(log n), heapify O(n)', lisp: '(aref vec 0)  ; the max' },
    'u14-index': { title: 'Heap indexes', unit: 14, def: 'Root at 0. parent(i) = floor((i−1)/2), left(i) = 2i+1, right(i) = 2i+2. Leaves are indexes ≥ floor(n/2).', cost: 'No pointers needed', lisp: '(defun hparent (i) (floor (- i 1) 2))' },
    'u14-ops': { title: 'Swim and sink', unit: 14, def: 'HEAP-PUSH appends and swims up while it beats its parent. HEAP-POP swaps root and last, pops, then sinks the new root, swapping with the winning child.', cost: 'Push ≤ h + 1 compares, pop ≤ 2h', lisp: "(heap-push x vec #'>)  (heap-pop vec #'>)" },
    'u14-sort': { title: 'Heapsort', unit: 14, def: 'HEAPIFY, then n−1 times: swap the root into the last heap slot and sink the new root in the shrunken heap.', cost: 'O(n log n) on every input, in place (O(1) extra), not stable', lisp: "(heapsort vec #'>)  ; ascending" }
  };

  C.unitData[14] = {
    id: 14, title: 'Heaps and heapsort', room: 'The Triage Tower', bossTitle: 'The Chief Medic',
    intro: 'The Triage Tower must always treat the most urgent patient next. Build the priority queue that makes that fast, then sort with it.',
    lisp: lisp, explain: {}, prompts: {}, templates: templates, concepts: concepts, briefing: briefing,
    games: games, trace: trace, boss: boss, cards: cards,
    summary: { canExplain: [
      'What a priority queue is, and why a binary heap implements it well.',
      'The shape and heap properties, and the parent/child index formulas.',
      'How HEAP-PUSH swims and HEAP-POP sinks, and why both are O(log n).',
      'Why Floyd\'s HEAPIFY is O(n).',
      'How heapsort sorts in place in O(n log n), and why it isn\'t stable.'
    ] }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
