# Image Uploader Handoff (Frontend Guide)

This document explains how image uploading works in the backend and how frontend should integrate it safely.

## 1) Backend endpoints and behavior

### GraphQL mutations

```graphql
mutation ($file: Upload!, $target: String!) {
  imageUploader(file: $file, target: $target)
}
```

```graphql
mutation ($files: [Upload!]!, $target: String!) {
  imagesUploader(files: $files, target: $target)
}
```

### What they return

- `imageUploader` returns one string path
- `imagesUploader` returns array of string paths

Examples:

```json
{
  "data": {
    "imageUploader": "/uploads/product/1772562767892-8d4d3b0f-f92a-4ef1-b18b-000285dbe4a8.png"
  }
}
```

```json
{
  "data": {
    "imagesUploader": [
      "/uploads/product/1772563196286-06c2aef4-622d-4ebc-9e64-627b8305a9c0.jpg",
      "/uploads/product/1772563196287-4ed0f0e7-92ac-44dd-8cbe-da024af4e149.jpg"
    ]
  }
}
```

## 2) Authentication requirements

Both upload mutations are protected by `AuthGuard`.

Required header:

```text
Authorization: Bearer <JWT_TOKEN>
```

If token is missing/invalid, upload will fail.

## 3) Storage model

- Files are stored on server filesystem under `uploads/<target>/...`
- DB stores only path strings (not binary)
- File is accessible through static route:
  - `http://<api-host>/uploads/...`

Example final URL:

```text
http://localhost:3007/uploads/product/1772562767892-8d4d3b0f-f92a-4ef1-b18b-000285dbe4a8.png
```

## 4) Allowed targets

Backend whitelist:

- `member`
- `product`
- `vendor`
- `category`
- `general`

Any other target is rejected.

## 5) Allowed file types

Allowed MIME types:

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

## 6) Upload middleware limits

Configured globally:

- max file size: `15 MB` per file
- max files per request: `10`

## 7) Postman multipart requirement (important)

Apollo CSRF protection requires this header for multipart requests:

```text
apollo-require-preflight: true
```

Do not manually set `Content-Type` for multipart; let Postman/browser set boundary.

## 8) Postman examples

### Single upload (form-data)

- `operations` (text)

```json
{
  "query": "mutation($file: Upload!, $target: String!){ imageUploader(file:$file, target:$target) }",
  "variables": {
    "file": null,
    "target": "product"
  }
}
```

- `map` (text)

```json
{ "0": ["variables.file"] }
```

- `0` (file)

### Multi upload (3 files)

- `operations` (text)

```json
{
  "query": "mutation($files:[Upload!]!, $target:String!){ imagesUploader(files:$files, target:$target) }",
  "variables": {
    "files": [null, null, null],
    "target": "product"
  }
}
```

- `map` (text)

```json
{
  "0": ["variables.files.0"],
  "1": ["variables.files.1"],
  "2": ["variables.files.2"]
}
```

- `0`, `1`, `2` (file)

## 9) Frontend integration patterns

### Recommended flow

1. User selects file(s)
2. Frontend uploads file(s) using upload mutation
3. Backend returns path string(s)
4. Frontend sends those strings in business mutation (`thumbnail`, `images`, `memberAvatar`, etc.)
5. Frontend renders with `API_BASE_URL + returnedPath`

---

## 10) Axios (manual multipart GraphQL) example

```ts
import axios from 'axios';

const API_URL = 'http://localhost:3007/graphql';

export async function uploadSingleImageWithAxios(file: File, token: string) {
  const form = new FormData();

  form.append(
    'operations',
    JSON.stringify({
      query:
        'mutation($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }',
      variables: { file: null, target: 'product' },
    }),
  );

  form.append('map', JSON.stringify({ '0': ['variables.file'] }));
  form.append('0', file);

  const response = await axios.post(API_URL, form, {
    headers: {
      Authorization: `Bearer ${token}`,
      'apollo-require-preflight': 'true',
    },
  });

  return response.data?.data?.imageUploader as string;
}

export async function uploadMultiImageWithAxios(files: File[], token: string) {
  const form = new FormData();

  const fileVars = files.map(() => null);
  form.append(
    'operations',
    JSON.stringify({
      query:
        'mutation($files: [Upload!]!, $target: String!) { imagesUploader(files: $files, target: $target) }',
      variables: { files: fileVars, target: 'product' },
    }),
  );

  const map: Record<string, string[]> = {};
  files.forEach((_, idx) => {
    map[String(idx)] = [`variables.files.${idx}`];
  });
  form.append('map', JSON.stringify(map));

  files.forEach((file, idx) => {
    form.append(String(idx), file);
  });

  const response = await axios.post(API_URL, form, {
    headers: {
      Authorization: `Bearer ${token}`,
      'apollo-require-preflight': 'true',
    },
  });

  return (response.data?.data?.imagesUploader ?? []) as string[];
}
```

---

## 11) Apollo Client (UploadLink) example

> This is cleaner than manual multipart if project uses Apollo.

```ts
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';

const uploadLink = createUploadLink({
  uri: 'http://localhost:3007/graphql',
  headers: {
    'apollo-require-preflight': 'true',
  },
});

export const apolloClient = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});
```

```ts
import { gql } from '@apollo/client';
import { apolloClient } from './apolloClient';

const IMAGE_UPLOADER = gql`
  mutation ImageUploader($file: Upload!, $target: String!) {
    imageUploader(file: $file, target: $target)
  }
`;

const IMAGES_UPLOADER = gql`
  mutation ImagesUploader($files: [Upload!]!, $target: String!) {
    imagesUploader(files: $files, target: $target)
  }
`;

export async function uploadSingleWithApollo(file: File, token: string) {
  const { data } = await apolloClient.mutate({
    mutation: IMAGE_UPLOADER,
    variables: { file, target: 'product' },
    context: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  return data?.imageUploader as string;
}

export async function uploadMultiWithApollo(files: File[], token: string) {
  const { data } = await apolloClient.mutate({
    mutation: IMAGES_UPLOADER,
    variables: { files, target: 'product' },
    context: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  return (data?.imagesUploader ?? []) as string[];
}
```

---

## 12) Error cases frontend should handle

- Invalid token / missing token
- Invalid target value
- Unsupported file MIME type
- File too large
- Too many files in one request
- Network interruption during upload

## 13) Rendering helper

```ts
export function toPublicImageUrl(path: string, apiBaseUrl: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${apiBaseUrl}${path}`;
}
```

## 14) Production note

For production deployment, `uploads/` should be backed by persistent storage (volume/object storage). Otherwise files may be lost on redeploy/restart.
