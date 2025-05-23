;; Performance Analytics Contract
;; Tracks system improvements and overall traffic metrics

(define-data-var admin principal tx-sender)

;; Map to store performance metrics
(define-map performance-metrics
  {
    region-id: (string-ascii 32),
    timestamp: uint
  }
  {
    average-travel-time: uint,
    average-wait-time: uint,
    fuel-savings-estimate: uint,
    emissions-reduction-estimate: uint,
    system-efficiency: uint
  }
)

;; Record performance metrics
(define-public (record-metrics
    (region-id (string-ascii 32))
    (average-travel-time uint)
    (average-wait-time uint)
    (fuel-savings-estimate uint)
    (emissions-reduction-estimate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (let
      (
        (efficiency (calculate-efficiency average-travel-time average-wait-time))
      )
      (ok (map-set performance-metrics
        {
          region-id: region-id,
          timestamp: block-height
        }
        {
          average-travel-time: average-travel-time,
          average-wait-time: average-wait-time,
          fuel-savings-estimate: fuel-savings-estimate,
          emissions-reduction-estimate: emissions-reduction-estimate,
          system-efficiency: efficiency
        }
      ))
    )
  )
)

;; Calculate system efficiency (simplified)
(define-private (calculate-efficiency (travel-time uint) (wait-time uint))
  (if (and (> travel-time u0) (> wait-time u0))
    (/ (* u100 wait-time) (+ travel-time wait-time))
    u0
  )
)

;; Get performance metrics
(define-read-only (get-metrics (region-id (string-ascii 32)) (timestamp uint))
  (map-get? performance-metrics { region-id: region-id, timestamp: timestamp })
)

;; Get latest performance metrics
(define-read-only (get-latest-metrics (region-id (string-ascii 32)))
  (map-get? performance-metrics { region-id: region-id, timestamp: block-height })
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (var-set admin new-admin))
  )
)
