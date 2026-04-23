# One Million Checkboxes

## Overview

One Million Checkboxes is a realtime collaborative web app where users interact with a shared grid of 1,000,000 checkboxes. Every toggle updates centralized state in Redis and is broadcast to connected clients with Socket.IO.

---

## Live Demo

Live Link: https://checkboxes.sameerbhagtani.dev

---

## Tech Stack

### Backend

- Node.js
- Express 5
- TypeScript
- Socket.IO
- Redis
- Zod

### Frontend

- HTML
- CSS
- JavaScript
- Socket.IO Client

---

## How It Works

### Data Model

- The app stores checkbox values in Redis using a bitmap under a single key.
- 1 bit represents 1 checkbox.
- Total size is fixed for 1,000,000 checkboxes.

This approach is memory efficient and supports fast bit operations like read, toggle, and count.

### Realtime Flow

1. A user toggles a checkbox in the browser.
2. Frontend emits `client:toggled` with the checkbox id.
3. Server validates payload and toggles the bit in Redis.
4. Server broadcasts `server:toggled` to other clients.
5. Other clients update the corresponding checkbox in the DOM and adjust count.

### Pagination Flow

- Frontend loads checkboxes in pages from `GET /api/checkboxes`.
- More checkboxes load when the container scroll reaches near-bottom threshold.
- Initial checked count comes from `GET /api/checkboxes/count`.

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

Returns total number of checked checkboxes.

Response shape:

```json
{
    "success": true,
    "data": {
        "count": 1234
    }
}
```

---

## Socket Events

### Client to Server

- `client:toggled`
    - Payload: `{ "id": number }`

### Server to Client

- `server:toggled`
    - Payload: `{ "id": number }`
- `server:error`
    - Payload: `{ "message": string }`

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

An `.env.example` file is already provided. Copy it to create your local `.env`:

```bash
cp .env.example .env
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
