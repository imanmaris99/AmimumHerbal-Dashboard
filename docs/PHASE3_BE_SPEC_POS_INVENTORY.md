# Phase 3 — Backend API Spec (POS + Inventory)

Dokumen ini menjadi kontrak awal backend agar modul Dashboard POS & Inventory bisa masuk write-flow production dengan aman.

## 1) POS Checkout

### Endpoint
`POST /admin/pos/checkout`

### Tujuan
- Membuat transaksi kasir internal.
- Mengurangi stok variant secara atomik.
- Menulis movement log otomatis (`out/sale`).

### Request (JSON)
```json
{
  "cashier_id": "admin-uuid",
  "payment_method": "cash|transfer|qris",
  "notes": "optional",
  "items": [
    {
      "variant_id": 101,
      "qty": 2,
      "unit_price": 25000,
      "discount": 1000
    }
  ]
}
```

### Response 200
```json
{
  "status_code": 200,
  "message": "POS checkout success",
  "data": {
    "transaction_id": "POS-20260426-0001",
    "subtotal": 50000,
    "discount_total": 2000,
    "grand_total": 48000,
    "created_at": "2026-04-26T06:00:00Z"
  }
}
```

### Error Rules
- `400`: payload invalid
- `409`: stok tidak cukup
- `401/403`: unauthorized/role mismatch

---

## 2) Inventory Movement Log

### Endpoint
`GET /admin/inventory/movements`

### Query Params
- `from` (ISO date)
- `to` (ISO date)
- `variant_id` (optional)
- `product_id` (optional)
- `movement_type` (`in|out|adjust|sale|return`)
- `page`, `limit`

### Response 200
```json
{
  "status_code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "mov-001",
        "variant_id": 101,
        "product_id": "prod-1",
        "movement_type": "sale",
        "delta": -2,
        "stock_before": 20,
        "stock_after": 18,
        "actor_id": "admin-uuid",
        "reason": "POS checkout",
        "created_at": "2026-04-26T06:00:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

## 3) Stock Adjust Manual

### Endpoint
`POST /admin/inventory/adjust`

### Request
```json
{
  "variant_id": 101,
  "delta": 5,
  "reason": "Restock gudang",
  "reference": "PO-2026-001"
}
```

### Behavior
- update stock variant
- insert movement record tipe `adjust`

---

## 4) Threshold Low-Stock

### Endpoint
`PUT /admin/inventory/threshold/{variant_id}`

### Request
```json
{
  "min_threshold": 10
}
```

### Tujuan
- dashboard bisa menilai status `safe/low/out` per variant berdasar konfigurasi backend, bukan hardcoded frontend.

---

## 5) DB Minimal (Saran)

### `pos_transactions`
- id (pk)
- transaction_code (unique)
- cashier_id
- payment_method
- subtotal
- discount_total
- grand_total
- notes
- created_at

### `pos_transaction_items`
- id (pk)
- transaction_id (fk)
- variant_id (fk)
- qty
- unit_price
- discount
- line_total

### `stock_movements`
- id (pk)
- variant_id (fk)
- product_id (fk)
- movement_type
- delta
- stock_before
- stock_after
- actor_id
- reason
- reference
- created_at

### `inventory_thresholds`
- variant_id (pk/fk)
- min_threshold
- updated_by
- updated_at

---

## 6) Acceptance Criteria (Phase 3 done)
- Checkout POS sukses mengurangi stok dan membuat movement log.
- Movement list bisa difilter date range + variant.
- Adjust manual tercatat lengkap dengan actor + reason.
- Threshold per variant bisa diubah dan terbaca dashboard.
- Semua endpoint write terproteksi role `admin|owner`.
