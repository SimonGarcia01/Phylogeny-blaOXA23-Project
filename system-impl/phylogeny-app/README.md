# phylogeny-app

The NestJS REST API that sits at the centre of the PhyloGen system. It handles authentication, data persistence, file storage coordination, and delegates long-running analyses to the `matrix-analyzer` microservice.

---

## Tech stack

| Concern | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 via TypeORM |
| Authentication | Passport-JWT (Bearer tokens) |
| Password hashing | bcrypt |
| Object storage | MinIO (S3-compatible) via the `minio` SDK |
| HTTP client | Axios (via `@nestjs/axios`) |
| Validation | `class-validator` + `class-transformer` |
| Testing | Jest + Supertest (unit + e2e, ≥80% coverage) |

---

## Project structure

```
src/
├── auth/
│   ├── auth.controller.ts       # POST /auth/login, /auth/signup
│   ├── auth.service.ts          # Credential validation, JWT signing
│   ├── strategies/
│   │   └── jwt.strategy.ts      # Passport JWT strategy
│   ├── users/                   # User CRUD
│   ├── roles/                   # Role management
│   ├── permissions/             # Permission management
│   └── roles-permissions/       # Many-to-many: assign permissions to roles
├── matrices/                    # Matrix upload flow and metadata
├── visualizations/              # Visualization lifecycle (analyze → finalize → view)
├── matrix-requests/             # Job tracking (PENDING / PROCESSING / COMPLETED / FAILED)
├── dashboards/                  # Aggregated stats for user and admin dashboards
└── common/
    ├── decorators/              # @CurrentUser(), @Public(), @Internal(), @Permissions()
    ├── guards/                  # JwtAuthGuard, PermissionsGuard, RolesGuard, InternalSecretGuard
    ├── exceptions/              # BusinessRuleViolationException (422), DbIntegrityException (409)
    └── utils/
        ├── minio/               # MinIO service (presigned URLs, bucket management)
        ├── seed/                # Database seeder (roles, permissions, example users)
        └── api/                 # HTTP client for calling the matrix-analyzer microservice
```

---

## Authentication and authorization

The API uses **JWT Bearer tokens**. Every protected endpoint requires an `Authorization: Bearer <token>` header.

### Guards

| Guard | Applied to | Behaviour |
|---|---|---|
| `JwtAuthGuard` | All routes (global) | Validates the JWT; skips routes marked `@Public()` or `@Internal()` |
| `PermissionsGuard` | Routes with `@Permissions(...)` | Checks the user's role permissions against the required list |
| `RolesGuard` | Routes with `@Roles(...)` | Checks the user's role name |
| `InternalSecretGuard` | Routes marked `@Internal()` | Validates `x-internal-secret` header; no JWT required |

### Roles

| Role | What they can do |
|---|---|
| `Admin` | Full access to all resources, user management, role/permission management |
| `Researcher` | CRUD on their own matrices and visualizations; read their matrix requests |

---

## API reference

### Auth — `POST /auth/login` / `POST /auth/signup`

Login returns a JWT and the user profile. Signup creates the account and returns the same shape.

```json
// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "researcher1@example.com",
    "firstName": "Researcher",
    "lastName": "One",
    "role": "Researcher"
  }
}
```

### Matrices

| Method | Path | Description |
|---|---|---|
| `POST` | `/matrices/get-matrix-upload-url` | Generate a presigned MinIO PUT URL for the client to upload directly |
| `POST` | `/matrices` | Register the uploaded matrix metadata |
| `GET` | `/matrices` | List the current user's matrices |
| `GET` | `/matrices/:id` | Get one matrix (ownership enforced) |
| `PATCH` | `/matrices/:id` | Update name / description |
| `DELETE` | `/matrices/:id` | Delete metadata and the file from MinIO |

### Visualizations

| Method | Path | Description |
|---|---|---|
| `POST` | `/visualizations/analyze` | Trigger analysis for a matrix (creates a Visualization + MatrixRequest, calls the microservice) |
| `GET` | `/visualizations` | List the current user's visualizations |
| `GET` | `/visualizations/:id` | Get one visualization |
| `PATCH` | `/visualizations/:id` | Update name / description / linked matrix |
| `DELETE` | `/visualizations/:id` | Delete visualization and result file from MinIO |
| `GET` | `/visualizations/:id/tree` | Get the presigned download URL for the Newick tree |

### Matrix Requests

| Method | Path | Description |
|---|---|---|
| `GET` | `/matrix-requests` | List the current user's job history |

### Dashboards

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboards/my` | Personal stats (matrix count, visualization count, requests today, failed count) |
| `GET` | `/dashboards/admin` | System-wide stats (requires Admin role) |

### Admin — Users / Roles / Permissions

Standard CRUD available at `/users`, `/roles`, `/permissions`, `/roles-permissions`.  
All require Admin role and the corresponding permission (e.g., `USERS_READ`).

### Seed

| Method | Path | Description |
|---|---|---|
| `POST` | `/seed` | Seeds the database with roles, permissions, and example users. Idempotent — safe to call only once (returns 200 if already seeded). |

---

## Matrix upload flow (detailed)

The client uploads files in three steps to avoid routing large binary data through the API server:

```
1. POST /matrices/get-matrix-upload-url
       → returns { matrixId, objectKey, uploadUrl }

2. PUT <uploadUrl>    (direct MinIO upload from the browser)
       → 200 OK from MinIO

3. POST /matrices     { matrixId, name, objectKey, mimeType, fileSize }
       → 201 Created
```

Accepted file type: `.nex` (Nexus alignment format), `application/octet-stream`, max 10 MB.

---

## Analysis flow (detailed)

```
POST /visualizations/analyze  { matrixId }
  │
  ├─ Verify ownership of the matrix
  ├─ Create Visualization record (status: pending)
  ├─ Create MatrixRequest record (status: PENDING)
  ├─ POST http://matrix-analyzer:8000/analysis/analyze_matrix
  │     (x-internal-secret header)
  └─ Return { status: 'PENDING', matrixRequestId }

  ... asynchronously in the Celery worker ...

  POST /visualizations/finalize/:id   (called by worker — internal route)
    → sets fileSize on the Visualization

  PATCH /matrix-requests/:id/status   (called by worker — internal route)
    → updates status to PROCESSING / COMPLETED / FAILED
```

---

## Environment variables

Copy `.env.example` to `.env`:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=phylogenydb
DB_SYNCHRONIZE=true          # set to false in production

JWT_SECRET=change_this_to_a_strong_secret
JWT_EXPIRES_IN=1h
SALT_ROUNDS=10

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
MINIO_MATRIX_BUCKET=matrices
MINIO_VISUALIZATION_BUCKET=visualizations

INTERNAL_SECRET=change_this_to_a_strong_internal_secret
MICROSERVICE_URL=http://localhost:8000
FRONT_ORIGIN=http://localhost:3000
```

---

## Running locally (without Docker)

```bash
cd phylogeny-app
npm install
cp .env.example .env    # edit as needed

npm run start:dev       # development mode with hot reload
npm run start           # production mode
```

You need a running PostgreSQL instance and a running MinIO instance. Point `DB_HOST` and `MINIO_ENDPOINT` to them in `.env`.

---

## Testing

```bash
# Unit tests
npm run test

# Unit tests with coverage (≥80% required across all metrics)
npm run test:cov

# E2E tests (no real database required — controllers are tested in isolation)
npm run test:e2e
```

Test files live alongside source files (`*.spec.ts`) and in `test/` for e2e.  
Guards, services, controllers, utilities, and the seed service all have dedicated test suites.
