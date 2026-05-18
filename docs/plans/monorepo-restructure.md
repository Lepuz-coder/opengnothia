# Monorepo Restructure: Add Mobile (Expo) Alongside Existing Tauri Desktop App

## Goal

Restructure the existing single-package Tauri desktop app into a pnpm monorepo with three packages — `apps/web` (the existing Tauri app), `apps/mobile` (new Expo scaffold for an upcoming mobile app), and `packages/shared` (TypeScript code consumed by both). Validate the design with a minimal Expo smoke test that runs a shared SQLite query through a port/adapter. Success = desktop app still works identically, release workflow still produces installers, mobile smoke test loads and runs a shared query against expo-sqlite.

## Progress Tracking

Phase-level overview. Tick a phase when all its steps are done.

- [ ] **Phase 0** — Pre-flight (branch + housekeeping)
- [ ] **Phase 1** — Move web code into `apps/web/` (atomic)
- [ ] **Phase 2** — Workspace setup (root files, lockfile reset)
- [ ] **Phase 3** — `packages/shared` skeleton + wiring test
- [ ] **Phase 4** — Extract pure modules into shared + import codemod
- [ ] **Phase 5** — `DatabasePort` interface, queries to shared, Tauri adapter
- [ ] **Phase 6** — Migrations to shared + `runMigrations()` helper
- [ ] **Phase 7** — Update release workflow
- [ ] **Phase 8** — Version bumps & READMEs
- [ ] **Phase 9** — Mobile smoke test (Expo + expoSqliteAdapter)
- [ ] **Phase 10** — Final UI regression + PR

> After each phase that ends with a "Verification" step, run the **[Full UI Regression Checklist](#full-ui-regression-checklist)** at the bottom of this document. Phases requiring it are marked **🧪 Run UI regression**.

## Context

OpenGnothia is a local-first, privacy-focused AI self-therapy desktop app (Tauri 2 + React 19 + Vite + TypeScript + Zustand + Tailwind 4). All user data (16 SQLite tables) lives on-device. Repository: `https://github.com/Lepuz-coder/opengnothia`. Currently at `v1.6.0` on `master`, sole developer, actively shipping. The repo has GitHub stars — the user explicitly wants to preserve them, which is why we are restructuring rather than splitting into a second repo.

The user plans to build a companion Expo mobile app with **full feature parity, local-first, no sync** (each device has its own DB). This plan stops short of building any mobile UI — it only proves the monorepo and shared package can serve a React Native runtime via a smoke test.

**Entry points the receiving agent should read first:**
- `package.json` — current single-package setup, pnpm-managed
- `vite.config.ts` — has `@/` alias to `./src`
- `tsconfig.json` — also has `@/*` paths
- `src-tauri/tauri.conf.json` — `frontendDist: "../dist"`, `beforeDevCommand: "pnpm dev"`
- `src-tauri/Cargo.toml` — Rust deps, version `1.6.0`
- `src-tauri/src/lib.rs:294` onwards — 17 `Migration { ... include_str!("../migrations/NNN.sql") }` entries
- `src/services/db/database.ts` — 10-line Tauri SQL singleton (the platform-bound surface we will hide behind a port)
- `src/services/db/queries.ts` — ~1000 lines of raw SQL against tables
- `src/services/ai/aiService.ts` — pure `fetch`-based, Tauri-free
- `src/lib/store.ts` — uses `@tauri-apps/plugin-store` for settings persistence
- `src/services/data/dataPortService.ts` — uses `@tauri-apps/plugin-fs` + `plugin-dialog` for export/import
- `.github/workflows/release.yml` — tag-triggered Tauri multi-platform release (paths assume current flat layout)

**Project surface area:**
- **13 pages** in `src/pages/`: AnalysesPage, CoursesPage, DashboardPage, DreamsPage, ExpensesPage, InsightsPage, JournalPage, OnboardingPage, ProgramsPage, SchoolsPage, SessionPage, SettingsPage, ToolsPage
- **51 components** across `src/components/{breathing,chat,dashboard,insights,layout,onboarding,session,ui}/` plus root `LockScreen.tsx`
- **7 Zustand stores** in `src/stores/`
- **16 database tables** (see migration files `001..017`)

**Non-obvious constraints:**
- Tauri Rust code embeds migration SQL via `include_str!` at compile time — paths are relative to `src-tauri/src/lib.rs` and need surgical update after move.
- Vite's `watch.ignored: ["**/src-tauri/**"]` and Tauri's `beforeDevCommand: "pnpm dev"` form a coupled dev loop that must keep working after the move.
- `@/` path alias appears in ~488 import sites across the codebase. The codemod must be precise about which prefixes map to `@opengnothia/shared/*` vs. stay as app-local `@/*`.
- `pnpm-lock.yaml` is authoritative; a leftover `package-lock.json` exists at root and must be removed.
- The `release.yml` workflow uses `pnpm install --frozen-lockfile` — any structure change must regenerate the lockfile and the workflow's path references in lockstep.
- Tauri-coupled code surface (must stay in `apps/web/`): `hooks/useAudioRecorder.ts`, `hooks/useCloseGuard.ts`, `components/LockScreen.tsx`, `components/onboarding/SecuritySetupStep.tsx`, `components/onboarding/ApiSetupStep.tsx`, `pages/SettingsPage.tsx`, `lib/store.ts`, `services/db/database.ts`, `services/data/dataPortService.ts`.

## Decisions Made

### D1: Same app on both platforms, local-first, no sync

- **Decision:** Mobile is a full-parity reimagining of the desktop app. Each device has its own SQLite DB and its own AI API calls. No data sync between platforms.
- **Why:** Preserves the product's privacy/local-first proposition that's in the README and core to identity. Sync would force a backend, E2E encryption work, and conflict resolution — all out of scope and would dilute the value prop.
- **Rejected:** (a) Companion mobile app (read-only viewer of desktop data) — would require a backend or some sync mechanism, and provides no value to mobile-only users. (b) Cloud-first rewrite — breaks the privacy promise.

### D2: Port & adapter (hexagonal) for the database layer

- **Decision:** `packages/shared` exposes a `DatabasePort` interface (`select`, `execute`). Each app provides its own adapter — `apps/web` wraps `@tauri-apps/plugin-sql`, `apps/mobile` wraps `expo-sqlite`. All query logic lives in shared and consumes the port.
- **Why:** The 16-table schema and ~1000 lines of SQL in `src/services/db/queries.ts` are the largest body of duplication risk if each app maintained its own. Tauri SQL and expo-sqlite have nearly identical surface (`execute(sql, params)`, `select(sql, params)`), so a port is ~30 lines. Settings/fs/dialog are not large enough to justify their own ports.
- **Rejected:** (a) Pure copy-paste of queries into each app — predictable drift, schema bug surface. (b) Cross-platform ORM like Drizzle — porting 16 tables of raw SQL is a much bigger investment, and current Tauri Rust-side migrations would need to be rewritten. Deferred to a possible future refactor; the port arrangement here doesn't preclude it.

### D3: Hybrid `packages/shared` Day-1 scope (queries in, stores out)

- **Decision:** Shared includes types, i18n, pure utils (`lib/cn.ts`, `formatTokens.ts`, `createBufferedTextStream.ts`, `createMarkerStrippedStream.ts`), AI services (`services/ai/*`), constants, DB port interface, DB queries, and `runMigrations` helper. Zustand stores stay in `apps/web/src/stores/` for now.
- **Why:** Queries must be shared (D2 reasoning). Stores currently mix domain state (`messages`, `sessionId`) with UI state (`insightsPanelOpen`, `pendingInsightDraft`); moving them now would require a separation pass before the mobile UX is even designed. When mobile UI begins, the user can split UI/domain state and migrate selected stores cleanly.
- **Rejected:** (a) Lean shared (only platform-free things) — punts the queries-duplication risk. (b) Ambitious shared (stores too) — premature given undefined mobile UX.

### D4: Migrations live in `packages/shared/migrations/`, single source of truth

- **Decision:** Move `src-tauri/migrations/*.sql` files into `packages/shared/migrations/`. Rust `include_str!` paths become `../../../../packages/shared/migrations/NNN_*.sql` (relative to `apps/web/src-tauri/src/lib.rs`). Mobile gets a `runMigrations(db: DatabasePort)` helper in `packages/shared/src/db/runMigrations.ts` that uses `PRAGMA user_version` to apply pending migrations sequentially.
- **Why:** Schema must be identical on both platforms (D1: full parity). Two copies will drift; the user is solo and migrations are added incrementally.
- **Rejected:** (a) Two copies, one per app — drift risk. (b) Codegen step that emits a TS constants file from `.sql` — extra build pipeline complexity for static SQL.

### D5: pnpm workspaces + TypeScript Project References (no Turborepo)

- **Decision:** Root `pnpm-workspace.yaml` lists `apps/*` and `packages/*`. Root `tsconfig.json` is an orchestrator with `references` to each package. No Turborepo.
- **Why:** Solo developer, 3 packages, builds already finish in seconds. Turborepo's caching/pipeline benefits are marginal here while adding `turbo.json` complexity and a debugging surface. If needed later, Turborepo adds in ~5 minutes without restructuring.
- **Rejected:** Turborepo upfront — unjustified complexity for current size.

### D6: Single feature branch, single PR, phased commits

- **Decision:** All work happens on `restructure/monorepo` branched from `master`. Commits are organized by phase. One PR to merge.
- **Why:** Phase 1 (moving everything into `apps/web/`) is inherently atomic — Tauri config, Vite config, tsconfig paths all change together. There is no "half-restructured" state that's both working and committable. A branch keeps `master` and the live release pipeline intact until the entire structure is verified.
- **Rejected:** (a) Multiple incremental PRs to master — infeasible due to atomicity. (b) Direct commits to master — same problem plus risk of breaking the tag-triggered release workflow for live users.

### D7: Plan ends at restructure + Expo smoke test (no mobile UI)

- **Decision:** Final phase scaffolds `apps/mobile` with `create-expo-app`, wires `@opengnothia/shared` as a workspace dependency, installs `expo-sqlite`, writes an `ExpoSqliteAdapter`, runs `runMigrations(db)`, calls one shared query (e.g., `getCheckInCount()`), and renders the result. No real UI, no auth, no settings.
- **Why:** Validates the monorepo and port design against the actual React Native bundler (Metro) and runtime before declaring the restructure done. Catching design flaws here is much cheaper than during mobile feature development.
- **Rejected:** (a) Restructure only (no mobile) — leaves shared design unverified. (b) Restructure + 1-2 real screens — mobile UX decisions haven't been made, would balloon scope.

### D8: Source-mode shared, package name `@opengnothia/shared`

- **Decision:** `packages/shared/` is consumed as TypeScript source (no `dist/` build step). Apps import via `@opengnothia/shared/<subpath>`. Each app's own `@/*` path alias stays pointing at its own `src/`.
- **Why:** Monorepo is private and will not publish shared to npm. Source mode = zero build step, HMR works, IDE jump-to-definition works.
- **Rejected:** (a) Build-to-`dist/` mode — slower dev loop with watch mode, unnecessary when we don't publish. (b) Short scope like `@og/shared` — `@opengnothia/shared` matches the repo name and is unambiguous.

### D9: Independent app versions; private root and shared

- **Decision:** `apps/web/package.json` + `tauri.conf.json` + `Cargo.toml` stay version-synced (bump to `1.7.0` after restructure). `apps/mobile/package.json` starts at `0.1.0`. `packages/shared/package.json` is `"private": true`, version `0.0.0`, never bumped. Root `package.json` is also private with no version.
- **Why:** Web and mobile will release independently. Forcing a single monorepo version is artificial when mobile is at `0.1.0` and web is at `1.7.0`.
- **Rejected:** Monorepo-wide single version — misleading and forces useless bumps.

### D10: Root README stays as primary; per-app READMEs minimal

- **Decision:** Existing root `README.md` (the star magnet) remains the main product README. Append a brief "Development" section pointing to `apps/web/README.md` and `apps/mobile/README.md` for setup commands.
- **Why:** Star-momentum and discovery come from the README at root. Stripping content into subfolders would hide the project's surface from new visitors.

### D11: Housekeeping

- **Decisions:**
  - Delete stale `claude/*` remote branches (`claude/add-session-expenses-history-*`, `claude/implement-dreams-feature-*`, `claude/implement-journal-feature-*`, `claude/redesign-chat-interface-*`) before opening the restructure branch — they are abandoned and cannot be rebased onto the new layout. User to confirm `courses` branch has been merged or is also abandoned before deleting it.
  - Delete root `package-lock.json` (pnpm is authoritative).
  - Pin `"packageManager": "pnpm@9.x.x"` in root `package.json`.

### D12: Not shared — each app implements its own

- **Decision:** `lib/security.ts` (Web Crypto), `lib/store.ts` (Tauri store), and `services/data/dataPortService.ts` (Tauri fs/dialog) are NOT in shared. Each app gets its own implementation.
- **Why:** Each touches platform-specific APIs (Web Crypto vs expo-crypto; Tauri store vs AsyncStorage; Tauri fs+dialog vs expo-file-system+expo-document-picker). Defining a port for each is more code than just having two implementations. These modules are small.

## Affected Modules

### New files (root)
- `package.json` (new) — workspace root, `"private": true`, scripts (`dev:web`, `dev:mobile`, `build:web`, etc.), `packageManager` pin
- `pnpm-workspace.yaml` (new) — lists `apps/*`, `packages/*`
- `tsconfig.json` (new at root) — orchestrator with `references` to each package
- `.gitignore` (update) — keep existing entries; add anything Expo-specific in Phase 9

### Moved (current root → `apps/web/`)
- `src/` → `apps/web/src/`
- `src-tauri/` → `apps/web/src-tauri/`
- `index.html` → `apps/web/index.html`
- `vite.config.ts` → `apps/web/vite.config.ts`
- `tsconfig.json` → `apps/web/tsconfig.json` (modified — see below)
- `tsconfig.node.json` → `apps/web/tsconfig.node.json`
- `package.json` → `apps/web/package.json` (modified)
- `dist/` → `apps/web/dist/` (gitignored, recreated by build)
- `assets/` → `apps/web/assets/`

### Modified inside `apps/web/`
- `apps/web/package.json` — name stays `opengnothia` (or rename to `@opengnothia/web` — see Open Questions), add `@opengnothia/shared` workspace dep, version bumped to `1.7.0` in Phase 8
- `apps/web/tsconfig.json` — keep `@/*` paths; rely on root references for shared resolution
- `apps/web/src-tauri/tauri.conf.json` — `$schema` path may need verification; version bump to `1.7.0`
- `apps/web/src-tauri/Cargo.toml` — version bump to `1.7.0`
- `apps/web/src-tauri/src/lib.rs:294-???` — 17 `include_str!` paths updated from `"../migrations/NNN_*.sql"` to `"../../../../packages/shared/migrations/NNN_*.sql"`

### New files in `packages/shared/`
- `packages/shared/package.json` — `"name": "@opengnothia/shared"`, `"private": true`, `"type": "module"`, exports map (subpaths: `./types`, `./i18n`, `./ai`, `./constants`, `./lib`, `./db`, `./db/port`, `./db/queries`, `./db/runMigrations`)
- `packages/shared/tsconfig.json` — standalone TS config, `"composite": true` for project references
- `packages/shared/src/index.ts` — barrel (or omit if using exports map)
- `packages/shared/src/db/port.ts` — `DatabasePort` interface
- `packages/shared/src/db/queries.ts` — moved from `src/services/db/queries.ts`, refactored to accept a `DatabasePort` (factory pattern: `export function createQueries(db: DatabasePort) { return { getUserProfile: async () => ..., ... } }`)
- `packages/shared/src/db/runMigrations.ts` — new helper that reads migration list and applies via `PRAGMA user_version`
- `packages/shared/migrations/*.sql` — 17 files moved from `apps/web/src-tauri/migrations/`

### Moved into `packages/shared/src/`
- `src/types/` → `packages/shared/src/types/`
- `src/i18n/` → `packages/shared/src/i18n/`
- `src/constants/` → `packages/shared/src/constants/`
- `src/services/ai/*` → `packages/shared/src/ai/*`
- `src/lib/cn.ts`, `src/lib/formatTokens.ts`, `src/lib/createBufferedTextStream.ts`, `src/lib/createMarkerStrippedStream.ts` → `packages/shared/src/lib/`

### Stay in `apps/web/src/` (Tauri-coupled or app-local)
- `components/` (all 51 components) — only their imports get rewritten
- `pages/` (all 13 pages) — only their imports get rewritten
- `hooks/` (all hooks, including `useAudioRecorder`, `useCloseGuard`)
- `stores/` (all 7 Zustand stores) — per D3
- `App.tsx`, `main.tsx`, `styles.css`, `vite-env.d.ts`
- `lib/security.ts` (Web Crypto, web-only)
- `lib/store.ts` (Tauri store, web-only)
- `services/data/dataPortService.ts` (Tauri fs/dialog, web-only)
- `services/db/database.ts` — **replaced** by `apps/web/src/adapters/tauriSqlAdapter.ts` (see Phase 5)

### New files in `apps/web/src/`
- `apps/web/src/adapters/tauriSqlAdapter.ts` — implements `DatabasePort` wrapping `@tauri-apps/plugin-sql`
- `apps/web/src/db/index.ts` (or similar) — bootstrap: load Tauri DB, wrap in adapter, call `createQueries(adapter)`, export a singleton `queries` consumed by stores/pages

### Modified imports across `apps/web/src/`
- ~488 `@/` import sites total (`grep -rh "from \"@/"` counts). The ones with prefix:
  - `@/types` (48) → `@opengnothia/shared/types`
  - `@/i18n` (69) → `@opengnothia/shared/i18n`
  - `@/services/ai/...` (subset of 76 `@/services`) → `@opengnothia/shared/ai/...`
  - `@/constants` (39) → `@opengnothia/shared/constants`
  - `@/lib/cn`, `@/lib/formatTokens`, `@/lib/createBufferedTextStream`, `@/lib/createMarkerStrippedStream` (subset of 45 `@/lib`) → `@opengnothia/shared/lib/...`
- App-local prefixes stay `@/`: `@/components` (134), `@/pages` (13), `@/hooks` (11), `@/stores` (49), `@/assets` (4), `@/lib/security`, `@/lib/store`, `@/services/data/dataPortService`, and `@/services/db/queries` becomes `@/db` (the local singleton wrapper).

### New files in `apps/mobile/`
- `apps/mobile/package.json` — Expo TypeScript app, depends on `@opengnothia/shared` and `expo-sqlite`
- `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js` — Expo defaults, metro tuned for monorepo
- `apps/mobile/App.tsx` — smoke test: init expo-sqlite, runMigrations, call shared query, render result
- `apps/mobile/src/adapters/expoSqliteAdapter.ts` — implements `DatabasePort` wrapping `expo-sqlite`
- `apps/mobile/README.md` — minimal dev instructions

### CI
- `.github/workflows/release.yml` — `swatinem/rust-cache` `workspaces` path updated to `./apps/web/src-tauri -> target`; Tauri action gets `projectPath: apps/web`; `pnpm install` still runs from repo root (workspace-aware)

### Documentation
- `README.md` (root) — add "Development" section explaining monorepo layout and which app lives where
- `apps/web/README.md` — minimal dev instructions (new file)

### Deleted
- Root `package-lock.json`
- Remote branches `claude/add-session-expenses-history-*`, `claude/implement-dreams-feature-*`, `claude/implement-journal-feature-*`, `claude/redesign-chat-interface-*` (user confirms before deletion)
- `courses` branch — only if user confirms it's merged or abandoned

## Implementation Steps

### Phase 0 — Pre-flight

- [ ] **Step 1** — Confirm `git status` is clean on `master` and the working tree matches what's at `Lepuz-coder/opengnothia`. If there are uncommitted changes to `src-tauri/tauri.conf.json` (gitStatus indicates this), decide with the user whether to commit, stash, or discard before starting.
- [ ] **Step 2** — Verify the `v1.6.0` tag exists (`git tag -l v1.6.0`) — this is our rollback baseline.
- [ ] **Step 3** — Check what's on each stale branch with `git log master..origin/<branch> --oneline` for `claude/*` and `courses`. Show the user the diffs and confirm deletion. Delete confirmed ones with `git push origin --delete <branch>`.
- [ ] **Step 4** — Create and check out the working branch: `git checkout -b restructure/monorepo`.

### Phase 1 — Move web code into `apps/web/` (atomic, single commit)

- [ ] **Step 5** — `mkdir -p apps/web` (and `apps/mobile`, `packages/shared` placeholders if helpful for `.gitkeep`).
- [ ] **Step 6** — Use `git mv` to move everything web-related: `src/`, `src-tauri/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `package.json`, `assets/` → `apps/web/`. (Note: `node_modules/`, `pnpm-lock.yaml`, `package-lock.json`, `dist/`, `README.md`, `LICENSE`, `.gitignore`, `.github/`, `.claude/` stay at root.)
- [ ] **Step 7** — Verify `apps/web/src-tauri/tauri.conf.json` paths still resolve. `frontendDist: "../dist"` now resolves to `apps/web/dist` ✓. `$schema: "../node_modules/..."` resolves to `apps/web/node_modules/...` — this will work once Phase 2's pnpm install runs because pnpm creates per-package `node_modules/` with symlinks.
- [ ] **Step 8** — Verify `apps/web/vite.config.ts` `path.resolve(__dirname, "./src")` still resolves correctly (it does — `__dirname` becomes `apps/web/`).
- [ ] **Step 9 — 🧪 Verification (skip UI regression at this stage; just smoke).** `cd apps/web && pnpm install && pnpm tauri dev`. Desktop app should boot identically. If it fails, the most likely causes are (a) Tauri `beforeDevCommand` working dir, (b) missing `node_modules` due to leftover root install. Open at least the Dashboard and Settings to confirm app launches; full regression comes after Phase 2's workspace install.
- [ ] **Step 10** — Commit: `feat(monorepo): move web code into apps/web`.

### Phase 2 — Workspace setup

- [ ] **Step 11** — From repo root, delete `node_modules/` and the root `package-lock.json`. Move `pnpm-lock.yaml` to repo root if it isn't already (it should be at root since we left it there in Phase 1, but `cd apps/web && pnpm install` may have created a new one — check and consolidate).
- [ ] **Step 12** — Create `pnpm-workspace.yaml` at root:
    ```yaml
    packages:
      - "apps/*"
      - "packages/*"
    ```
- [ ] **Step 13** — Create root `package.json`:
    ```json
    {
      "name": "opengnothia-monorepo",
      "private": true,
      "packageManager": "pnpm@9.15.0",
      "scripts": {
        "dev:web": "pnpm --filter @opengnothia/web tauri dev",
        "dev:web:vite": "pnpm --filter @opengnothia/web dev",
        "build:web": "pnpm --filter @opengnothia/web build",
        "build:web:tauri": "pnpm --filter @opengnothia/web tauri build",
        "dev:mobile": "pnpm --filter @opengnothia/mobile start"
      }
    }
    ```
    (Decide on the web package name; see Open Questions. The plan assumes `@opengnothia/web` to match the pattern.)
- [ ] **Step 14** — Rename `apps/web/package.json` `name` to `@opengnothia/web` (or keep as `opengnothia` — see Open Questions). Bump `packageManager` is at root only.
- [ ] **Step 15** — Run `pnpm install` from root. Verify it creates a single root `node_modules/` with `.pnpm/` and symlinks `apps/web/node_modules/` correctly.
- [ ] **Step 16 — 🧪 Run [Full UI Regression Checklist](#full-ui-regression-checklist).** `pnpm dev:web` (or from root `pnpm --filter @opengnothia/web tauri dev`) must still launch the desktop app and every page must behave identically.
- [ ] **Step 17** — Commit: `chore(monorepo): set up pnpm workspace`.

### Phase 3 — Create `packages/shared` skeleton

- [ ] **Step 18** — Create `packages/shared/package.json`:
    ```json
    {
      "name": "@opengnothia/shared",
      "version": "0.0.0",
      "private": true,
      "type": "module",
      "exports": {
        "./types": "./src/types/index.ts",
        "./i18n": "./src/i18n/index.ts",
        "./constants": "./src/constants/index.ts",
        "./constants/*": "./src/constants/*.ts",
        "./lib/*": "./src/lib/*.ts",
        "./ai": "./src/ai/index.ts",
        "./ai/*": "./src/ai/*.ts",
        "./db": "./src/db/index.ts",
        "./db/port": "./src/db/port.ts",
        "./db/queries": "./src/db/queries.ts",
        "./db/runMigrations": "./src/db/runMigrations.ts"
      }
    }
    ```
    (Exports map mirrors the directory layout. Subpath wildcards keep imports natural.)
- [ ] **Step 19** — Create `packages/shared/tsconfig.json` extending the same compiler options as web's tsconfig where relevant; mark `"composite": true`.
- [ ] **Step 20** — Create a placeholder `packages/shared/src/index.ts` exporting `export const __sharedLoaded = true;` (used for smoke test).
- [ ] **Step 21** — Add `"@opengnothia/shared": "workspace:*"` to `apps/web/package.json` `dependencies`. Run `pnpm install`.
- [ ] **Step 22** — Add a temporary import in `apps/web/src/main.tsx`: `import { __sharedLoaded } from "@opengnothia/shared";` (just for verification).
- [ ] **Step 23** — Update `apps/web/tsconfig.json` to add `"references": [{ "path": "../../packages/shared" }]` and create root `tsconfig.json` with references to both packages.
- [ ] **Step 24 — 🧪 Verification (smoke).** `pnpm --filter @opengnothia/web dev` builds without error, the temporary import resolves. Open Dashboard, confirm no console errors. Full UI regression not needed yet.
- [ ] **Step 25** — Remove the temporary import, leaving the placeholder file. Commit: `chore(shared): scaffold @opengnothia/shared package`.

### Phase 4 — Extract pure modules into shared (codemod-heavy phase)

- [ ] **Step 26** — `git mv apps/web/src/types packages/shared/src/types`.
- [ ] **Step 27** — `git mv apps/web/src/i18n packages/shared/src/i18n`.
- [ ] **Step 28** — `git mv apps/web/src/constants packages/shared/src/constants`.
- [ ] **Step 29** — `git mv apps/web/src/services/ai packages/shared/src/ai`.
- [ ] **Step 30** — `git mv apps/web/src/lib/cn.ts apps/web/src/lib/formatTokens.ts apps/web/src/lib/createBufferedTextStream.ts apps/web/src/lib/createMarkerStrippedStream.ts packages/shared/src/lib/`.
- [ ] **Step 31** — Rewrite imports across `apps/web/src/`. A safe codemod approach:
    - `@/types` → `@opengnothia/shared/types`
    - `@/i18n` → `@opengnothia/shared/i18n`
    - `@/constants` → `@opengnothia/shared/constants`
    - `@/services/ai/aiService` → `@opengnothia/shared/ai/aiService`
    - `@/services/ai/promptBuilder` → `@opengnothia/shared/ai/promptBuilder`
    - (repeat per ai/* file)
    - `@/lib/cn` → `@opengnothia/shared/lib/cn`
    - `@/lib/formatTokens` → `@opengnothia/shared/lib/formatTokens`
    - `@/lib/createBufferedTextStream` → `@opengnothia/shared/lib/createBufferedTextStream`
    - `@/lib/createMarkerStrippedStream` → `@opengnothia/shared/lib/createMarkerStrippedStream`
    Use `sed -i '' -E` (macOS) or a `grep -rl ... | xargs sed -i` script. Keep `@/lib/security`, `@/lib/store`, `@/services/data/*`, `@/services/db/*` unchanged.
- [ ] **Step 32** — Rewrite imports **inside the moved files themselves** — they likely import each other with `@/...` paths. Within `packages/shared/src/`, anything that used to reference another shared module via `@/...` must become a relative import (e.g., `../types` or `./AIError`). Run a sweep with `grep -rn "from \"@/" packages/shared/` and rewrite each.
- [ ] **Step 33 — 🧪 Verification + typecheck.** `pnpm --filter @opengnothia/web build` typechecks clean.
- [ ] **Step 34 — 🧪 Run [Full UI Regression Checklist](#full-ui-regression-checklist).** Every page must load with no console errors. Critically test pages that heavily use moved modules: any page using AI (`SessionPage`, `OnboardingPage` interview step, `AnalysesPage`), any page using i18n (all), any page using types (all).
- [ ] **Step 35** — Commit: `refactor(monorepo): extract pure modules into @opengnothia/shared`.

### Phase 5 — Define DB port, move queries, write Tauri adapter

- [ ] **Step 36** — Write `packages/shared/src/db/port.ts`:
    ```ts
    export interface DatabasePort {
      select<T>(sql: string, params?: unknown[]): Promise<T[]>;
      execute(sql: string, params?: unknown[]): Promise<{ lastInsertId?: number; rowsAffected: number }>;
    }
    ```
    (Verify the exact return shapes of Tauri's `db.execute` and `expo-sqlite`'s `runAsync` — they differ slightly; pick the lowest common denominator.)
- [ ] **Step 37** — `git mv apps/web/src/services/db/queries.ts packages/shared/src/db/queries.ts`.
- [ ] **Step 38** — Refactor `queries.ts` to accept a `DatabasePort` via a factory:
    ```ts
    export function createQueries(db: DatabasePort) {
      return {
        getUserProfile: async (): Promise<UserProfile | null> => { /* uses db.select */ },
        // ... all 50+ query functions
      };
    }
    export type Queries = ReturnType<typeof createQueries>;
    ```
    Replace every `const db = await getDatabase()` with the closured `db` parameter. This is the biggest mechanical refactor — go function by function.
- [ ] **Step 39** — Update imports in `queries.ts` from `@/types` to relative `../types` (or absolute via tsconfig paths inside shared if configured).
- [ ] **Step 40** — Create `apps/web/src/adapters/tauriSqlAdapter.ts`:
    ```ts
    import type Database from "@tauri-apps/plugin-sql";
    import type { DatabasePort } from "@opengnothia/shared/db/port";
    export function createTauriSqlAdapter(db: Database): DatabasePort {
      return {
        select: (sql, params) => db.select(sql, params),
        execute: async (sql, params) => {
          const res = await db.execute(sql, params);
          return { lastInsertId: res.lastInsertId, rowsAffected: res.rowsAffected };
        },
      };
    }
    ```
- [ ] **Step 41** — Replace `apps/web/src/services/db/database.ts` with `apps/web/src/db/index.ts`:
    ```ts
    import Database from "@tauri-apps/plugin-sql";
    import { createQueries, type Queries } from "@opengnothia/shared/db/queries";
    import { createTauriSqlAdapter } from "@/adapters/tauriSqlAdapter";

    let queries: Queries | null = null;
    export async function getQueries(): Promise<Queries> {
      if (!queries) {
        const db = await Database.load("sqlite:opengnothia.db");
        queries = createQueries(createTauriSqlAdapter(db));
      }
      return queries;
    }
    ```
- [ ] **Step 42** — Rewrite every call site that used to do `import { getDatabase } from "@/services/db/database"; const db = await getDatabase(); db.select(...)` to instead do `import { getQueries } from "@/db"; const q = await getQueries(); q.someFunction(...)`. Search with `grep -rn "@/services/db" apps/web/src` to find sites.
    - Note: `apps/web/src/services/data/dataPortService.ts` uses `getDatabase` directly for raw table dumps. Decide: either expose a `select(sql, params)` passthrough on the queries object, or import the adapter directly there. Recommend: keep `dataPortService` using a direct `DatabasePort` injection, since it's intentionally generic.
- [ ] **Step 43** — Delete `apps/web/src/services/db/database.ts` (replaced by `apps/web/src/db/index.ts`).
- [ ] **Step 44 — 🧪 Run [Full UI Regression Checklist](#full-ui-regression-checklist).** This is the highest-risk phase — every DB-touching flow must be verified. Especially: session save/resume, journal/dream CRUD, insights, courses progress, weekly summary, export/import on Settings.
- [ ] **Step 45** — Commit: `refactor(db): introduce DatabasePort + Tauri adapter, queries in shared`.

### Phase 6 — Move migrations to shared

- [ ] **Step 46** — `mkdir -p packages/shared/migrations` and `git mv apps/web/src-tauri/migrations/*.sql packages/shared/migrations/`. Remove the empty `apps/web/src-tauri/migrations/` directory.
- [ ] **Step 47** — Update all 17 `include_str!` paths in `apps/web/src-tauri/src/lib.rs` (currently `"../migrations/NNN_*.sql"`, around lines 294-???) to `"../../../../packages/shared/migrations/NNN_*.sql"`. Use sed or careful manual edit.
- [ ] **Step 48** — Write `packages/shared/src/db/runMigrations.ts`:
    ```ts
    import type { DatabasePort } from "./port";
    export interface MigrationDef { version: number; sql: string; }
    export async function runMigrations(db: DatabasePort, migrations: MigrationDef[]): Promise<void> {
      const result = await db.select<{ user_version: number }>("PRAGMA user_version");
      const current = result[0]?.user_version ?? 0;
      const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
      for (const m of pending) {
        await db.execute(m.sql);
        await db.execute(`PRAGMA user_version = ${m.version}`);
      }
    }
    ```
    (Mobile will import each `.sql` as a string via Metro's `?raw` or a build-time import. See Open Questions for the exact mechanism.)
- [ ] **Step 49 — 🧪 Verification: clean-DB launch.** `pnpm --filter @opengnothia/web tauri build` should compile Rust successfully. Run the app on a fresh DB (delete `~/Library/Application Support/com.opengnothia.app/opengnothia.db` on macOS or equivalent) and confirm migrations apply correctly — Onboarding flow should appear, then run [Full UI Regression Checklist](#full-ui-regression-checklist).
- [ ] **Step 50** — Commit: `refactor(db): migrations to shared, runMigrations helper`.

### Phase 7 — Update release workflow

- [ ] **Step 51** — Edit `.github/workflows/release.yml`:
    - Change `swatinem/rust-cache` `workspaces: './src-tauri -> target'` to `workspaces: './apps/web/src-tauri -> target'`.
    - Add `projectPath: apps/web` to the `tauri-apps/tauri-action@v0` step (this tells the action where the Tauri project lives).
    - Keep `pnpm install --frozen-lockfile` at repo root (works with workspaces).
- [ ] **Step 52** — Test the workflow without cutting a real release. Options:
    - Push to a temporary tag like `v1.7.0-rc1` from the branch and let it run, then delete the GitHub release/draft if it succeeds.
    - Or add a manual `workflow_dispatch` trigger temporarily, run it, then remove it before merging.
- [ ] **Step 53** — Verify all three matrix builds (macOS, Ubuntu, Windows) succeed.
- [ ] **Step 54** — Commit: `ci: update release workflow paths for monorepo`.

### Phase 8 — Version bumps & READMEs

- [ ] **Step 55** — Bump `apps/web/package.json` `version` to `1.7.0`.
- [ ] **Step 56** — Bump `apps/web/src-tauri/tauri.conf.json` `version` to `1.7.0`.
- [ ] **Step 57** — Bump `apps/web/src-tauri/Cargo.toml` `version` to `1.7.0`.
- [ ] **Step 58** — Update root `README.md` — add "Development" section explaining `apps/web/` (Tauri desktop) and `apps/mobile/` (Expo, in development), point to `cd apps/web && pnpm tauri dev` and `cd apps/mobile && pnpm start`.
- [ ] **Step 59** — Write `apps/web/README.md` — minimal: prereqs, install, dev, build commands.
- [ ] **Step 60** — Commit: `chore: bump version to 1.7.0, update READMEs`.

### Phase 9 — Mobile smoke test

- [ ] **Step 61** — From repo root: `cd apps && pnpm create expo-app mobile --template blank-typescript`. (Alternatively `npx create-expo-app@latest mobile --template`.)
- [ ] **Step 62** — Rename `apps/mobile/package.json` `name` to `@opengnothia/mobile`. Set `version` to `0.1.0`. Mark `"private": true`.
- [ ] **Step 63** — Add `@opengnothia/shared: "workspace:*"` to `apps/mobile/package.json` dependencies. Run `pnpm install` from root.
- [ ] **Step 64** — Configure Metro for monorepo. Create/edit `apps/mobile/metro.config.js`:
    ```js
    const { getDefaultConfig } = require("expo/metro-config");
    const path = require("path");
    const config = getDefaultConfig(__dirname);
    config.watchFolders = [path.resolve(__dirname, "../..")];
    config.resolver.nodeModulesPaths = [
      path.resolve(__dirname, "node_modules"),
      path.resolve(__dirname, "../../node_modules"),
    ];
    config.resolver.disableHierarchicalLookup = true;
    module.exports = config;
    ```
- [ ] **Step 65** — Install `expo-sqlite`: `cd apps/mobile && npx expo install expo-sqlite`.
- [ ] **Step 66** — Write `apps/mobile/src/adapters/expoSqliteAdapter.ts`:
    ```ts
    import * as SQLite from "expo-sqlite";
    import type { DatabasePort } from "@opengnothia/shared/db/port";
    export function createExpoSqliteAdapter(db: SQLite.SQLiteDatabase): DatabasePort {
      return {
        select: <T>(sql: string, params?: unknown[]) =>
          db.getAllAsync<T>(sql, params ?? []) as Promise<T[]>,
        execute: async (sql, params) => {
          const r = await db.runAsync(sql, params ?? []);
          return { lastInsertId: r.lastInsertRowId, rowsAffected: r.changes };
        },
      };
    }
    ```
- [ ] **Step 67** — Decide migration bundling for mobile (see Open Questions). For the smoke test only, hardcode 1-2 migrations inline in `App.tsx` or skip migrations entirely and run a query against an empty DB.
- [ ] **Step 68** — Write `apps/mobile/App.tsx`:
    - Open `expo-sqlite` DB.
    - Wrap in adapter.
    - Run migrations (or skip for smoke test — see Step 67).
    - Call `createQueries(adapter).getCheckInCount()` (or any simple query).
    - Render the result in a `<Text>`.
- [ ] **Step 69** — Run on simulator: `cd apps/mobile && pnpm start`. Open iOS simulator or Expo Go on device.
- [ ] **Step 70 — 🧪 Mobile smoke-test checklist:**
    - [ ] Metro bundler starts without resolution errors
    - [ ] iOS sim or Expo Go connects
    - [ ] `@opengnothia/shared` import resolves (no red error screen)
    - [ ] expo-sqlite adapter constructs without error
    - [ ] Shared query returns a value (likely `0`)
    - [ ] Value renders on screen
    - [ ] No `crypto.randomUUID` or similar polyfill errors in Metro logs
- [ ] **Step 71** — Write minimal `apps/mobile/README.md`.
- [ ] **Step 72** — Commit: `feat(mobile): scaffold Expo app, validate shared package via smoke test`.

### Phase 10 — Final verification & PR

- [ ] **Step 73 — 🧪 Run [Full UI Regression Checklist](#full-ui-regression-checklist) one more time on a clean install.** Wipe `node_modules/`, run `pnpm install` from root, `pnpm dev:web`, and walk every page once more.
- [ ] **Step 74** — Re-run mobile smoke test (Phase 9 checklist).
- [ ] **Step 75** — Push the branch: `git push -u origin restructure/monorepo`.
- [ ] **Step 76** — Open PR titled `Restructure: pnpm monorepo with apps/web + apps/mobile + packages/shared`. PR body summarizes the phases, links to this plan, lists what to test post-merge.
- [ ] **Step 77** — After merge, cut release tag `v1.7.0` from master to publish desktop installers via the updated workflow.

---

## Full UI Regression Checklist

Run this after Phase 2 (Step 16), Phase 4 (Step 34), Phase 5 (Step 44), Phase 6 (Step 49), and Phase 10 (Step 73). Every page must open without console errors, and the listed primary flow must work.

Use this template for each pass — copy it under the phase note in your tracking doc, or re-tick here. Each tick = "I personally opened this page in a built dev app and the listed flow succeeded."

### Onboarding & Auth
- [ ] **LockScreen** (if `lockEnabled === true`) — password prompt appears at app start, accepts correct password, rejects wrong one, biometric fallback works on macOS
- [ ] **OnboardingPage** — full first-launch flow:
  - [ ] WelcomeStep renders
  - [ ] LanguageStep — switch TR/EN, UI relabels
  - [ ] SchoolSelectionStep — pick a school
  - [ ] InterviewStep — AI conversation completes, intake captured
  - [ ] ApiSetupStep — set provider, paste API key, test key succeeds
  - [ ] SecuritySetupStep — set password (optional), confirm
  - [ ] ReadyStep — proceeds to Dashboard

### Core Pages
- [ ] **DashboardPage** — opens, shows:
  - [ ] MoodChart renders (with or without data)
  - [ ] TodaySessionHero renders, "start session" CTA wired
  - [ ] RitualCard renders
  - [ ] SpendingChart + SpendingStrip render
  - [ ] MoodPickerScale modal — pick a mood, persists, chart updates
- [ ] **SessionPage** — start a session end-to-end:
  - [ ] Mood-before prompt accepts a value
  - [ ] ChatContainer renders, ChatInput accepts text
  - [ ] Send message — assistant streams response (text appears progressively)
  - [ ] Thinking indicator works (if enabled in settings)
  - [ ] SessionTimer counts down
  - [ ] ContextUsageIndicator updates with token count
  - [ ] IntakeFormCTA appears if no intake; IntakeFormModal saves
  - [ ] SessionInsightsPanel — extract insights, save to group
  - [ ] SessionControlsBar end-of-session — mood-after, summary streams, narrative renders
  - [ ] SessionEndPrompt → SessionEndSummary flow
  - [ ] VoiceConversationView (if voice mode) — recording, transcription, TTS playback
  - [ ] PastSessionsList renders prior sessions; PastSessionDetail opens
- [ ] **JournalPage** — list renders, create a new entry, edit it, delete it, AI analysis (if triggered) returns
- [ ] **DreamsPage** — list renders, create a dream (with date), AI dream analysis triggers if wired
- [ ] **AnalysesPage** — weekly summaries list renders; milestone analyses render if any
- [ ] **InsightsPage** — InsightGroups render; create new group; reassign insights; InlineCreateGroupForm + InlineGroupPicker work
- [ ] **CoursesPage** — course list renders; open a course; step progress saves; course notes editor saves
- [ ] **SchoolsPage** — built-in schools render; custom school can be added and selected
- [ ] **ToolsPage** — tools list renders; BreathingExercise opens via BreathingSetup, runs through cycles
- [ ] **ExpensesPage** — token usage history renders; total cost calculates correctly
- [ ] **ProgramsPage** — opens (likely placeholder content but should not crash)

### Settings & Data
- [ ] **SettingsPage** — every section works:
  - [ ] Language switch — UI updates immediately
  - [ ] Provider switch — model dropdown updates, API key field for that provider persists
  - [ ] API key test — succeeds with valid key
  - [ ] Thinking toggle + level + type — saves
  - [ ] Memory model settings — save
  - [ ] TTS model + voice — save; preview if available
  - [ ] Transcript API key — save
  - [ ] Password lock — enable/disable, change password, password hint
  - [ ] Biometric toggle (macOS) — enable/disable
  - [ ] Preferred session time + duration — save
  - [ ] Therapy school selection — save
  - [ ] Approach selection — save
  - [ ] Custom prompts override — save
  - [ ] **Export data** — opens save dialog, writes JSON file, includes all 16 tables + settings
  - [ ] **Import data** — opens open dialog, restores JSON, schema matches
  - [ ] **Clear all data** — confirmation modal, wipes DB

### UI Primitives Sanity (look for visual regressions)
- [ ] Buttons, Inputs, Selects, Sliders, Toggles, Tabs all render correctly across pages
- [ ] Toasts appear on save actions
- [ ] ErrorModal appears on AI errors
- [ ] Sidebar navigation works between every page; active state correct
- [ ] Theme toggle (system/light/dark) applies across all pages

---

## Open Questions

1. **Web package name: `opengnothia` or `@opengnothia/web`?** This plan assumes `@opengnothia/web` for scope-naming consistency with `@opengnothia/shared` and `@opengnothia/mobile`. But `opengnothia` is the existing crate name (`src-tauri/Cargo.toml`) and the app identifier (`com.opengnothia.app`). Renaming the npm package shouldn't affect Tauri internals but check Tauri's tooling assumptions. Decide before Phase 2.

2. **Stale `courses` branch.** Confirm with the user whether `origin/courses` has been merged into master or is abandoned. If unmerged work matters, rebase considerations apply after restructure.

3. **Migration bundling on mobile.** Mobile needs the 17 `.sql` files as strings. Three options:
   - (a) Hand-author a TS array in `packages/shared/src/migrations/index.ts` parallel to the `.sql` files (manual sync — bad).
   - (b) Metro asset/raw-text plugin (e.g., `metro-react-native-babel-preset` with a custom transformer for `.sql`).
   - (c) Build-time codegen: a tiny script reads `packages/shared/migrations/*.sql` and emits `packages/shared/src/migrations/generated.ts` with `export const MIGRATIONS = [...]`. Run as a pre-build step in `apps/mobile/package.json`. **Recommendation: (c) — clean, no Metro hacks, single source of truth.** Decide and implement in Phase 9.
   - For the smoke test itself, hardcoding 1-2 migration entries inline in `App.tsx` is acceptable.

4. **`crypto.randomUUID()` and Web Crypto on mobile.** Several shared modules (or stores that import from shared) use `crypto.randomUUID()`. New Expo SDKs ship with this on Hermes. If smoke test reveals a runtime error, install `react-native-get-random-values` polyfill or `expo-crypto`. Defer until smoke test exposes it.

5. **`DatabasePort.execute` return shape.** Tauri's `db.execute` returns `{ lastInsertId, rowsAffected }`. expo-sqlite's `runAsync` returns `{ lastInsertRowId, changes }`. The plan normalizes to `{ lastInsertId, rowsAffected }`. Confirm no shared query relies on additional fields (Tauri may return more — check `node_modules/@tauri-apps/plugin-sql/dist/index.d.ts`).

6. **`tauri.conf.json` `$schema` path after move.** Currently `"../node_modules/@tauri-apps/cli/config.schema.json"`. After move it's still relative to `apps/web/src-tauri/` so it points at `apps/web/node_modules/...`. With pnpm workspaces, packages get hoisted to root `node_modules` but pnpm also creates per-package `node_modules/` symlinks. Verify the schema is reachable; if not, adjust to `../../../node_modules/...` or remove the `$schema` line (it's only for editor hints).

## Out of Scope

- **Building actual mobile features/UI.** The smoke test is the end of this plan. All real mobile work — UI, navigation, screens for sessions/journal/dreams/courses — is a follow-up effort planned separately.
- **Cloud sync between desktop and mobile.** Explicitly ruled out by Decision D1. Each platform has its own local DB.
- **E2E encryption / backend / API.** Not introduced; the privacy story stays local-first.
- **Drizzle / ORM adoption.** Considered and rejected for now (Decision D2). Port + adapter is the staging ground; ORM could be retrofitted later behind the same port.
- **Cross-platform settings storage abstraction.** Each app has its own (`lib/store.ts` for web with Tauri store; AsyncStorage for mobile when it gets built). No `SettingsPort`.
- **Cross-platform file export/import abstraction.** Each app has its own (`dataPortService.ts` for web with Tauri fs/dialog; expo-file-system + expo-document-picker for mobile when it gets built). No `FilePort`.
- **Cross-platform password hashing abstraction.** Each app has its own `lib/security.ts` (Web Crypto for web; expo-crypto or similar for mobile when it gets built).
- **Turborepo / Nx / build caching.** Decision D5. Defer until pnpm-only setup feels slow.
- **Splitting Zustand stores into UI vs domain.** Decision D3 defers this; it happens organically when mobile features get built and a store wants to be shared.
- **Renaming the app or repo.** Out of scope.
- **Internationalization beyond what already exists.** Mobile reuses `@opengnothia/shared/i18n` as-is.
