# Product Review API - Brief Guide

## Overview

The review system uses a dedicated `product_reviews` collection.
A user can have only one active review per product (soft-delete friendly unique index).

## Who Can Use Which API

### Public APIs

- `getProductReviews(input)`
  - Anyone can call it (no login required).
  - Returns only reviews with `status = PUBLISHED`.

### Logged-in User APIs

- `createProductReview(input)`
- `updateProductReview(input)`
- `removeProductReview(reviewId)`
- `getMyProductReview(productId)`

Rules for `createProductReview`:

- User must be authenticated.
- User must be a verified buyer for that product.
- Verified buyer means there is a matching `order_items` row for:
  - `order_items.memberId == token.sub`
  - `order_items.productId == input.productId`
  - linked order status is eligible.

### Admin-only APIs

- `getReviewsByAdmin(input)`
- `updateReviewStatusByAdmin(input)`

## Review Status Flow

- `PENDING`: default when user creates a review.
- `PUBLISHED`: visible in public `getProductReviews`.
- `HIDDEN`: not visible publicly.
- `REJECTED`: not visible publicly.

## Visibility Rules

- Public review list (`getProductReviews`) includes only `PUBLISHED`.
- Owner can still fetch their own review via `getMyProductReview`, including `PENDING` or `REJECTED`.

## Update/Delete Behavior

- `updateProductReview` allowed only for owner and only if review is not `HIDDEN`/`REJECTED`.
- If a previously `PUBLISHED` review is edited, it is moved back to `PENDING`.
- `removeProductReview` is soft-delete and idempotent (`true` even if already removed/not found by owner).

## Product Rating Aggregates

Stored on `products`:

- `ratingAvg`
- `reviewsCount`

Recalculated from `PUBLISHED` reviews only when relevant review changes occur.

## Verified-buyer Status Configuration

By default, mode is `RELAXED` (unless env overrides it).

### Default RELAXED eligible statuses

- `PAID`
- `CONFIRMED`
- `PACKING`
- `SHIPPED`
- `DELIVERED`

### STRICT mode

- `DELIVERED` only

### Environment overrides

- `REVIEW_VERIFIED_ORDER_MODE=RELAXED|STRICT`
- `REVIEW_ELIGIBLE_ORDER_STATUSES=PAID,CONFIRMED,PACKING,SHIPPED,DELIVERED`
  - If provided and valid, this takes priority.

## Common Confusing Error

`Only verified buyers can review this product`

This means user auth passed, but verified-buyer check failed (usually no matching purchase or ineligible order status like `CANCELED`).
