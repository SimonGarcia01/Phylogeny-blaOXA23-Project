# PhyloGen — System Overview

PhyloGen is a web platform for phylogenetic analysis of bacterial resistance gene sequences (blaOXA-23 and related). Researchers upload nucleotide alignment files, trigger an automated analysis pipeline, and interactively explore the resulting phylogenetic trees directly in the browser.

---

> **Before running the system**, read the [`matrix-analyzer` README](./matrix-analyzer/README.md) carefully.
> The analysis pipeline requires two external tools — **JModelTest2** and **RAxML-NG** — that must be downloaded and placed in the correct directories inside `matrix-analyzer/app/tools/` before building the Docker images.
> **The system will not perform analyses without them.**

---

## Architecture

The system is composed of seven Docker containers that communicate over a shared internal network:

```
Browser
  │
  ▼
┌─────────────────────┐
│  phylogeny-frontend │  Next.js 16 – port 3000
│  (React / Zustand)  │
└──────────┬──────────┘
           │ REST (HTTP)
           ▼
┌─────────────────────┐
│   phylogeny-app     │  NestJS – port 3001
│ (REST API / Auth)   │
└──┬──────────────┬───┘
   │              │
   │ SQL          │ HTTP (internal secret)
   ▼              ▼
┌──────┐   ┌──────────────────────┐
│  db  │   │   matrix-analyzer    │  FastAPI – port 8000
│(PG)  │   │  (analysis trigger)  │
└──────┘   └──────────┬───────────┘
                      │ .delay()
                      ▼
              ┌──────────────────────┐
              │  matrix-analyzer-    │  Celery worker
              │       worker         │  (same image)
              └──────────┬───────────┘
                         │
              ┌──────────┴───────────┐
              │        redis         │  Queue broker – port 6379
              └──────────────────────┘
                         │
              ┌──────────┴───────────┐
              │        minio         │  Object storage – port 9000
              └──────────────────────┘
```

### How the services connect

| Connection             | Protocol        | Notes                                                            |
| ---------------------- | --------------- | ---------------------------------------------------------------- |
| Frontend → NestJS      | HTTP REST       | All API calls use a Bearer JWT                                   |
| NestJS → PostgreSQL    | TCP             | TypeORM manages schema and migrations                            |
| NestJS → MinIO         | S3 API          | Presigned PUT URLs for uploads; GET for tree downloads           |
| NestJS → FastAPI       | HTTP POST       | Protected by a shared `INTERNAL_SECRET` header                   |
| FastAPI → Celery       | Redis queue     | `task.delay()` serialises the job to JSON and pushes it to Redis |
| Celery worker → MinIO  | S3 API          | Downloads the alignment, uploads the result tree                 |
| Celery worker → NestJS | HTTP (internal) | Reports PROCESSING / COMPLETED / FAILED status back              |

---

## Prerequisites

- **Docker** and **Docker Compose** (v2+)
- The two external binaries described in [`matrix-analyzer/README.md`](./matrix-analyzer/README.md)
- **Java 8+** on the worker (used by JModelTest2 — the Docker image handles this)

---

## Quick start

### 1. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and change at minimum:

| Variable                                | What to set                                          |
| --------------------------------------- | ---------------------------------------------------- |
| `JWT_SECRET`                            | Any long random string                               |
| `INTERNAL_SECRET`                       | Any long random string (must match in both services) |
| `DB_PASSWORD`                           | Database password                                    |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | MinIO credentials                                    |

The defaults in `.env.example` are safe for local development.

### 2. Download the required tools

Follow the instructions in [`matrix-analyzer/README.md`](./matrix-analyzer/README.md) to download JModelTest2 and RAxML-NG and place them under `matrix-analyzer/app/tools/`.

### 3. Build and start

```bash
docker compose up --build
```

This builds all images and starts every container. The first boot may take a few minutes.

### 4. Seed the database

On first run the database is empty. Trigger the seed endpoint once:

```bash
curl -X POST http://localhost:3001/seed/run
```

This creates roles, permissions, and three example users (see below).

### 5. Open the application

| URL                          | Service                    |
| ---------------------------- | -------------------------- |
| `http://localhost:3000`      | Web application (frontend) |
| `http://localhost:3001`      | NestJS REST API            |
| `http://localhost:8000/docs` | FastAPI interactive docs   |
| `http://localhost:9001`      | MinIO web console          |

---

## Example users (created by seed)

| Role       | Email                     | Password        |
| ---------- | ------------------------- | --------------- |
| Admin      | `admin@example.com`       | `Admin123`      |
| Researcher | `researcher1@example.com` | `Researcher123` |
| Researcher | `researcher2@example.com` | `Researcher123` |

**Admin** has full access to all resources including user management, roles, and permissions.  
**Researchers** can upload matrices, trigger analyses, view their own visualizations, and read their matrix requests.

---

## Main functionalities

### For researchers

- **Sign up / Log in** — JWT-based authentication with role-aware access control
- **Upload a matrix** — get a presigned MinIO URL, upload the `.nex` alignment directly from the browser, then register the metadata
- **Trigger phylogenetic analysis** — one click starts the full pipeline: model selection (JModelTest2) → ML tree + bootstrapping (RAxML-NG) → result stored in MinIO
- **View the phylogenetic tree** — interactive SVG viewer with re-rooting support and PDF export
- **Track analysis jobs** — real-time status (PENDING / PROCESSING / COMPLETED / FAILED) via the matrix requests page
- **Manage visualizations** — rename, re-link to a different matrix, or delete

### For admins

Everything researchers can do, plus:

- **User management** — create, edit, soft-delete users; assign roles
- **Role & permission management** — create roles, define fine-grained permissions, assign them to roles
- **Admin dashboard** — system-wide counts (total users, matrices, visualizations, requests today)

---

## Subproject READMEs

Each subproject has its own README with implementation details:

- [`matrix-analyzer/README.md`](./matrix-analyzer/README.md) — FastAPI + Celery pipeline, tool installation
- [`phylogeny-app/README.md`](./phylogeny-app/README.md) — NestJS API, endpoints, auth, guards
- [`phylogeny-frontend/README.md`](./phylogeny-frontend/README.md) — Next.js app, pages, state management, testing

---

## Stopping and cleaning up

```bash
# Stop containers but keep volumes (data persists)
docker compose down

# Stop and remove all volumes (full reset)
docker compose down -v
```
