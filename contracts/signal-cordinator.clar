;; Signal Coordination Contract
;; Optimizes traffic light timing based on current conditions

(define-data-var admin principal tx-sender)

;; Map to store signal timing data
(define-map signal-timing
  { intersection-id: (string-ascii 32) }
  {
    green-duration-ns: uint,
    green-duration-ew: uint,
    yellow-duration: uint,
    cycle-length: uint,
    last-updated: uint
  }
)

;; Update signal timing for an intersection
(define-public (update-signal-timing
    (intersection-id (string-ascii 32))
    (green-duration-ns uint)
    (green-duration-ew uint)
    (yellow-duration uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set signal-timing
      { intersection-id: intersection-id }
      {
        green-duration-ns: green-duration-ns,
        green-duration-ew: green-duration-ew,
        yellow-duration: yellow-duration,
        cycle-length: (+ (+ green-duration-ns green-duration-ew) (* yellow-duration u2)),
        last-updated: block-height
      }
    ))
  )
)

;; Get current signal timing for an intersection
(define-read-only (get-signal-timing (intersection-id (string-ascii 32)))
  (map-get? signal-timing { intersection-id: intersection-id })
)

;; Optimize signal timing based on congestion level
;; This is a simplified version - in a real implementation, we would use more complex algorithms
(define-public (optimize-signal-timing (intersection-id (string-ascii 32)) (congestion-level-ns uint) (congestion-level-ew uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (match (map-get? signal-timing { intersection-id: intersection-id })
      timing
        (let
          (
            (new-green-ns (if (> congestion-level-ns congestion-level-ew)
                            (+ (get green-duration-ns timing) u5)
                            (get green-duration-ns timing)))
            (new-green-ew (if (> congestion-level-ew congestion-level-ns)
                            (+ (get green-duration-ew timing) u5)
                            (get green-duration-ew timing)))
          )
          (ok (map-set signal-timing
            { intersection-id: intersection-id }
            {
              green-duration-ns: new-green-ns,
              green-duration-ew: new-green-ew,
              yellow-duration: (get yellow-duration timing),
              cycle-length: (+ (+ new-green-ns new-green-ew) (* (get yellow-duration timing) u2)),
              last-updated: block-height
            }
          ))
        )
      (err u101)
    )
  )
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (var-set admin new-admin))
  )
)
