# shorter-url
A lightweight URL shortener service built with **Node.js**, **TypeScript**, **Fastify**, **PostgreSQL**, and **Redis**. It allows you to create short URL codes that redirect to original URLs, while tracking view counts via Redis.
## Features
- Create short URL codes mapped to long URLs
- Redirect to the original URL by visiting `/:code`
- List all stored short URLs
- Track and retrieve view metrics per URL (powered by Redis sorted sets)
## Tech Stack
| Tool | Purpose |
|------|---------|
| [Fastify](https://fastify.dev/) | HTTP web framework |
| [PostgreSQL](https://www.postgresql.org/) | Persistent URL storage |
| [Redis](https://redis.io/) | View count tracking |
| [Zod](https://zod.dev/) | Request validation |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [tsx](https://github.com/privatenumber/tsx) | TypeScript execution / dev runner |
| [Docker Compose](https://docs.docker.com/compose/) | Local services orchestration |
## Project Structure
```
shorter-url/
├── lib/
│   ├── postgres.ts      # PostgreSQL client setup
│   └── redis.ts         # Redis client setup
├── src/
│   ├── server.ts        # Fastify server & route definitions
│   └── setup.ts         # Database schema initialization
├── client.http          # HTTP client examples for testing the API
├── docker-compose.yml   # PostgreSQL and Redis services
├── package.json
└── tsconfig.json
```
## Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) & Docker Compose
## Getting Started
### 1. Clone the repository
```bash
git clone https://github.com/Schlickmann/shorter-url.git
cd shorter-url
```
### 2. Install dependencies
```bash
npm install
```
### 3. Start the databases
```bash
docker-compose up -d
```
This spins up:
- **PostgreSQL** on port `5432` (user: `docker`, password: `docker`, db: `shorterurls`)
- **Redis** on port `6379` (password: `docker`)
### 4. Initialize the database schema
```bash
npm run setup
```
This creates the `shorter_urls` table.
### 5. Start the development server
```bash
npm run dev
```
The server will start on **http://localhost:3333**.
## API Endpoints
### `POST /api/urls` — Create a short URL
**Request body:**
```json
{
  "code": "gg",
  "url": "https://www.google.com"
}
```
**Response `201`:**
```json
{
  "shorterUrlId": 1
}
```
> `code` must be at least 3 characters. Returns `400` if the code is already taken.
---
### `GET /api/urls` — List all short URLs
Returns all stored URLs ordered by creation date (newest first).
---
### `GET /:code` — Redirect to original URL
Redirects (`301`) to the original URL associated with the code and increments the view counter in Redis. Returns `404` if the code does not exist.
---
### `GET /api/metrics` — View metrics
Returns view counts for all URLs, sorted from most to least viewed.
**Response:**
```json
[
  { "shorterUrlId": "1", "views": 42 },
  { "shorterUrlId": "3", "views": 7 }
]
```
## Database Schema
```sql
CREATE TABLE IF NOT EXISTS shorter_urls (
  id         SERIAL PRIMARY KEY,
  code       TEXT UNIQUE,
  original_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the server in watch mode (auto-reloads on changes) |
| `npm run setup` | Initialize the database schema |

