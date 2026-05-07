# One Million Checkboxes

## Overview

One Million Checkboxes is a realtime collaborative web app where users interact with a shared grid of 1,000,000 checkboxes. Checkbox state is stored in Redis, updates are broadcast through Socket.IO, and authentication is handled through an external OIDC provider.

This project includes three core systems beyond the base realtime grid:

- Redis pub/sub for horizontal scaling across multiple app instances.
- OIDC authentication with secure HTTP-only cookie handling.
- A Redis-backed per-user rate limiter for checkbox toggles.

This project is part of my [ChaiCode Web Dev Cohort 2026 Archive](https://github.com/sameerbhagtani/web-dev-cohort-2026). Checkout my entire journey there!

---

## Live URL

Live Link: https://checkboxes.sameerbhagtani.dev

---

## Features

- Shared grid of 1,000,000 checkboxes backed by Redis bitmap storage.
- Public read access to checkbox data and checked count.
- Authenticated toggle actions using OIDC login.
- Secure HTTP-only cookie storage for the ID token.
- Horizontal scaling support through Redis pub/sub.
- Per-user toggle rate limiting stored in Redis.
- Infinite scrolling UI for loading checkbox pages efficiently.
- Real-time synchronization through Socket.IO.

---

## Tech Stack

### Backend

- Node.js
- Express 5
- TypeScript
- Socket.IO
- Redis
- OIDC and OAuth 2.0
- Zod
- Axios
- cookie-parser
- jose

### Frontend

- HTML
- CSS
- JavaScript
- Socket.IO Client

### External Services

- Custom OIDC/OAuth 2.0 server
    - Hosted at: https://auth.sameerbhagtani.dev
    - GitHub Repo: https://github.com/sameerbhagtani/sam-auth

---

## Architecture

### Data Storage

- Checkbox state is stored in Redis as a bitmap under a single key.
- One bit represents one checkbox.
- This keeps storage compact and makes read, write, and count operations fast.

### Realtime Updates

- When a user toggles a checkbox, the server updates Redis first.
- The server then publishes the change through Redis pub/sub.
- Every app instance subscribed to the channel receives the update and broadcasts it to its connected clients.
- This keeps multiple instances in sync without relying on in-memory state.

### Authentication

- Users log in through the external OIDC provider.
- The backend exchanges the authorization code for tokens.
- The ID token is verified using the provider's JWKS endpoint.
- The verified token is stored in an HTTP-only cookie.
- The frontend reads user state from the server, not from client-side token parsing.

### Toggle Rate Limiting

- Toggle actions are limited per authenticated userId.
- The limiter uses Redis, so every app instance enforces the same quota.
- The current policy is a fixed window of 30 toggles per 60 seconds.
- If the limit is exceeded, the toggle is rejected and the UI is told to roll the checkbox back.

---

## How It Works

### Toggle Flow

1. The user clicks a checkbox.
2. The frontend emits `client:toggled` with the checkbox id.
3. The server verifies the user is authenticated.
4. The server checks the Redis-backed rate limiter for that user.
5. If allowed, the server toggles the bit in Redis.
6. The server publishes the change through Redis pub/sub.
7. Other connected clients receive `server:toggled` and update their UI.

### Pagination Flow

- The frontend loads checkbox pages from `GET /api/checkboxes`.
- More checkboxes load when the container scrolls near the bottom.
- The initial checked count comes from `GET /api/checkboxes/count`.

---

## API Endpoints

### `GET /api/ping`

Health endpoint.

### `GET /api/checkboxes?offset=<number>&limit=<number>`

Returns a page of checkbox states.

Response shape:

```json
{
    "success": true,
    "data": {
        "offset": 0,
        "limit": 500,
        "items": [false, true, false]
    }
}
```

### `GET /api/checkboxes/count`

Returns the total number of checked checkboxes.

Response shape:

```json
{
    "success": true,
    "data": {
        "count": 1234
    }
}
```

### Auth Routes

- `GET /auth/login` redirects to the OIDC provider.
- `GET /auth/callback` exchanges the authorization code for tokens.
- `GET /auth/me` returns the current authenticated user.
- `GET /auth/logout` clears the session cookie.

---

## Socket Events

### Client to Server

- `client:toggled`
    - Payload: `{ "id": number }`

### Server to Client

- `server:toggled`
    - Payload: `{ "id": number, "origin"?: string }`
- `server:error`
    - Payload example:

```json
{
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 12s",
    "id": 42
}
```

---

## Local Setup

### Prerequisites

- Node.js
- npm
- Docker and Docker Compose

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file to create your local `.env`:

```bash
cp .env.example .env
```

Update values as needed for your environment. The required variables are:

```bash
PORT=3000
REDIS_URL=redis://localhost:6379
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
OAUTH_DISCOVERY_URL=https://auth.sameerbhagtani.dev/.well-known/openid-configuration
TOGGLE_RATE_LIMIT_COUNT=30
TOGGLE_RATE_LIMIT_WINDOW_SECONDS=60
```

### 3. Start Redis

```bash
npm run db:up
```

### 4. Run in development

```bash
npm run dev
```

### 5. Build and run production mode

```bash
npm run build
npm start
```
