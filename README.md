# Shortly

A short URL demo system built with React, Node.js, PostgreSQL, and Nginx — all running behind a single public port via Docker Compose.

## Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Frontend      | React 18 + Vite + Framer Motion |
| Backend       | Node.js + Express               |
| Database      | PostgreSQL 15                   |
| Reverse Proxy | Nginx                           |
| Runtime       | Docker / Docker Compose         |

## Architecture

```
Browser → http://localhost:8088
              │
           Nginx (port 80, public)
              │
    ┌─────────┼─────────┐
    │         │         │
 /api/*    /:shortCode   /
    │         │         │
 backend   backend   frontend
 (4000)    (4000)    (3000)
    │         │
  PostgreSQL (5432)
```

Only Nginx is exposed to the host. The frontend, backend, and database are internal Docker services.

### Nginx Routing Rules

| Path | Destination | Purpose |
|------|-------------|---------|
| `/api/*` | backend | REST API |
| `= /` | frontend | React dashboard |
| `/assets/*`, static files | frontend | Vite build assets |
| `/*` | backend | Short code redirect |

## Features

- Create short links from any HTTP/HTTPS URL
- Auto-normalize URLs (e.g. `example.com` → `https://example.com`)
- Short URLs reflect the actual hostname the user accessed — works on `localhost`, LAN IP, or a real domain with no extra config
- Copy short URL to clipboard with one click
- Edit the destination URL of any existing link
- Delete links with a confirmation dialog
- Click count tracked on every redirect
- Per-link click history drawer — IP, browser, OS, device type, referer, User-Agent, timestamp
- Light / Dark / System theme — defaults to system preference, persisted to `localStorage`
- Smooth animations — add, delete, edit, copy, error states
- Responsive design — table on desktop, cards on mobile
- 404 page for missing or deleted short codes

## Getting Started

**Requirements:** Docker and Docker Compose installed.

```bash
git clone <repo-url> Shortly
cd Shortly
docker compose up --build
```

Open **http://localhost:8088** in your browser.

### Changing ports

Edit `.env` before starting:

```env
WEB_PORT=8088   # public port for the app
DB_PORT=5433    # host port postgres is exposed on (for DB tools)
```

If you change `WEB_PORT`, restart the stack:

```bash
docker compose down && docker compose up --build
```

On first run, Docker will build both images and initialize the database schema automatically. Subsequent starts are faster:

```bash
docker compose up
```

To stop and remove containers:

```bash
docker compose down
```

To also remove the database volume (clears all data):

```bash
docker compose down -v
```

## Usage

1. Paste any URL into the input field and press **Enter** (or click **Create**)
2. The new short link appears at the top of the list
3. Click **Copy** to copy the short URL to your clipboard
4. Open the short URL in a new tab — it redirects and logs the click
5. Click the **click count button** on any row to open the click history drawer
6. Click **Edit** to update the destination URL (short code stays the same)
7. Click the trash icon to delete a link (requires confirmation)

## Click History

Every redirect is logged automatically. Opening the drawer for a link shows:

| Field | Description |
|-------|-------------|
| IP | Client IP address (from `X-Forwarded-For`) |
| Browser | Detected browser name and major version |
| OS | Detected operating system |
| Device type | Desktop / Mobile / Tablet / Bot |
| Referer | Page the user came from, if available |
| User-Agent | Raw UA string (expandable row) |
| Timestamp | Exact time of the click |

The drawer also shows summary stats: total clicks, top device type, and top browser across all visits. Click logs are deleted automatically when the link is deleted.

## API Reference

All API calls go through Nginx at `http://localhost:8088/api/links`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/links` | List all links, newest first |
| `POST` | `/api/links` | Create a new short link |
| `PUT` | `/api/links/:id` | Update a link's destination URL |
| `DELETE` | `/api/links/:id` | Delete a link and its click logs |
| `GET` | `/api/links/:id/clicks` | Get full click history for a link |
| `GET` | `/:shortCode` | Redirect to original URL and log the click |

### POST /api/links

```json
{ "originalUrl": "https://example.com" }
```

Response `201`:

```json
{
  "id": 1,
  "shortCode": "aB92xK",
  "originalUrl": "https://example.com",
  "shortUrl": "http://localhost:8088/aB92xK",
  "clickCount": 0,
  "createdAt": "2026-05-08T10:00:00.000Z",
  "updatedAt": "2026-05-08T10:00:00.000Z"
}
```

### GET /api/links/:id/clicks

Response `200`:

```json
[
  {
    "id": 1,
    "ip": "192.168.1.50",
    "browser": "Chrome",
    "browserVersion": "124",
    "os": "macOS 14.4",
    "deviceType": "Desktop",
    "referer": null,
    "userAgent": "Mozilla/5.0 (Macintosh; ...) Chrome/124.0.0.0",
    "clickedAt": "2026-05-08T10:05:00.000Z"
  }
]
```

### Error format

```json
{ "message": "Please enter a valid URL.", "code": "INVALID_URL" }
```

| Code | Meaning |
|------|---------|
| `INVALID_URL` | Malformed or unsupported protocol |
| `LINK_NOT_FOUND` | No record with that ID or short code |
| `SHORT_CODE_GENERATION_FAILED` | Collision after 5 retries |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Database Schema

```sql
CREATE TABLE short_links (
  id           SERIAL PRIMARY KEY,
  short_code   VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  click_count  INTEGER DEFAULT 0 NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE click_logs (
  id              SERIAL PRIMARY KEY,
  link_id         INTEGER NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  ip              TEXT,
  user_agent      TEXT,
  browser         TEXT,
  browser_version TEXT,
  os              TEXT,
  device_type     TEXT,
  referer         TEXT,
  clicked_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

`click_logs` rows are cascade-deleted when the parent link is deleted.

## Internal Ports

| Service  | Internal Port | Publicly Exposed |
| -------- | ------------- | ---------------- |
| nginx    | 80            | Yes — via `WEB_PORT` (default `8088`) |
| frontend | 3000          | No               |
| backend  | 4000          | No               |
| postgres | 5432          | Yes — via `DB_PORT` (default `5433`) |

## Configuration

### `.env` (host-level port bindings)

Docker Compose automatically reads `.env` from the project root.

| Variable | Default | Purpose |
|----------|---------|---------|
| `WEB_PORT` | `8088` | Host port for the app (Nginx) |
| `DB_PORT` | `5433` | Host port postgres is exposed on |

### Backend environment (set in `compose.yml`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | `postgres` | PostgreSQL service name |
| `DB_PORT` | `5432` | PostgreSQL internal port (always 5432 on the Docker network) |
| `DB_NAME` | `shortly` | Database name |
| `DB_USER` | `shortly` | Database user |
| `DB_PASSWORD` | `shortly_pass` | Database password |
| `PORT` | `4000` | Backend listen port |

Generated short URLs use the `Host` header from each request, so they automatically reflect whatever address the user is accessing — `localhost`, a LAN IP, or a real domain — with no extra configuration.

## Project Structure

```
Shortly/
├── .env                        # WEB_PORT, DB_PORT
├── .env.example
├── compose.yml
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Express app + redirect handler + click logging
│       ├── db.js               # PostgreSQL pool + schema init (short_links, click_logs)
│       ├── routes/links.js     # CRUD API routes + click history endpoint
│       └── utils/
│           ├── shortCode.js    # Random 6-char code generator
│           └── parseUserAgent.js  # Browser / OS / device detection
└── frontend/
    ├── Dockerfile              # Multi-stage: Vite build → nginx
    ├── nginx.conf              # Static file server on port 3000
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api.js
        ├── index.css
        └── components/
            ├── Header.jsx
            ├── CreateInput.jsx
            ├── StatsBar.jsx
            ├── LinkList.jsx
            ├── LinkCard.jsx
            ├── ClickDrawer.jsx     # Per-link click history drawer
            ├── DeleteModal.jsx
            └── Toast.jsx
        └── hooks/
            └── useTheme.js         # Light / Dark / System theme with localStorage
```
