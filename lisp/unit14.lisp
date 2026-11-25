;;;; Parenthesis — lisp/unit14.lisp
;;;; Canonical Lisp for Unit 14 (Heaps and heapsort), following the lecture.

; returns the index of the PARENT of the node at index i
(defun hparent (i) (floor (- i 1) 2))
; returns the index of the RIGHT child of the node at index i
(defun hrt (i) (* (+ i 1) 2))
; returns the index of the LEFT child of the node at index i
(defun hlt (i) (- (hrt i) 1))

(defun heap-up (vec i comp)
  (when (and (> i 0) (funcall comp (aref vec i) (aref vec (hparent i))))
    (rotatef (aref vec i) (aref vec (hparent i)))  ; swap child and parent
    (heap-up vec (hparent i) comp))                ; moves item further up
  vec)

(defun heap-push (node vec comp)
  "Note: comp should be #'< for min heap or #'> for max heap"
  ; inserts item at fillpoint position (end of the array)
  (vector-push-extend node vec)
  (heap-up vec (1- (length vec)) comp))

(defun heap-down (vec beg comp &optional (end (length vec)))
  (labels ((hrt (i) (* (+ i 1) 2))   ;; local function
           (hlt (i) (- (hrt i) 1)))  ;; local function
    (let ((l (hlt beg))   ;; left child index, could be OOB
          (r (hrt beg)))  ;; right child index, could be OOB
      (when (< l end)     ;; ensure left child not OOB
        (let ((child (if (or (>= r end)   ;; ensure right child not OOB
                             (funcall comp (aref vec l) (aref vec r)))
                         l    ;; left is bigger
                         r))) ;; right is bigger
          (when (funcall comp (aref vec child) (aref vec beg))
            (rotatef (aref vec beg) (aref vec child))
            (heap-down vec child comp end)))))))

(defun heap-pop (vec comp)
  (rotatef (aref vec 0) (aref vec (- (length vec) 1)))
  ;; Unlike PROGN, which returns the result of the last form,
  ;; PROG1 returns the result of the first
  (prog1 (vector-pop vec)
    (heap-down vec 0 comp)))

(defun heapify (vec comp)
  (let ((mid (floor (length vec) 2)))
    (dotimes (i mid)
      (heap-down vec (- mid i 1) comp))))

(defun heapsort (vec comp)
  (heapify vec comp)
  (dotimes (i (- (length vec) 1))
    (let ((last (- (length vec) i 1)))
      (rotatef (aref vec 0)
               (aref vec last))
      (heap-down vec 0 comp last)))
  vec)

(defun heapsort-ascending (vec)
  (heapsort vec #'>))

(defun heapsort-descending (vec)
  (heapsort vec #'<))
