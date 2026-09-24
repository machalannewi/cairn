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
- **Sample workspace** — first boot seeds a realistic market-research scenario (Halden's UK vs Germany expansion).

## Running locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. Without an API key the app runs in **extractive mode**: retrieval, citations and the full UI work, but results are verbatim passages rather than synthesis.

To reset the workspace, stop the server and delete the `data/` folder.

## How it works

```
upload → parse (unpdf / mammoth / SheetJS) → section-aware chunks → BM25 index
question → retrieve top passages (per-doc cap for balance) → Claude, structured output
        → citation hygiene (drop any [n] that isn't a real passage) → saved research record
```

- `src/lib/ingest.ts` — parsing and chunking
- `src/lib/search.ts` — BM25 + passage selection
- `src/lib/engine.ts` — prompts, Zod schemas, Claude call, extractive fallback
- `src/lib/store.ts` — JSON file store (`data/cairn.json`), single-writer queue; swap for Postgres later

Claude is called with structured outputs (`betaZodOutputFormat`), adaptive thinking, and server-side refusal fallbacks. Only the retrieved passages (≤ 18) are sent — never the whole library.

## Roadmap

- **Next**: team workspaces, roles, comments on briefs, auth
- **Later**: Google Drive / Notion / SharePoint / Slack connectors, embeddings for semantic retrieval, scheduled re-runs

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Anthropic SDK · Zod
