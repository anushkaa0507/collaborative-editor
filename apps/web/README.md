# CollabDoc

A local-first collaborative document editor built for the House of Edtech Fullstack Developer Assignment (v2.1).

CollabDoc allows documents to remain editable even when the network disappears. Changes made while offline are stored locally and synchronized automatically once connectivity returns. Concurrent edits are merged using Yjs CRDTs, preventing the typical "last write wins" problem that causes data loss in traditional collaborative editors.

## Features

* Offline-first editing
* Real-time collaboration
* Automatic synchronization after reconnecting
* Conflict-free merging with CRDTs
* Version history and snapshot restoration
* Role-based access control
* JWT authentication with refresh tokens
* AI-assisted writing tools
* Mutation queue for offline updates
* Delta synchronization using state vectors

---

## Tech Stack

| Layer              | Technology                       |
| ------------------ | -------------------------------- |
| Frontend           | Next.js 16, React 19, TypeScript |
| Styling            | Tailwind CSS v4                  |
| Forms & Validation | React Hook Form, Zod             |
| Backend            | Node.js, Express 5, TypeScript   |
| Database           | PostgreSQL                       |
| ORM                | Prisma                           |
| Authentication     | JWT                              |
| Realtime Sync      | Yjs, WebSockets (`ws`)           |
| AI                 | OpenAI / Gemini / Groq           |
| Deployment         | Vercel + Render                  |

---

## Project Structure

```text
collabdoc/
├── .github/
│   └── workflows/
│       └── backend.yml
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── modules/
│   │   │   │   ├── ai/
│   │   │   │   ├── auth/
│   │   │   │   ├── collaborators/
│   │   │   │   ├── documents/
│   │   │   │   ├── middleware/
│   │   │   │   ├── snapshots/
│   │   │   │   ├── sync/
│   │   │   │   ├── websocket/
│   │   │   │   └── utils/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── web/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── package.json
│
├── package.json
└── README.md
```

Every backend module follows the same structure:

```text
module/
├── module.routes.ts
├── module.controller.ts
├── module.service.ts
└── module.validator.ts
```

This separation keeps validation, routing and business logic independent and easier to maintain.

---

## How Synchronization Works

### Local Editing

Every document is stored in a local `Y.Doc`.

Typing updates the local CRDT state immediately and never waits for a network request.

### Mutation Queue

Updates are debounced and sent to the backend sync endpoint.

If the request fails because the user is offline, the update remains stored in a local mutation queue.

### Reconnect

When connectivity returns:

* queued updates are replayed
* the server merges updates
* missing changes are returned to the client
* both sides converge to the same state

### Conflict Resolution

CollabDoc uses CRDTs through Yjs rather than Operational Transforms.

If two users edit the same section while disconnected:

* no changes are lost
* both edits are preserved
* document state converges deterministically

---

## Version History

Snapshots are stored independently from the active document state.

This allows:

* restoring previous versions safely
* preserving historical snapshots
* preventing snapshot restores from deleting another collaborator's queued changes

---

## Authentication

Authentication uses:

* JWT access tokens
* JWT refresh tokens
* bcrypt password hashing

Refresh tokens are automatically handled through Axios interceptors on the frontend.

---

## Authorization

Each document supports three roles:

| Role   | Access         |
| ------ | -------------- |
| OWNER  | Full access    |
| EDITOR | Read and write |
| VIEWER | Read only      |

Permissions are enforced both on the frontend and backend.

Viewer accounts cannot modify document content even if API requests are manually crafted.

---

## API Modules

### Auth

* Register
* Login
* Token refresh
* Password hashing

### Documents

* Create document
* Update document
* Delete document
* Ownership validation

### Collaborators

* Share documents
* Assign roles
* Permission management

### Sync

* Yjs update handling
* State vectors
* Delta generation
* CRDT merging

### Snapshots

* Create snapshots
* Restore snapshots
* Version history

### AI

Supports:

* Summarize
* Grammar correction
* Continue writing

AI providers can be switched between OpenAI, Gemini and Groq.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/anushkaa0507/collabdoc.git
cd collabdoc
npm install
```

---

## Backend Setup

Navigate to the API project:

```bash
cd apps/api
```

Create environment variables:

```bash
cp .env.example .env
```

Add:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
AI_PROVIDER_API_KEY=
PORT=4000
```

Run migrations:

```bash
npx prisma migrate deploy
```

Start development server:

```bash
npm run dev
```

---

## Frontend Setup

Navigate to the frontend project:

```bash
cd apps/web
```

Create environment variables:

```bash
cp .env.example .env
```

Add:

```env
NEXT_PUBLIC_API_URL=https://collaborative-editor-2v0h.onrender.com
NEXT_PUBLIC_WS_URL=wss://collaborative-editor-2v0h.onrender.com
```

Start development server:

```bash
npm run dev
```

---

## Testing

Run backend tests:

```bash
cd apps/api
npm test
```

Current test coverage focuses on:

* synchronization logic
* state vector diffing
* update merging
* payload validation

---

## Deployment

### Frontend

https://collaborative-editor-virid.vercel.app

### Backend

https://collaborative-editor-2v0h.onrender.com

Deployments are triggered automatically on pushes to the `main` branch.

The backend GitHub Actions workflow runs database migrations before deployment.

---

## Known Limitations

* Yjs updates are currently stored as serialized updates rather than compacted snapshots.
* Presence updates are not yet delivered over WebSockets.
* Offline synchronization is currently verified manually.
* Large documents would benefit from snapshot compaction.

---

## Future Improvements

* Cursor presence
* Rich text formatting
* Comment threads
* Mention support
* Snapshot compaction
* End-to-end synchronization tests

---

## Author

**Anushka Ramrakhya**

GitHub: https://github.com/anushkaa0507

LinkedIn: https://www.linkedin.com/in/anushka-ramrakhya-58734b363/
