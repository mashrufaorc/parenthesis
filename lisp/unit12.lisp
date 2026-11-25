;;;; Parenthesis — lisp/unit12.lisp
;;;; Canonical Lisp for Unit 12 (Binary search trees), following the lecture.
;;;; BST-SEARCH, BST-HEIGHT and the Hibbard BST-DELETE are written in the
;;;; lecture's style (the slides describe them without code).

(defstruct (tree-node (:conc-name nil))
  key (lc nil) (rc nil))

(defun bst-insert (node item)
  (cond ((null node)
         (make-tree-node :key item))
        ((< item (key node))
         (setf (lc node)
               (bst-insert (lc node) item))
         node)
        (t  ; item > key
         (setf (rc node)
               (bst-insert (rc node) item))
         node)))

(defun build-bst (values)
  (let ((root nil))
    (dolist (v values)
      (setf root (bst-insert root v)))
    root))

(defun bt-in-order (node fn)
  (when node
    (bt-in-order (lc node) fn)
    (funcall fn (key node))
    (bt-in-order (rc node) fn)))

(defun bst-min (node)
  (cond ((null node) nil)
        ((null (lc node)) (key node))
        (t (bst-min (lc node)))))

(defun bst-max (node)
  (cond ((null node) nil)
        ((null (rc node)) (key node))
        (t (bst-max (rc node)))))

(defun bst-search (node item)
  (cond ((null node) nil)
        ((= item (key node)) node)
        ((< item (key node)) (bst-search (lc node) item))
        (t (bst-search (rc node) item))))

(defun bst-height (node)
  (if (null node) -1
      (1+ (max (bst-height (lc node)) (bst-height (rc node))))))

(defun bst-min-node (node)
  (if (null (lc node)) node (bst-min-node (lc node))))

(defun bst-delete-min (node)            ; the subtree without its minimum
  (if (null (lc node)) (rc node)
      (progn (setf (lc node) (bst-delete-min (lc node))) node)))

(defun bst-delete (node item)
  "Hibbard deletion. Returns the root, so always (setf root (bst-delete root k))"
  (cond ((null node) nil)
        ((< item (key node)) (setf (lc node) (bst-delete (lc node) item)) node)
        ((> item (key node)) (setf (rc node) (bst-delete (rc node) item)) node)
        ((null (lc node)) (rc node))     ; 0 or 1 child: replace with the child
        ((null (rc node)) (lc node))
        (t (let ((succ (bst-min-node (rc node))))   ; 2 children: the successor
             (setf (rc succ) (bst-delete-min (rc node))   ; moves in, by references
                   (lc succ) (lc node))
             succ))))
