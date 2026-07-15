# CollabDoc

A local-first collaborative document editor. Documents are editable offline, changes are queued and pushed once the connection comes back, and conflicts between concurrent edits are resolved deterministically instead of overwriting anyone's work. Built for the House of Edtech Fullstack Developer assignment (v2.1).

## Why local-first

Most "collaborative editor" implementations treat the server as the source of truth and the client as a thin view on top of it — which means the UI blocks or breaks the moment the network drops. This project inverts that: the client's Yjs document is the source of truth for the user currently editing. The server is a durable relay and merge point, not a gatekeeper. Practically, that means:

- Opening, editing, and closing a document never waits on a network request.
- Edits made offline are kept in a mutation queue and replayed against the server once connectivity returns.
- Merging is handled by Yjs's CRDT algorithm, so two people editing the same paragraph offline don't produce a "last write wins" data loss — both edits are preserved and interleaved deterministically.
- Version history is separate from the live CRDT state on purpose: snapshots are immutable point-in-time copies, so restoring an old version can't corrupt what other collaborators are currently editing.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Node.js / Express, TypeScript |
| Realtime sync | Yjs (CRDT), WebSocket |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| AI | Configurable provider (OpenAI / Gemini / Groq) for summarize, grammar fix, continue-writing |
| CI/CD | GitHub Actions → Vercel (web) / Railway or Render (api) |

## Monorepo layout

```
collabdoc/
├── .github/
│   └── workflows/
│       └── backend.yml
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   │   └── 20260713164608_init/
│   │   │   │       └── migration.sql
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── db.ts
│   │   │   │   └── env.ts
│   │   │   ├── modules/
│   │   │   │   ├── ai/
│   │   │   │   ├── auth/
│   │   │   │   ├── collaborators/
│   │   │   │   ├── documents/
│   │   │   │   ├── middleware/
│   │   │   │   ├── snapshots/
│   │   │   │   ├── sync/
│   │   │   │   ├── types/
│   │   │   │   ├── utils/
│   │   │   │   └── websocket/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   ├── prisma.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── api/
│       │   └── api-client.ts
│       ├── app/
│       │   ├── documents/
│       │   │   ├── [id]/
│       │   │   │   ├── history/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── documents-cache.ts
│       │   │   ├── mutation-queue.ts
│       │   │   └── page.tsx
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── icon.svg
│       │   ├── layout.tsx
│       │   ├── loading.tsx
│       │   └── page.tsx
│       ├── components/
│       │   └── ui/
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── confirm-dialog.tsx
│       │       ├── create-document-modal.tsx
│       │       ├── doc-icon.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── share-modal.tsx
│       │       ├── sidebar.tsx
│       │       └── toast.tsx
│       └── lib/
│           ├── api/
│           │   ├── auth.service.ts
│           │   └── documents-service.ts
│           └── auth/
│               └── auth-context.tsx
├── package.json
└── README.md
```

Each module under `apps/api/src/modules` follows the same internal shape — `*.routes.ts`, `*.controllers.ts`, `*.service.ts`, `*.validators.ts` — so request validation, business logic, and route wiring stay separated instead of piling up in one file.

## How sync works

1. The editor writes into a `Y.Doc` locally. Every keystroke updates the in-memory CRDT state — nothing here touches the network.
2. Edits are debounced and pushed to `/documents/:id/sync` along with the client's state vector. If the request fails (offline, timeout), the update stays queued.
3. On reconnect, the mutation queue flushes in order. The server applies incoming updates via `Y.applyUpdate` and returns whatever the client is missing, encoded against the state vector it sent — so only the delta is transferred, not the whole document.
4. Both sides converge to the same state regardless of the order updates arrive in, which is the whole point of using a CRDT instead of hand-rolled operational transforms.

## Version history

Snapshots are captured explicitly (not on every keystroke) and stored as their own row, independent of the live `Y.Doc` state. Restoring a snapshot replaces the current state but doesn't touch the snapshot log itself, and collaborators mid-edit get the restored state pushed to them through the same sync path edits normally flow through — so a restore can't silently discard someone's in-flight offline queue.

## Auth & access control

- JWT access + refresh tokens, refresh handled transparently by an Axios interceptor.
- Document roles: `OWNER`, `EDITOR`, `VIEWER`. Role is enforced both in the UI (buttons disabled for viewers) and on the server (sync/restore endpoints reject viewer tokens outright — the UI check is a convenience, not the actual boundary).
- Prisma queries are scoped to the authenticated user's accessible documents; there's no endpoint that returns another tenant's data by guessing an ID.

## Getting started

```bash
git clone <repo-url>
cd collabdoc
npm install
```

### API

```bash
cd apps/api
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, AI provider key
npx prisma migrate deploy
npm run dev
```

### Web

```bash
cd apps/web
cp .env.example .env   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
npm run dev
```

### Environment variables

**apps/api/.env**
```
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
AI_PROVIDER_API_KEY=
PORT=4000
```

**apps/web/.env**
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
```

## Testing

Run backend tests with:

```bash
cd apps/api
npm test
```

Coverage focuses on the sync module — concurrent update merging, state vector diffing, and payload validation — since that's where correctness actually matters for this project.

## Deployment

- `web` deploys to Vercel from `apps/web`.
- `api` deploys via the GitHub Actions workflow in `.github/workflows/backend.yml`, which runs migrations against the production database before restarting the service.
- Both are wired to redeploy on push to `main` after tests pass.

## Known limitations / next steps

- Document state is stored as a single serialized Yjs update; for very long-lived documents this should move to periodic snapshot compaction so the update log doesn't grow unbounded.
- Presence is polled rather than pushed over the WebSocket channel — fine for a small assignment, would need to move onto the same socket as sync updates for real multi-user editing.
- No automated E2E coverage yet for the offline → reconnect → merge flow specifically; it's currently verified manually by toggling devtools network throttling.

## Author

Anushka — [GitHub](#) · [LinkedIn](#)