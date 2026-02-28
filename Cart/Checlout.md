# Phase 5 Business Rules (Cart + Checkout)

This document defines the source-of-truth business rules for Phase 5 implementation.

## 1) Pricing precedence and calculation

### 1.1 Applied unit price

- `appliedPrice = salePrice ?? price`
- If `salePrice` is present but invalid (e.g., greater than `price`), backend should fallback to `price`.

### 1.2 Line total

- `lineTotal = appliedPrice * quantity`

### 1.3 Cart subtotal

- `subtotal = sum(lineTotal of all ACTIVE cart items)`

### 1.4 Discount

- `discountAmount = total discount from coupons/promotions`
- If no discount system is active, `discountAmount = 0`.

### 1.5 Tax

- `taxBase = max(subtotal - discountAmount, 0)`
- `taxAmount = round(taxBase * taxRate, 2)`

### 1.6 Delivery fee

- MVP default: configurable flat fee.
- Optional threshold rule (if enabled): free delivery above configured subtotal.

### 1.7 Final total

- `totalAmount = round(subtotal - discountAmount + deliveryFee + taxAmount, 2)`
- Persist and return all monetary fields with 2-decimal precision.

---

## 2) Stock and product validity checks

Validation must run at:

- `addToCart`
- `updateCartItemQty`
- `validateCartForCheckout`
- `createOrderFromCart` (authoritative final check)

For each cart item, product must satisfy:

- `status = PUBLISHED`
- Not archived/deleted
- `quantity >= minOrderQty`
- `stockQty >= quantity`

On failed checkout validation:

- Return structured issues.
- Do not create order.
- Do not decrement stock.

---

## 3) Formula execution order (must be deterministic)

1. Resolve `appliedPrice` for each item
2. Compute `lineTotal`
3. Compute `subtotal`
4. Apply `discountAmount`
5. Compute `taxAmount` on discounted base
6. Apply `deliveryFee`
7. Compute `totalAmount`

Backend is the single source of truth for all totals.

---

## 4) Checkout and order creation behavior

`createOrderFromCart` must run in a transaction:

1. Re-validate all cart items and prices
2. Create `Order`
3. Create `OrderItem` snapshots (title/sku/unit/thumbnail/prices)
4. Decrement product stock
5. Clear cart (or mark cart items removed)

If any step fails, rollback entire transaction.

---

## 5) Cancel transition rules

### 5.1 Allowed transitions

Order can be canceled only when status is one of:

- `PENDING_PAYMENT`
- `PAID`
- `CONFIRMED`

### 5.2 Disallowed transitions

Cancellation is not allowed when status is:

- `PACKING`
- `SHIPPED`
- `DELIVERED`
- `CANCELED`
- `REFUNDED`

### 5.3 Cancel side-effects

On successful cancellation:

- Set `status = CANCELED`
- Set `canceledAt`
- Restore stock for each order item quantity
- If payment already captured, start refund workflow
  - Set `paymentStatus = REFUNDED` only after refund is confirmed

---

## 6) Order number format

### 6.1 Format

- `GS-YYYYMMDD-XXXXXX`
- Example: `GS-20260228-004271`

### 6.2 Sequence

- `XXXXXX` is daily sequence, left-padded with zeros.

### 6.3 Constraints

- Must be unique (DB unique index required)
- Immutable after order creation

---

## 7) Idempotency and concurrency safeguards

- Re-check stock and price inside transaction right before commit.
- Use atomic stock decrement (`stockQty >= requestedQty`) to prevent oversell.
- Protect order creation endpoint from double-submit (idempotency key recommended for payment paths).

---

## 8) API behavior consistency notes

- All write APIs must return recalculated, server-authoritative totals.
- Frontend must not compute final payable amount as source of truth.
- Any cart item no longer valid should be reflected in `validateCartForCheckout.issues`.

---

## 9) MVP defaults (recommended)

- Currency: `USD`
- `discountAmount = 0` unless coupon/promo is active
- Flat `deliveryFee` from config
- Single tax rate from config

These defaults can be replaced by region/vendor rules in later phases.
