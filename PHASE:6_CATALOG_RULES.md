# Phase 6 Catalog Rules (Read APIs)

This document defines source-of-truth rules for catalog read behavior in Phase 6.

## 1) Catalog visibility scope

- Public catalog endpoints must return only `PUBLISHED` products.
- Exclude archived/deleted products from all public list/detail/search responses.
- Catalog read APIs are read-only and must not mutate stock, likes, or views.

---

## 2) Sorting contract

Supported `sortBy` values:

- `NEWEST`
- `PRICE_ASC`
- `PRICE_DESC`
- `POPULAR`

### 2.1 `NEWEST`

- Sort by `createdAt DESC`.

### 2.2 `PRICE_ASC`

- Sort by effective display price ascending.
- Effective price rule: `salePrice` (if valid and lower than `price`) else `price`.

### 2.3 `PRICE_DESC`

- Sort by effective display price descending.
- Effective price rule same as above.

### 2.4 `POPULAR` (deterministic)

Use weighted score:

`score = (ordersCount * 5) + (likes * 2) + (views * 0.2)`

Tie-breakers (in order):

1. Higher `score`
2. Newer `createdAt`
3. Stable `_id` ordering

Notes:

- Compute score only from persisted product counters.
- Do not include draft/archive products.

---

## 3) Search suggestions contract

Endpoint intent: lightweight autocomplete for product discovery.

### 3.1 Input constraints

- Minimum keyword length: `2`
- Maximum `limit`: `8` (hard cap)
- Trim whitespace before query processing

### 3.2 Match strategy priority

Return results in this priority order:

1. Product title **prefix** match
2. Product title **contains** match
3. Brand **contains** match (fallback)

### 3.3 Dedupe and scope

- Dedupe by product `_id`.
- Return only `PUBLISHED` products.

### 3.4 Response shape (lightweight)

Each suggestion should contain only:

- `_id`
- `title`
- `slug`
- `thumbnail`

---

## 4) Pagination and response consistency

For list-style catalog endpoints:

- Always return `list + metaCounter.total`.
- `page` is 1-based.
- `limit` should be capped by backend safety max (recommended: 50).

---

## 5) Price filtering rules

When filters include `minPrice`/`maxPrice`:

- Filter using effective display price (`salePrice` if valid, else `price`).
- If `minPrice > maxPrice`, return validation error.
- Price filter applies after visibility scope (`PUBLISHED` only).

---

## 6) Product detail read rules

`getProductById` (public behavior):

- Return product only when it is `PUBLISHED`.
- Include engagement flags (`meLiked`, `meViewed`) for authenticated users.
- For guest users, return `meLiked=false` and `meViewed=false`.

---

## 7) Cache/read policy guidance

Frontend Apollo recommendations:

- Catalog list and featured/related reads: `cache-first`
- Product detail read: `cache-first` with explicit refresh on navigation when needed
- Any auth-sensitive catalog overlays can use `network-only` when required

---

## 8) MVP defaults

- Default list sort: `NEWEST`
- Default search suggestion limit: `6` (while still enforcing max `8`)
- Currency/price formatting remains frontend concern; backend returns numeric values

---

## 9) Future-safe notes

These can be extended in later phases without breaking contract:

- Time-windowed popularity (e.g., last 30 days)
- Personalized ranking
- Multi-language suggestion tokens
- Shop-level and category-level suggestion blending
