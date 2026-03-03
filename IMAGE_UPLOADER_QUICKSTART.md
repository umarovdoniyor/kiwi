# Image Uploader Quickstart (Frontend)

Use this for day-to-day integration.

## Endpoint

- POST `http://localhost:3007/graphql`

## Auth (required)

- Header: `Authorization: Bearer <JWT_TOKEN>`

## Important Apollo multipart header

- Header: `apollo-require-preflight: true`

## Single upload mutation

```graphql
mutation ($file: Upload!, $target: String!) {
  imageUploader(file: $file, target: $target)
}
```

Returns:

```json
{
  "data": {
    "imageUploader": "/uploads/product/....jpg"
  }
}
```

## Multi upload mutation

```graphql
mutation ($files: [Upload!]!, $target: String!) {
  imagesUploader(files: $files, target: $target)
}
```

Returns:

```json
{
  "data": {
    "imagesUploader": ["/uploads/product/....jpg", "/uploads/product/....png"]
  }
}
```

## Allowed targets

- `member`
- `product`
- `vendor`
- `category`
- `general`

## Allowed file types

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

## Limits

- Max file size: `15 MB`
- Max files per request: `10`

## Postman multipart format

### Single

- `operations`:

```json
{
  "query": "mutation($file: Upload!, $target: String!){ imageUploader(file:$file, target:$target) }",
  "variables": { "file": null, "target": "product" }
}
```

- `map`:

```json
{ "0": ["variables.file"] }
```

- File key: `0`

### Multi (example 2 files)

- `operations`:

```json
{
  "query": "mutation($files:[Upload!]!, $target:String!){ imagesUploader(files:$files, target:$target) }",
  "variables": { "files": [null, null], "target": "product" }
}
```

- `map`:

```json
{
  "0": ["variables.files.0"],
  "1": ["variables.files.1"]
}
```

- File keys: `0`, `1`

## Save to DB pattern

1. Upload image(s)
2. Receive returned path string(s)
3. Send path(s) in business mutation fields (`thumbnail`, `images`, `memberAvatar`)

## Render pattern

`finalUrl = API_BASE_URL + returnedPath`

Example:

`http://localhost:3007` + `/uploads/product/abc.jpg`
