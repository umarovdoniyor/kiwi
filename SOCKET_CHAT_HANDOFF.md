# Socket Chat Frontend Handoff

This document explains how frontend should integrate with the backend WebSocket chat in both development and production.

## 1) Backend status

The backend side is already wired:

- Gateway implementation: [apps/kiwi/src/socket/socket.gateway.ts](apps/kiwi/src/socket/socket.gateway.ts)
- Gateway module: [apps/kiwi/src/socket/socket.module.ts](apps/kiwi/src/socket/socket.module.ts)
- App registration: [apps/kiwi/src/app.module.ts](apps/kiwi/src/app.module.ts)
- WebSocket adapter setup: [apps/kiwi/src/main.ts](apps/kiwi/src/main.ts)
- JWT payload type used in socket memberData: [apps/kiwi/src/libs/types/common.ts](apps/kiwi/src/libs/types/common.ts)
- JWT creation with memberNickname claim: [apps/kiwi/src/components/auth/auth.service.ts](apps/kiwi/src/components/auth/auth.service.ts)

## 2) What frontend must have

- API host and port for backend
- Access token from login flow (GraphQL logIn response)
- Browser WebSocket client (native WebSocket)
- UI state for:
  - connection status
  - latest messages
  - online client count
  - joined/left notifications

## 3) Connection URL

Development:

ws://HOST:PORT?token=ACCESS_TOKEN

Production (TLS):

wss://API_DOMAIN?token=ACCESS_TOKEN

Notes:

- If token is missing or invalid, current backend behavior allows connection as Guest.
- New tokens include memberNickname claim. Old tokens may not, and frontend should fallback to memberEmail.

## 4) Client to server message format

This gateway uses Nest event-based format. Send JSON object with event and data.

Example send payload:

    {
      "event": "message",
      "data": "Hello everyone"
    }

If you send plain text instead of this format, event routing may not behave as expected.

## 5) Server events frontend will receive

On initial connection (only for the connected client):

    {
      "event": "getMessages",
      "list": [
        {
          "event": "message",
          "text": "...",
          "memberData": { ... }
        }
      ]
    }

Presence events (broadcast):

    {
      "event": "info",
      "totalClient": 3,
      "memberData": { ... },
      "action": "joined"
    }

    {
      "event": "info",
      "totalClient": 2,
      "memberData": { ... },
      "action": "left"
    }

Chat message event (broadcast to all clients):

    {
      "event": "message",
      "text": "Hello everyone",
      "memberData": {
        "sub": "...",
        "memberEmail": "...",
        "memberNickname": "...",
        "memberType": "...",
        "memberStatus": "...",
        "iat": 0,
        "exp": 0
      }
    }

## 6) Minimal frontend integration example

    const token = auth.accessToken;
    const wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);

      if (msg.event === 'getMessages') {
        setMessages(msg.list || []);
      }

      if (msg.event === 'info') {
        setOnlineCount(msg.totalClient || 0);
        addSystemNotice(msg.action === 'joined' ? 'User joined' : 'User left');
      }

      if (msg.event === 'message') {
        appendMessage(msg);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error('Socket error', err);
    };

    function sendMessage(text) {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ event: 'message', data: text }));
    }

## 7) Development setup checklist

- Start backend API
- Confirm backend port and host
- Login and obtain a fresh access token
- Open socket with ws://HOST:PORT?token=...
- Verify:
  - getMessages received after connection
  - message events broadcast
  - info joined/left events update online count

## 8) Production setup checklist

- Use wss:// only
- Place backend behind TLS terminator (Nginx, ALB, Cloudflare, etc.)
- Ensure WebSocket upgrade headers are forwarded
- Set generous read timeout for long-lived connections
- Restrict allowed origins and deployment-level networking rules
- If running multiple backend instances, add a shared pub/sub layer for broadcast consistency

## 9) Nginx essentials for WebSocket

    location / {
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_set_header Host $host;
      proxy_read_timeout 600s;
      proxy_pass http://backend_upstream;
    }

## 10) Current backend behavior to communicate

- Server stores only latest 5 chat messages in memory
- Message history is reset on backend restart
- Guest connections are currently allowed
- memberNickname appears for newly issued tokens; fallback is memberEmail

## 11) Recommended frontend fallback logic

Display name strategy:

1. Use memberData.memberNickname if present
2. Else use memberData.memberEmail
3. Else show Guest

## 12) Optional hardening items (future)

- Reject unauthenticated connections in handleConnection
- Remove token logging from gateway in production
- Move from query token to short-lived WS token or secure cookie strategy
- Persist chat history if product needs durable messages
