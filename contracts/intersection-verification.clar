;; Intersection Verification Contract
;; Validates traffic control points in the urban network

(define-data-var admin principal tx-sender)

;; Map of verified intersections
(define-map verified-intersections
  { intersection-id: (string-ascii 32) }
  {
    latitude: int,
    longitude: int,
    is-active: bool,
    last-verified: uint
  }
)

;; Register a new intersection
(define-public (register-intersection (intersection-id (string-ascii 32)) (latitude int) (longitude int))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set verified-intersections
      { intersection-id: intersection-id }
      {
        latitude: latitude,
        longitude: longitude,
        is-active: true,
        last-verified: block-height
      }
    ))
  )
)

;; Check if an intersection is verified
(define-read-only (is-intersection-verified (intersection-id (string-ascii 32)))
  (is-some (map-get? verified-intersections { intersection-id: intersection-id }))
)

;; Update intersection status
(define-public (update-intersection-status (intersection-id (string-ascii 32)) (is-active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (match (map-get? verified-intersections { intersection-id: intersection-id })
      intersection (ok (map-set verified-intersections
        { intersection-id: intersection-id }
        (merge intersection { is-active: is-active, last-verified: block-height })
      ))
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
