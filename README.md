# Cairn

Private research & decision intelligence. Upload your company's documents, spreadsheets and meeting notes, then get **cited answers**, **comparison tables** and **decision briefs** — every claim links back to the exact passage it came from.

## Features

- **Uploads** — PDF, DOCX, XLSX/XLS, CSV, Markdown, TXT. Files are split into section-aware passages (page, heading, or sheet rows) so citations point somewhere meaningful.
- **Search** — BM25 keyword search across every passage with highlighted snippets.
- **Three research modes**
  - *Answer*: direct answer, key points, confidence, gaps, follow-ups
  - *Compare*: model-chosen dimensions, every cell cited
  - *Decision brief*: options with pros/cons, evidence, risks + mitigations, verdict, next steps
- **Evidence ledger** — click any `[n]` citation to open the source passage; jump to it in the document.
- **Saved research & notes**, **Markdown export**, **print-to-PDF**.
- **Share links** — unguessable, read-only, revocable.
- **Login & team workspaces** — Clerk auth with Organizations. Each team gets a private library and research trail; admins invite members and manage roles.
- **Sample workspace** — first boot seeds a realistic market-research scenario (Halden's UK vs Germany expansion).

## Running locally

```bash
npm install
npx clerk init --framework next   # writes Clerk dev keys to .env.local (no account needed to start)
npx clerk enable orgs --force-selection --auto-create
# add DATABASE_URL (Neon), BLOB_READ_WRITE_TOKEN and ANTHROPIC_API_KEY to .env.local (see .env.example)
npm run dev
```

Open http://localhost:3000. Without an API key the app runs in **extractive mode**: retrieval, citations and the full UI work, but results are verbatim passages rather than synthesis.

Tables are created automatically on first request. To reset everything, drop the `workspaces`, `documents`, `chunks`, `research` and `usage` tables.

## Teams & permissions

Every workspace is a Clerk Organization. New users get one automatically (seeded with sample documents an admin can remove), and can create or switch workspaces from the sidebar.

| | Member | Admin |
|---|:-:|:-:|
| Upload, search, run research, save, share | ✓ | ✓ |
| Delete / unshare **own** research | ✓ | ✓ |
| Delete / unshare **anyone's** research | | ✓ |
| Remove documents, clear samples | | ✓ |
| Invite, remove, change roles | | ✓ |

The workspace id is always taken from the verified session (`src/lib/session.ts`), never from the request, and every store read/write is keyed by it. Every table row carries its `org_id`, and every query filters on it.

## How it works

```
upload → parse (unpdf / mammoth / SheetJS) → section-aware chunks → BM25 index
question → retrieve top passages (per-doc cap for balance) → Claude, structured output
        → citation hygiene (drop any [n] that isn't a real passage) → saved research record
```

- `src/lib/ingest.ts` — parsing and chunking
- `src/lib/search.ts` — BM25 + passage selection
- `src/lib/engine.ts` — prompts, Zod schemas, Claude call, extractive fallback
- `src/lib/db.ts` — Neon Postgres client and schema (auto-migrates)
- `src/lib/store.ts` — all queries, each scoped by `org_id`
- `src/lib/session.ts` — Clerk session → workspace, role checks
- `src/proxy.ts` — protects everything except `/`, auth pages and `/share/*`

Claude is called with structured outputs (`betaZodOutputFormat`), adaptive thinking, and server-side refusal fallbacks. Only the retrieved passages (≤ 18) are sent — never the whole library.

## Deploying to Vercel

1. Import the repo in Vercel.
2. **Storage → Neon** and **Storage → Blob (private)**, both connected to the project — this sets `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`.
3. Add `ANTHROPIC_API_KEY` and the Clerk variables (use a Clerk **production** instance for a public launch).
4. Deploy. Tables are created on the first request.

**Uploads:** files up to ~3.5 MB post straight to the API; larger ones (up to 20 MB) upload from the browser to a private Blob under `uploads/<orgId>/`, are parsed, then deleted. Only extracted text is stored.

**Cost cap:** each workspace gets `CAIRN_DAILY_RUNS` (default 25) Claude runs per UTC day; failed runs are refunded. Usage shows in Settings.

## Roadmap

- **Next**: comments on briefs, activity feed, semantic search
- **Later**: Google Drive / Notion / SharePoint / Slack connectors, embeddings for semantic retrieval, scheduled re-runs

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Clerk · Neon Postgres · Vercel Blob · Anthropic SDK · Zod
