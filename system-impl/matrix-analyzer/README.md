# matrix-analyzer

The phylogenetic analysis microservice. It exposes a single FastAPI endpoint that accepts a matrix analysis request, pushes the job to a Celery queue backed by Redis, and a worker process runs the full pipeline asynchronously.

---

## What it does

When triggered, the worker executes this pipeline in order:

1. **Download** the `.nex` alignment file from MinIO
2. **Convert** the Nexus file to PHYLIP format (required by both tools)
3. **Select substitution model** — run JModelTest2 with AICc / AIC / BIC (chosen automatically based on the number of taxa)
4. **Build the phylogenetic tree** — run RAxML-NG with ML search + 100 bootstrap replicates using the best-fit model
5. **Upload** the annotated support tree (`.raxml.support`, Newick format) to MinIO
6. **Notify** the NestJS backend with the final file size and mark the request as COMPLETED (or FAILED on any error)

---

## Required external tools

> **These must be downloaded manually. The analysis pipeline will not work without them.**

### Directory structure expected

```
matrix-analyzer/
└── app/
    └── tools/
        ├── jmodeltest/
        │   ├── jModelTest.jar        ← required
        │   └── (other jModelTest files)
        └── raxml-ng/
            └── raxml-ng              ← required (Linux binary)
```

---

### Tool 1: JModelTest2

JModelTest2 selects the best-fit nucleotide substitution model for your alignment.

**Requirements:** Java 8 or later must be installed and on `PATH` inside the container. The Docker image includes OpenJDK — no action needed there.

**Download:**

1. Go to the [JModelTest2 GitHub releases](https://github.com/ddarriba/jmodeltest2/releases)
2. Download the latest release archive (e.g., `jmodeltest-2.1.10.tar.gz`)
3. Extract it and copy the entire folder contents into:
   ```
   matrix-analyzer/app/tools/jmodeltest/
   ```
   The file `jModelTest.jar` must be directly inside that folder.

**Verify the path matches `.env`:**
```
JMODELTEST_JAR=app/tools/jmodeltest/jModelTest.jar
JMODELTEST_DIR=app/tools/jmodeltest
```

---

### Tool 2: RAxML-NG

RAxML-NG performs the maximum-likelihood tree search and bootstrap analysis.

**Download:**

1. Go to the [RAxML-NG GitHub releases](https://github.com/amkozlov/raxml-ng/releases)
2. Download the **Linux** binary (`raxml-ng_v*_linux_x86_64.zip` or similar)
3. Extract it and rename/copy the binary to:
   ```
   matrix-analyzer/app/tools/raxml-ng/raxml-ng
   ```
4. Make it executable:
   ```bash
   chmod +x matrix-analyzer/app/tools/raxml-ng/raxml-ng
   ```

**Verify the path matches `.env`:**
```
RAXML_BIN=app/tools/raxml-ng/raxml-ng
```

> **Note:** The binary runs inside a Linux Docker container. If you are on macOS or Windows, download the **Linux x86_64** binary, not the native binary for your host OS.

---

## Tech stack

| Component | Technology |
|---|---|
| HTTP API | FastAPI 0.136 + Uvicorn |
| Task queue | Celery 5.4 |
| Message broker / result backend | Redis 7 |
| Alignment parsing | BioPython 1.87 |
| MinIO client | `minio` Python SDK |
| Inter-service auth | Shared `INTERNAL_SECRET` header |
| Settings | Pydantic Settings (`.env` file) |

---

## Project structure

```
matrix-analyzer/
├── app/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── celery_app.py            # Celery instance (Redis broker)
│   ├── core/
│   │   └── config.py            # Settings loaded from .env
│   ├── dependencies/
│   │   └── internal_auth.py     # x-internal-secret header guard
│   ├── routers/
│   │   └── analysis.py          # POST /analysis/analyze_matrix
│   ├── schemas/
│   │   └── analysis.py          # Request/response Pydantic models
│   ├── tasks/
│   │   └── phylo_task.py        # Celery task — entry point for the worker
│   ├── pipeline/
│   │   └── phylo_pipeline.py    # Orchestrates all pipeline steps
│   ├── services/
│   │   ├── alignment.py         # Nexus → PHYLIP conversion, taxa count
│   │   ├── jmodeltest.py        # JModelTest2 wrapper + output parser
│   │   ├── raxml.py             # RAxML-NG wrapper + model translation
│   │   ├── minio.py             # MinIO download/upload/cleanup
│   │   └── api_client.py        # NestJS callback client
│   └── tools/                   # External binaries (must be downloaded)
│       ├── jmodeltest/
│       └── raxml-ng/
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## API endpoint

All endpoints require the `x-internal-secret` header matching `INTERNAL_SECRET` from `.env`.  
This service is **not** meant to be called directly from the browser — only from the NestJS backend.

### `POST /analysis/analyze_matrix`

Accepts a matrix analysis job, enqueues it in Celery, and returns immediately.

**Request body:**
```json
{
  "matrixRequestId": 42,
  "matrixObjectKey": "users/1/matrices/550e8400-e29b-41d4-a716-446655440000",
  "visualizationId": "8fa4e9d0-1234-4abc-b567-fedcba987654",
  "visualizationObjectKey": "users/1/visualizations/8fa4e9d0-1234-4abc-b567-fedcba987654"
}
```

**Response:**
```json
{
  "taskId": "queued:8fa4e9d0-1234-4abc-b567-fedcba987654"
}
```

---

## How the queue works

```
POST /analysis/analyze_matrix
        │
        │  run_analysis_task.delay(request_data)
        ▼
    Redis (broker)
        │
        │  worker picks up the job
        ▼
  Celery worker
        │
        ▼
  run_phylo_pipeline(request, minio, nest)
        │
        ├── nest.mark_processing(...)
        ├── minio.download_matrix(...)
        ├── convert_to_phylip(...)
        ├── run_jmodeltest(...)
        ├── run_raxml(...)
        ├── minio.upload_result(...)
        ├── nest.finalize_visualization(...)
        └── nest.mark_completed(...)   (or mark_failed on any error)
```

The FastAPI process returns `200` as soon as the task is queued — it does not wait for the analysis to finish. The worker runs in a separate container with `--concurrency=2` (two parallel analyses supported by default).

---

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```env
HOST=localhost
PORT=8000

NEST_API_URL=http://localhost:3001
INTERNAL_SECRET=change_this_to_a_strong_internal_secret

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_SECURE=false
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
MINIO_MATRIX_BUCKET=matrices
MINIO_VISUALIZATION_BUCKET=visualizations

JMODELTEST_JAR=app/tools/jmodeltest/jModelTest.jar
JMODELTEST_DIR=app/tools/jmodeltest
RAXML_BIN=app/tools/raxml-ng/raxml-ng

REDIS_URL=redis://localhost:6379/0
```

When running via Docker Compose, `MINIO_ENDPOINT`, `NEST_API_URL`, and `REDIS_URL` are automatically overridden to use Docker internal service names.

---

## Running locally (without Docker)

```bash
cd matrix-analyzer
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # edit as needed

# Start the FastAPI server
python run.py

# In a separate terminal, start the Celery worker
celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
```

You will also need a local Redis instance running on port 6379.

---

## Model selection logic

The criterion used by JModelTest2 is chosen automatically based on the number of taxa in the alignment:

| Taxa count | Criterion | Rationale |
|---|---|---|
| < 30 | AICc | Corrects for small sample bias |
| 30 – 50 | AIC | Appropriate for moderate datasets |
| > 50 | BIC | Preferred for larger datasets; penalises complexity more heavily |
