;;;; Parenthesis — lisp/unit13.lisp
;;;; Canonical Lisp for Unit 13 (Splay trees), following the lecture.
;;;; BUILD-TREE (plain BST insertion, no splaying) is ours, to build examples.

(defstruct (node (:conc-name nil)
                 (:print-object
                  (lambda (node out)
                    (format out "[~a-~@[~a~]-~@[~a~]]"
                            (key node) (lc node) (rc node)))))
  key   ; the key
  lc    ; left child
  rc)   ; right child

(defun tree-rotate (node parent grandparent)
  (cond ; update structure of parent node
    ((eql node (lc parent)) (setf (lc parent) (rc node)
                                  (rc node) parent))
    ((eql node (rc parent)) (setf (rc parent) (lc node)
                                  (lc node) parent))
    (t (error "NODE (~A) is not the child of PARENT (~A)"
              node parent)))
  (cond ; update structure of grandparent node
    ((null grandparent) node)
    ((eql parent (lc grandparent)) (setf (lc grandparent) node))
    ((eql parent (rc grandparent)) (setf (rc grandparent) node))
    (t (error "PARENT (~A) is not the child of GRANDPARENT (~A)"
              parent grandparent))))

(defun node-chain (item root &optional chain)
  (if root
      (let ((key (key root))
            (lc (lc root))
            (rc (rc root))
            (chain (cons root chain)))
        (cond ((< item key) (node-chain item lc chain))
              ((> item key) (node-chain item rc chain))
              (t (values root chain))))
      (values nil chain)))

(defun splay (node chain)
  (loop for (parent grandparent) on chain do
    (tree-rotate node parent grandparent))
  node)

(defun st-search (item root)
  (multiple-value-bind (node chain)
      (node-chain item root)
    (when node
      (splay (car chain) (cdr chain)))))

(defun build-tree (keys)
  (let ((root nil))
    (dolist (k keys root)
      (labels ((ins (n) (cond ((null n) (make-node :key k))
                              ((< k (key n)) (setf (lc n) (ins (lc n))) n)
                              (t (setf (rc n) (ins (rc n))) n))))
        (setf root (ins root))))))
