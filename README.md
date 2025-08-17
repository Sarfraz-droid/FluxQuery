FluxQuery
A fast, minimal, and elegant desktop SQL client built with Tauri 2, React, and TypeScript. Designed for focus and speed with a polished monochrome UI.

Features
- Modern stack: Tauri 2 + React + TypeScript + Tailwind
- Monaco-based SQL editor with theme, autocomplete, and Cmd/Ctrl+Enter to run
- Results with client-side pagination (Next/Prev re-runs the query silently)
- Messages panel with execution details:
  - Time executed, rows returned/total, current page, rows/page
  - Estimated rows scanned, table access (SCAN/SEARCH), and derived insights
  - Collapsible EXPLAIN QUERY PLAN details (SQLite)
- Right panel tabs: Properties and Agent
- Floating "Fix with AI" button in editor (placeholder hook)
- Draggable top bar (logo and tabs), rounded window border frame
- Cancel running query

Tech
- Desktop: Tauri 2 (Rust)
- UI: React 19, Tailwind CSS, framer-motion
- State: Zustand
- Table: @tanstack/react-table
- Editor: Monaco

Getting Started

Prerequisites
- Node.js 20 (if you hit a Node/pnpm issue, use: nvm use 20)
- pnpm
- Rust toolchain (stable) and Tauri prerequisites
  - macOS: Xcode Command Line Tools (xcode-select --install)
  - See Tauri platform setup if needed

Install
```
cd packages/sql-client
pnpm install
```

Run (Web)
```
pnpm dev
```
- Opens Vite dev server for quick UI iteration (no native APIs).

Run (Desktop, Tauri)
```
pnpm tauri dev
```
- Launches the desktop app with native capabilities.

Build (Desktop)
```
pnpm tauri build
```
- Produces platform-specific installers/bundles under packages/sql-client/src-tauri/target.

Usage
- Select a SQLite database in Settings (SQLite supported in this build)
- Write SQL in the editor
- Run: Cmd/Ctrl + Enter or click Run
- Paginate with Next/Prev (re-runs the query without adding to history)
- Check Messages tab for timing, rows, plan insights, and diagnostics
- Right panel: Properties (context) and Agent (placeholder)

Keyboard
- Run query: Cmd/Ctrl + Enter
- Cancel: Click Cancel when running

Project Structure
```
GianSQL/
  packages/
    sql-client/
      src/
        components/
          EditorPane.tsx         # Monaco editor + shortcuts
          ResultTable.tsx        # Data & Messages tabs
          RightPanel.tsx         # Properties / Agent tabs
          TopBar.tsx             # App nav + Run/Cancel
          ui/                    # Primitive components (button, tabs, ...)
        store.ts                 # Zustand app state
        types.ts                 # Shared types
      src-tauri/                 # Tauri (Rust) commands and config
        src/lib.rs               # SQLite query engine & insights
```

Troubleshooting
- pnpm or Node errors: run nvm use 20 (project uses Node 20)
- Build issues on macOS: ensure Xcode CLT installed
- SQLite only: current build supports SQLite; other drivers are stubbed

Roadmap
- Multi-driver support (Postgres/MySQL/MSSQL)
- AI-powered fixes/analysis wired to the Agent tab and editor button
- Saved connections and secure secrets storage
- Export/Import results, charts/visualizations

License
MIT


