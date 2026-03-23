# Learning Management System (LMS)

A full-stack learning platform where instructors create and publish courses, learners enroll and track progress, and administrators manage access. The application pairs a React single-page client with an Express API backed by MySQL, and integrates optional services for file storage (Amazon S3), payments (Dodo Payments), and AI-assisted quiz generation (Hugging Face).

## Features

- **Role-based access:** Learners, instructors, and admins with JWT access tokens and HTTP-only refresh cookies.
- **Course lifecycle:** Catalog, detail pages, create/edit courses, publish controls, pricing (free or paid), and lesson ordering.
- **Lessons and playback:** YouTube-backed video lessons with structured content; per-lesson progress and course-level completion tracking.
- **Quizzes:** Instructor- and admin-facing AI quiz generation from lesson material (with caching), plus learner quiz flows.
- **Enrollments and cart:** Enrollment management for learners and instructors; paid flows coordinated with the payment provider and a background job that retries enrollment creation after successful payments.
- **Certificates:** Completion certificates generated as PDFs and stored in S3 with metadata in the database.
- **Course resources:** File uploads tied to courses, stored in S3, with separate learner and instructor views.
- **Instructor analytics:** Dashboards and per-course analytics and enrollment views.
- **API documentation:** Interactive Swagger UI plus a written API reference in the repository.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router 7, Vite 7, Tailwind CSS 4, Lucide icons |
| Backend | Node.js 20, Express 5, ES modules |
| Database | MySQL 8, Drizzle ORM, Drizzle Kit migrations |
| Auth | JWT (access) + server-side sessions and refresh tokens |
| Storage | AWS S3 (resources, certificates; presigned URLs where applicable) |
| Payments | Dodo Payments (webhooks, checkout return URLs) |
| AI | Hugging Face Inference API for quiz generation |

In production, the server can serve the built client from `client/dist` when present, so a single process can host both the SPA and `/api` routes. Payment webhooks are mounted before the JSON body parser to support raw signature verification.

## Repository layout

```
lms/
├── client/                 # Vite + React SPA
├── server/                 # Express API, Drizzle schema, migrations output
│   ├── src/
│   └── drizzle/            # Generated migration SQL (after migrate/generate)
├── docker-compose.yml      # MySQL + production-style app container
├── Dockerfile              # Multi-stage: build client, run server with dist
├── API_DOCUMENTATION.md    # Human-readable API reference
└── .env.example            # Root example (e.g. MySQL root password for Compose)
```

## Prerequisites

- Node.js 20 or newer (matches the Docker image)
- npm (lockfiles are committed for reproducible installs)
- MySQL 8 (local install, managed service, or the Compose service below)

## Configuration

### Server (`server/.env`)

Copy `server/.env.example` to `server/.env` and set values for your environment. Important groups:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string (`mysql://user:password@host:3306/database`) |
| `DATABASE_SSL`, `DATABASE_SSL_REJECT_UNAUTHORIZED` | TLS to the database when required |
| `PORT` | HTTP port (default `3000`) |
| `FRONTEND_ORIGIN` | CORS allowlist; comma-separated origins; optional `*` wildcards |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Signing and validation of tokens |
| `REFRESH_TOKEN_ENCRYPTION_KEY` | Protection of refresh token material at rest |
| `HF_API_TOKEN`, `HF_GPT_OSS_MODEL`, `HF_TIMEOUT_MS` | Hugging Face quiz generation |
| `AWS_*`, `AWS_S3_BUCKET` | S3 uploads and certificate storage |
| `DODO_PAYMENTS_*`, `DODO_DEFAULT_RETURN_URL` | Payments and webhooks |
| `PAYMENT_ENROLLMENT_*` | Retry job tuning for post-payment enrollment |

Never commit real secrets. Use `server/.env` only on your machine or in your deployment platform’s secret store.

### Client (`client/.env`)

Copy `client/.env.example` to `client/.env` and set:

- `VITE_API_URL` — Base URL of the API (e.g. `http://localhost:3000` in development, or your deployed API origin).

## Database migrations

Schema lives in `server/src/db/schema.js`. With `DATABASE_URL` set in `server/.env`:

```bash
cd server
npm install
npm run db:migrate
```

Migrations are applied with Drizzle Kit (`drizzle-kit migrate`). Ensure the target database exists and credentials match `DATABASE_URL`.

## Local development

Run the API and the SPA as separate processes for fast iteration.

**1. Start MySQL** (choose one):

- Use Docker Compose for only the database:

  ```bash
  cp .env.example .env
  # Set MYSQL_ROOT_PASSWORD in .env, then:
  docker compose up mysql -d
  ```

  Point `server/.env` `DATABASE_URL` at `mysql://root:<password>@127.0.0.1:3306/lms` after creating the `lms` database if needed.

- Or use any MySQL 8 instance and set `DATABASE_URL` accordingly.

**2. Install and migrate**

```bash
cd server && npm install && npm run db:migrate
cd ../client && npm install
```

**3. Run the server** (from `server/`)

```bash
npm start
```

Uses `nodemon` on `src/index.js`. Without a built client in production mode, the root URL redirects to `/api-docs`.

**4. Run the client** (from `client/`)

```bash
npm run dev
```

Open the Vite dev server URL (shown in the terminal). Ensure `VITE_API_URL` matches your API origin and that `FRONTEND_ORIGIN` includes the Vite origin (e.g. `http://localhost:5173`) for credentialed requests.

## Production build (single server)

Build the client, then start the server with `NODE_ENV=production` so static assets and SPA fallback routing are enabled:

```bash
cd client && npm ci && npm run build
cd ../server && npm ci --omit=dev
NODE_ENV=production node src/index.js
```

The server expects the built files at `client/dist` relative to the repository root (as in the Dockerfile).

## Docker (MySQL + app)

The root `docker-compose.yml` builds the image from `Dockerfile`, wires MySQL health checks, and passes `DATABASE_URL` using the Compose service name `mysql`. Provide `server/.env` with the secrets and optional keys your deployment needs (S3, Dodo, Hugging Face, JWT, etc.); the compose file sets `NODE_ENV`, `PORT`, and `DATABASE_URL` overrides for the app service.

```bash
cp .env.example .env
# Set MYSQL_ROOT_PASSWORD; configure server/.env for JWT, optional integrations
docker compose up --build
```

The application listens on port `3000`. Swagger UI: `http://localhost:3000/api-docs`.

## API reference

- **Interactive:** `GET /api-docs` (Swagger UI) when the server is running.
- **Narrative:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint descriptions, auth patterns, and request/response shapes.

Auth summary:

- **Access token:** `Authorization: Bearer <token>` from login or refresh.
- **Refresh token:** HTTP-only cookie for `POST /api/auth/refresh`.
- Versioned REST resources under `/api/v1` (courses, progress, AI, resources, enrollments, instructor, certificates); payment webhooks under `/api/v1/payments`.

## Scripts reference

| Location | Command | Description |
|----------|---------|-------------|
| `server/` | `npm start` | Development server with nodemon |
| `server/` | `npm run start:prod` | Production mode with `node` |
| `server/` | `npm run db:migrate` | Apply Drizzle migrations |
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Production client build |
| `client/` | `npm run preview` | Preview production build locally |
| `client/` | `npm run lint` | ESLint |

## Security and operations notes

- Configure CORS via `FRONTEND_ORIGIN` in production; avoid leaving the API open to unexpected browser origins when using cookies.
- Rotate JWT and encryption secrets if they are ever exposed.
- Payment webhooks depend on provider signing secrets; keep `DODO_PAYMENTS_WEBHOOK_KEY` and related keys out of version control.
- The enrollment retry job runs in-process; scale horizontally only if you account for duplicate job runners or move retries to a shared queue.

## License

This project is licensed under the ISC License (see `server/package.json`).

## Links

- **Issues:** [github.com/mddanish004/Learning-Management-System/issues](https://github.com/mddanish004/Learning-Management-System/issues)
- **Repository:** [github.com/mddanish004/Learning-Management-System](https://github.com/mddanish004/Learning-Management-System)
