# phylogeny-frontend

The Next.js web application for PhyloGen. Researchers log in, upload alignment matrices, trigger phylogenetic analyses, and explore the resulting trees through an interactive SVG viewer — all in the browser.

---

## Tech stack

| Concern | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| State management | Zustand 5 (persisted auth store, UI store) |
| HTTP client | Axios 1 (interceptor adds Bearer token automatically) |
| Testing | Jest 30 + React Testing Library 16 (≥80% coverage) |

---

## Project structure

```
app/                      # Next.js App Router pages
├── page.tsx              # Homepage (public)
├── about/                # About page (public)
├── auth/
│   ├── login/            # Login form
│   └── signup/           # Signup form
├── dashboard/            # Personal stats dashboard
├── matrices/             # Matrix list + detail + upload flow
├── visualizations/       # Visualization list + detail + tree viewer
├── matrix-requests/      # Job history
├── users/                # Admin: user management
├── roles/                # Admin: role management
├── permissions/          # Admin: permission management
└── api/
    └── visualizations/[id]/tree/
                          # Next.js API route — proxies tree download from MinIO
                          #   (avoids exposing internal MinIO URL to the browser)

components/
├── Navbar/               # Top navigation bar (auth-aware, hamburger toggle)
├── Sidebar/              # Collapsible side navigation (admin links shown only for Admin role)
├── TreeVisualization/    # Interactive Newick tree renderer with re-rooting and PDF export
└── BioBackground/        # Animated DNA helix SVG background (canvas-free, pure SVG + rAF)

services/                 # One file per backend resource — all call apiClient
├── api-client.service.ts # Thin wrapper over the Axios instance (get/post/put/patch/delete)
├── auth.service.ts
├── matrices.service.ts   # Includes uploadToMinio() for direct presigned PUT
├── visualizations.service.ts
├── dashboard.service.ts
├── matrices-request.service.ts
├── users.service.ts
├── roles.service.ts
└── permissions.service.ts

stores/
├── auth.store.ts         # Zustand: token, user, hasHydrated — persisted to localStorage
└── ui.store.ts           # Zustand: sidebarOpen

libs/
├── axios.ts              # Axios instance — injects Bearer token via request interceptor
└── errors.ts             # getApiError() — extracts a human-readable message from AxiosError

interfaces/               # TypeScript interfaces for all API request/response shapes
```

---

## Pages

### Public pages

| Route | Description |
|---|---|
| `/` | Homepage with project description and call-to-action links |
| `/about` | About page — project context and methodology |
| `/auth/login` | Login form |
| `/auth/signup` | Registration form |

### Protected pages (require login)

| Route | Description |
|---|---|
| `/dashboard` | Personal stats: matrix count, visualization count, requests today, failed count |
| `/matrices` | List all your matrices; button to start the upload flow |
| `/matrices/upload` | Step-by-step upload wizard (get presigned URL → PUT to MinIO → register metadata) |
| `/matrices/:id` | Matrix detail; trigger analysis button |
| `/visualizations` | List all your visualizations with status badges |
| `/visualizations/:id` | Visualization detail; open interactive tree viewer |
| `/matrix-requests` | Full job history with status and timestamps |

### Admin-only pages

| Route | Description |
|---|---|
| `/users` | List, create, edit, and soft-delete users |
| `/roles` | Manage roles and assign permissions |
| `/permissions` | Create and manage fine-grained permissions |

---

## Key components

### `TreeVisualization`

A self-contained interactive phylogenetic tree renderer built with pure React SVG (no D3 or canvas).

- Parses **Newick format** including RAxML-NG output with support values on internal nodes
- Renders a **phylogram** with proportional branch lengths
- **Re-rooting** — click any internal node (white circle) to reroot the tree at that point
- **Scale bar** with auto-formatted branch length labels
- **PDF export** — serializes the SVG to HTML and opens a print dialog in a new tab

### `BioBackground`

An animated DNA double-helix background rendered entirely in SVG using `requestAnimationFrame`. No canvas, no external libraries. The helix unravels at the top with drifting nucleotide dots.

### `Navbar`

Auth-aware top bar. Shows Login/Sign Up when logged out; Dashboard link and Logout button when logged in. Shows the hamburger button only on protected routes where the sidebar is available.

### `Sidebar`

Collapsible navigation panel. Closes automatically on route change. Shows admin links (Users, Roles, Permissions) only when the logged-in user has the `Admin` role.

---

## State management

### Auth store (`useAuthStore`)

Persisted to `localStorage` via Zustand's `persist` middleware so the session survives page refreshes.

```ts
{
  user: UserProfile | null
  token: string | null
  hasHydrated: boolean        // true after localStorage has been read

  setUser(user)
  setToken(token)
  setHasHydrated(v)
  logout()                    // clears user and token
}
```

### UI store (`useUiStore`)

In-memory only (not persisted).

```ts
{
  sidebarOpen: boolean
  toggleSidebar()
  closeSidebar()
}
```

---

## HTTP layer

`libs/axios.ts` creates a single Axios instance with:
- `baseURL` set from `NEXT_PUBLIC_API_URL`
- A request interceptor that reads `useAuthStore.getState().token` and attaches `Authorization: Bearer <token>` to every outgoing request automatically

`services/api-client.service.ts` wraps the instance in a typed `apiClient` object (`get`, `post`, `put`, `patch`, `delete`) so every service file just calls e.g. `apiClient.get<MatrixListItem[]>('/matrices')`.

The tree download for visualizations goes through the **Next.js API route** at `/api/visualizations/[id]/tree` because the tree is stored at the internal Docker URL (`http://minio:9000`), which is unreachable from the browser. The server-side route fetches the file and streams it back.

---

## Environment variables

Copy `.env.example` to `.env.local`:

```env
# URL of the NestJS backend — used by the browser for all API calls
NEXT_PUBLIC_API_URL=http://localhost:3001
```

When running in Docker, `NEXT_PUBLIC_API_URL` is baked in at build time (passed as a build arg). The container also receives `INTERNAL_API_URL=http://phylogeny-app:3001` for server-side calls.

---

## Running locally (without Docker)

```bash
cd phylogeny-frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev                   # starts on http://localhost:3000
```

You need the NestJS backend running on port 3001.

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage report (≥80% required across all metrics)
npm run test:coverage
```

### What is tested

| Area | Approach |
|---|---|
| `libs/errors.ts` | Unit — all `getApiError` branches |
| `libs/axios.ts` | Unit — interceptor adds / omits Bearer token |
| `stores/auth.store.ts` | Unit — all actions and state transitions |
| `stores/ui.store.ts` | Unit — toggle and close |
| `services/api-client.service.ts` | Unit — all five HTTP verbs |
| `services/*.ts` (9 files) | Unit — each method, error propagation |
| `Navbar` | React Testing Library — auth states, hamburger, active links |
| `Sidebar` | React Testing Library — open/closed, admin section, overlay click |
| `TreeVisualization` | React Testing Library — render, reroot, PDF download, parse error |
| `BioBackground` | React Testing Library — structure, rAF animation loop, unmount cleanup |

Next.js page components are not unit-tested here; they are covered by the service and component tests that exercise the same logic.

---

## Linting and formatting

```bash
npm run lint      # ESLint (Next.js config + Prettier)
npm run format    # Prettier write
```
