# Product Section APIs (Frontend Handoff)

This document covers the 4 storefront/admin APIs used for product sections:

- getFeaturedProducts
- getPopularProducts
- getTrendingProducts
- getFeaturedProductsByAdmin

## Base Setup

- Method: POST
- URL: {{BASE_URL}}/graphql
- Header: Content-Type: application/json
- Admin APIs only: Authorization: Bearer {{ADMIN_TOKEN}}

## 1) getFeaturedProducts

Purpose:

- Curated storefront section.
- Returns only products explicitly marked as featured by admin.

Access:

- Public

GraphQL signature:

- Query: getFeaturedProducts(input: FeaturedProductsInquiry!): [ProductCard!]!

Input fields (FeaturedProductsInquiry):

- limit: Int (min 1, max 50, default 8)

Selection logic:

- status = PUBLISHED
- deletedAt = null
- isFeatured = true
- sort: featuredRank asc (null last), featuredAt desc, createdAt desc

Output fields (ProductCard):

- \_id
- title
- slug
- thumbnail
- price
- salePrice
- stockQty
- status
- likes
- views
- ratingAvg
- reviewsCount
- createdAt

Postman payload:

```json
{
  "operationName": "GetFeaturedProducts",
  "query": "query GetFeaturedProducts($input: FeaturedProductsInquiry!) { getFeaturedProducts(input: $input) { _id title slug thumbnail price salePrice stockQty status likes views ratingAvg reviewsCount createdAt } }",
  "variables": {
    "input": {
      "limit": 8
    }
  }
}
```

---

## 2) getPopularProducts

Purpose:

- Algorithmic all-time popularity section.

Access:

- Public

GraphQL signature:

- Query: getPopularProducts(input: PopularProductsInquiry!): [ProductCard!]!

Input fields (PopularProductsInquiry):

- limit: Int (min 1, max 50, default 8)

Ranking formula:

- popularityScore = (ordersCount _ 5) + (likes _ 2) + (views \* 0.2)
- sort: popularityScore desc, createdAt desc

Output fields (ProductCard):

- \_id
- title
- slug
- thumbnail
- price
- salePrice
- stockQty
- status
- likes
- views
- ratingAvg
- reviewsCount
- createdAt

Postman payload:

```json
{
  "operationName": "GetPopularProducts",
  "query": "query GetPopularProducts($input: PopularProductsInquiry!) { getPopularProducts(input: $input) { _id title slug thumbnail price salePrice stockQty status likes views ratingAvg reviewsCount createdAt } }",
  "variables": {
    "input": {
      "limit": 8
    }
  }
}
```

---

## 3) getTrendingProducts

Purpose:

- Algorithmic recent-momentum section using time-windowed activity.

Access:

- Public

GraphQL signature:

- Query: getTrendingProducts(input: TrendingProductsInquiry!): [ProductCard!]!

Input fields (TrendingProductsInquiry):

- limit: Int (min 1, max 50, default 8)
- windowDays: Int (min 1, max 30, default 7)

Ranking formula (within window):

- trendingScore = (orders _ 8) + (likes _ 3) + (views \* 0.5)
- views source: View collection, viewGroup = PRODUCT
- likes source: Like collection, likeGroup = PRODUCT
- orders source: OrderItem quantity sum excluding CANCELED/REFUNDED
- tie-breaker: createdAt desc

Output fields (ProductCard):

- \_id
- title
- slug
- thumbnail
- price
- salePrice
- stockQty
- status
- likes
- views
- ratingAvg
- reviewsCount
- createdAt

Postman payload:

```json
{
  "operationName": "GetTrendingProducts",
  "query": "query GetTrendingProducts($input: TrendingProductsInquiry!) { getTrendingProducts(input: $input) { _id title slug thumbnail price salePrice stockQty status likes views ratingAvg reviewsCount createdAt } }",
  "variables": {
    "input": {
      "limit": 8,
      "windowDays": 7
    }
  }
}
```

---

## 4) getFeaturedProductsByAdmin

Purpose:

- Admin management list for curated featured products.
- Useful for admin panel ordering/review and QA.

Access:

- ADMIN only (JWT required)

GraphQL signature:

- Query: getFeaturedProductsByAdmin(input?: AdminProductsInquiry): MyProductsResponse!

Input fields (AdminProductsInquiry):

- page: Int (required)
- limit: Int (required)
- status: ProductStatus (optional)
- search: String (optional)
- memberId: String (optional, MongoId)

Filtering/sorting:

- includes only isFeatured = true
- deletedAt = null
- sort: featuredRank asc, featuredAt desc, createdAt desc

Output fields:

- list: ProductResponse[]
- metaCounter.total: Int

Important ProductResponse fields for admin UI:

- \_id
- title
- status
- isFeatured
- featuredRank
- featuredAt
- price
- salePrice
- stockQty
- createdAt
- updatedAt

Postman payload:

```json
{
  "operationName": "GetFeaturedProductsByAdmin",
  "query": "query GetFeaturedProductsByAdmin($input: AdminProductsInquiry) { getFeaturedProductsByAdmin(input: $input) { list { _id title slug status isFeatured featuredRank featuredAt price salePrice stockQty createdAt updatedAt } metaCounter { total } } }",
  "variables": {
    "input": {
      "page": 1,
      "limit": 20,
      "status": "PUBLISHED",
      "search": "",
      "memberId": null
    }
  }
}
```

---

## 5) setProductFeaturedByAdmin

Purpose:

- Admin curation mutation to feature/unfeature a product.
- Supports explicit rank ordering for storefront featured section.

Access:

- ADMIN only (JWT required)

GraphQL signature:

- Mutation: setProductFeaturedByAdmin(input: SetProductFeaturedByAdminInput!): ProductResponse!

Input fields (SetProductFeaturedByAdminInput):

- productId: String (required, MongoId)
- isFeatured: Boolean (required)
- featuredRank: Int (optional, min 1)

Behavior:

- If isFeatured = true:
  - isFeatured becomes true
  - featuredAt is updated to now
  - featuredRank is updated only when provided
- If isFeatured = false:
  - isFeatured becomes false
  - featuredRank is cleared (null)
  - featuredAt is cleared (null)

Important output fields (ProductResponse):

- \_id
- title
- status
- isFeatured
- featuredRank
- featuredAt
- updatedAt

Postman payload (feature + set rank):

```json
{
  "operationName": "SetProductFeaturedByAdmin",
  "query": "mutation SetProductFeaturedByAdmin($input: SetProductFeaturedByAdminInput!) { setProductFeaturedByAdmin(input: $input) { _id title status isFeatured featuredRank featuredAt updatedAt } }",
  "variables": {
    "input": {
      "productId": "PUT_PRODUCT_ID_HERE",
      "isFeatured": true,
      "featuredRank": 1
    }
  }
}
```

Postman payload (remove from featured):

```json
{
  "operationName": "SetProductFeaturedByAdmin",
  "query": "mutation SetProductFeaturedByAdmin($input: SetProductFeaturedByAdminInput!) { setProductFeaturedByAdmin(input: $input) { _id title status isFeatured featuredRank featuredAt updatedAt } }",
  "variables": {
    "input": {
      "productId": "PUT_PRODUCT_ID_HERE",
      "isFeatured": false
    }
  }
}
```

---

## Notes For Frontend

- getFeaturedProducts is curated and should power the Hero/Featured section.
- getPopularProducts and getTrendingProducts are algorithmic and can power separate rails.
- For admin panel ordering, use featuredRank (smaller rank appears first).
- If multiple featured products have no rank, they are ordered by featuredAt (newly featured first).
