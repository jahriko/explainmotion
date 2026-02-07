# ExplainMotion

Vector animation tool for technical explainer videos — draw with a canvas editor, animate with a timeline, and export video **entirely in the browser**.

## Features

- **Local-first projects**: projects are stored in the browser via **IndexedDB** (no backend required).
- **Canvas editor**: powered by **tldraw**.
- **LaTeX shapes**: render formulas via **KaTeX**.
- **Timeline animation**: animate supported shape properties (e.g. position/rotation/scale/opacity).
- **Auto-save**: saves changes to IndexedDB automatically (debounced).
- **Video export**: render frames in the browser and encode via **ffmpeg.wasm** in a Web Worker.
  - **Formats**: WebM (VP9), GIF, MP4 (H.264 best-effort).
  - **Resolutions**: 720p / 1080p / 4K.

## Tech stack

- **Next.js (App Router)**, **React**, **TypeScript**
- **TailwindCSS**
- **tldraw** (canvas/editor)
- **zustand** (state)
- **idb-keyval** (IndexedDB persistence)
- **ffmpeg.wasm** (`@ffmpeg/ffmpeg`, `@ffmpeg/util`) for export

## Getting started

### Prerequisites

- **Node.js** (recommended: Node 20+)
- A package manager: **pnpm** (recommended), npm, yarn, or bun

### Install

```bash
pnpm install
```

### Run dev server

```bash
pnpm dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
pnpm dev     # start Next.js dev server
pnpm build   # production build
pnpm start   # start production server
pnpm lint    # run eslint
```

## Data & storage

- **Projects are stored locally** in the browser (IndexedDB).
- Clearing site data/browser storage will remove projects.
- Exports download a file directly to your machine; nothing is uploaded by default.

## Project structure (high level)

- `app/`
  - `app/page.tsx`: project dashboard (create/open/delete)
  - `app/editor/[projectId]/page.tsx`: editor route
- `components/`: dashboard + editor UI (canvas, toolbar, timeline, export dialog)
- `lib/`
  - `lib/persistence/`: IndexedDB + auto-save
  - `lib/export/`: frame rendering + ffmpeg worker encoding
  - `lib/shapes/`: custom shapes (e.g. LaTeX)
