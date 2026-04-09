# MangaBuddy Scraper Pro API Reference

High-performance manga scraping interface with built-in Cloudflare bypass and image proxying.

## Base URL
`http://localhost:3001`

---

## Manga Data Endpoints

### 1. Fetch Homepage
Returns curated lists of hot updates, latest chapters, and top rankings.

- **Endpoint**: `GET /api/manga/home`
- **Response**: `HomeData` object.

---

### 2. Search Manga
Search for manga by title or keywords.

- **Endpoint**: `GET /api/manga/search`
- **Parameters**:
  - `q` (query, required): Search keyword (e.g., `solo-leveling`).
- **Sample Request**:
  `curl http://localhost:3001/api/manga/search?q=solo`

---

### 3. Get Manga Details
Retrieve metadata including synopsis, genres, and chapter list.

- **Endpoint**: `GET /api/manga/details/:slug`
- **Parameters**:
  - `slug` (path, required): Manga identifier (e.g., `one-piece`).

---

### 4. Scrape Chapter Images
Returns a complete list of image URLs for a specific chapter.

- **Endpoint**: `GET /api/manga/read/:mangaSlug/:chapterSlug`
- **Parameters**:
  - `mangaSlug`: e.g., `solo-leveling`
  - `chapterSlug`: e.g., `chapter-164`

---

## Utilities

### Image Proxy
Bypass hotlink protection with correct Referer headers. Use this to display images in your frontend without being blocked.

- **Endpoint**: `GET /api/manga/proxy`
- **Parameters**:
  - `url` (query, required): Direct image URL to proxy.

---

### Health Check
Check system status and uptime.

- **Endpoint**: `GET /health`

---

## Technical Notes
- **Cloudflare Bypass**: Integrated FlareSolverr support ensures reliable scraping by automatically handling challenges.
- **Full Image Coverage**: Employs deep-parsing of internal JavaScript variables to ensure 100% of chapter pages are captured.
- **Hotlink Protection Bypass**: The `/proxy` endpoint is essential for web frontends because MangaBuddy blocks image requests that don't originate from their own domain.

## Interactive Documentation
For a live interface with request builders and data model schemas, visit the developer portal:
[http://localhost:3001/docs](http://localhost:3001/docs)
