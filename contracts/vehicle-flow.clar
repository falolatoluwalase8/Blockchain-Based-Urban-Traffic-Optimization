;; Vehicle Flow Contract
;; Records traffic patterns across the urban network

(define-data-var admin principal tx-sender)

;; Map to store traffic flow data
(define-map traffic-flow-data
  {
    intersection-id: (string-ascii 32),
    timestamp: uint
  }
  {
    vehicle-count: uint,
    average-speed: uint,
    congestion-level: uint
  }
)

;; Record traffic flow data
(define-public (record-traffic-flow
    (intersection-id (string-ascii 32))
    (vehicle-count uint)
    (average-speed uint)
    (congestion-level uint))
  (begin
    ;; Only authorized data providers can record
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set traffic-flow-data
      {
        intersection-id: intersection-id,
        timestamp: block-height
      }
      {
        vehicle-count: vehicle-count,
        average-speed: average-speed,
        congestion-level: congestion-level
      }
    ))
  )
)

;; Get traffic flow data for a specific intersection and time
(define-read-only (get-traffic-flow (intersection-id (string-ascii 32)) (timestamp uint))
  (map-get? traffic-flow-data { intersection-id: intersection-id, timestamp: timestamp })
)

;; Calculate average congestion level for an intersection over last n blocks
;; This is a simplified version - in a real implementation, we would need to iterate over multiple entries
(define-read-only (get-average-congestion (intersection-id (string-ascii 32)))
  (match (map-get? traffic-flow-data { intersection-id: intersection-id, timestamp: block-height })
    data (ok (get congestion-level data))
    (err u101)
  )
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (var-set admin new-admin))
  )
)
