# Frontend Backend Integration Handoff

This document contains the backend connection details frontend asked for.

## Base URLs

- Base HTTP API URL for browser clients: `http://localhost:4001`
- Internal API URL for frontend SSR container-to-container calls: `http://kiwi:3007`
- GraphQL endpoint path: `/graphql`
- Browser GraphQL endpoint: `http://localhost:4001/graphql`
- Internal SSR GraphQL endpoint: `http://kiwi:3007/graphql`

## GraphQL Host Model

- GraphQL is served by the backend service directly.
- It is currently a separate backend host/port, not same-origin behind a reverse proxy.
- There is no reverse proxy configured in the current Docker topology.

## WebSocket / Chat

- WebSocket is enabled in production.
- External WebSocket endpoint: `ws://localhost:4001`
- Internal container-to-container WebSocket endpoint: `ws://kiwi:3007`
- No custom path is configured for the socket server.
- Chat is raw WebSocket, not GraphQL subscriptions.
- Auth for WebSocket connections is passed as a query parameter:

```txt
ws://localhost:4001/?token=<jwt>
```

## Auth Behavior

- Backend auth is token-based, not cookie-based.
- Login/signup returns `accessToken` in the GraphQL response body.
- Frontend must send the token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

## Cookie / Session Settings

- Cookie domain: not implemented
- SameSite: not implemented
- Secure: not implemented
- `Set-Cookie`: not used by this backend

If frontend is expecting cookie auth, that does not match the current backend implementation.

## CORS

- allow-origin: `true`
- allow-credentials: `true`

This means the backend dynamically allows origins and permits credentialed requests.

## File / Media URL Format

- Static uploads are served from `/uploads`
- Browser uploads base URL: `http://localhost:4001/uploads`
- Internal SSR uploads base URL: `http://kiwi:3007/uploads`
- Upload mutations return absolute URLs, not relative paths

URL resolution order on backend:

1. `APP_URL` env var if set
2. request host/protocol
3. fallback to `http://localhost:3007`

## Important Media URL Note

Current Docker compose now sets `APP_URL` for the `kiwi` service.

Configured value:

```env
APP_URL=http://localhost:4001
```

This means generated upload and media URLs should resolve correctly for browser clients using the public backend host and port.

## Final Docker Network Topology

- frontend service name: not defined in this backend compose file
- backend service name: `kiwi`
- batch service name: `kiwi-batch`
- reverse proxy: none
- Docker network: `monorepo-network`

Exposed host ports:

- `4001 -> 3007` backend
- `4002 -> 3008` batch

## Frontend Env Values To Use

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4001/graphql
NEXT_PUBLIC_UPLOADS_BASE_URL=http://localhost:4001/uploads
NEXT_PUBLIC_CHAT_WS_URL=ws://localhost:4001

API_INTERNAL_BASE_URL=http://kiwi:3007
GRAPHQL_INTERNAL_URL=http://kiwi:3007/graphql
UPLOADS_INTERNAL_BASE_URL=http://kiwi:3007/uploads
CHAT_WS_INTERNAL_URL=ws://kiwi:3007
```

Notes:

- Use the internal `kiwi` host only if the frontend SSR/runtime is inside Docker on the same network.
- If frontend is running outside Docker, use the public localhost URLs only.

## Short Summary For Frontend

- Public API base: `http://localhost:4001`
- Public GraphQL: `http://localhost:4001/graphql`
- Public uploads: `http://localhost:4001/uploads`
- Public chat socket: `ws://localhost:4001`
- Auth style: Bearer token
- Cookies: not used
- Reverse proxy: none
- Internal Docker host for SSR: `http://kiwi:3007`
