# Phase 1 — Move web code into `apps/web/` (atomic)

## Context

`docs/plans/monorepo-restructure.md` describes a 10-phase migration from a single-package Tauri/Vite app into a pnpm monorepo (`apps/web` + `apps/mobile` + `packages/shared`). Phase 0 (pre-flight, branch, stale-branch cleanup) is already complete on `restructure/monorepo` at commit `9189cfc`. This run executes **Phase 1 only**: the atomic move of every web-related root file/folder into `apps/web/` so the Tauri desktop app continues to build and launch identically from its new home. Workspace setup, the shared package, queries refactor, migrations move, CI updates, and the Expo smoke test all come in later phases.

## Pre-flight (already verified, read-only)

- Branch is `restructure/monorepo` at `9189cfc docs: mark phase 0 complete`.
- Working tree is clean. Only untracked items are `.claude/plans/*` (stay put, not part of this commit).
- `apps/` and `packages/` do not yet exist — nothing is half-moved.
- All MOVE-list items present at root; nothing extra to surprise us. Top-level inventory: `src/`, `src-tauri/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `package.json`, `assets/`, `node_modules/`, `pnpm-lock.yaml`, `package-lock.json`, `dist/`, `README.md`, `LICENSE`, `.gitignore`, `.github/`, `.claude/`, `docs/`, `.git/`.
- No husky/lefthook hooks; `.git/hooks/` only has `.sample` files. `git mv` will not trip a pre-commit.

### Verified path assumptions (no edits needed to internal paths)

- [vite.config.ts:12](vite.config.ts:12) uses `path.resolve(__dirname, "./src")` — `__dirname` becomes `apps/web/` after the move, alias still points at `apps/web/src/` ✓
- [index.html:11](index.html:11) uses `<script src="/src/main.tsx">` — Vite resolves this relative to the project root (the directory containing `index.html`), so it follows the move ✓
- [src-tauri/tauri.conf.json:7](src-tauri/tauri.conf.json:7) `frontendDist: "../dist"` resolves to `apps/web/dist` after the move ✓ (plan Step 7 confirms)
- [src-tauri/tauri.conf.json:2](src-tauri/tauri.conf.json:2) `$schema: "../node_modules/..."` resolves to `apps/web/node_modules/...` once `pnpm install` runs inside `apps/web/` ✓
- [src-tauri/tauri.conf.json:9](src-tauri/tauri.conf.json:9) `beforeDevCommand: "pnpm dev"` — Tauri runs this from the parent of `src-tauri/` (i.e. `apps/web/`), which contains the moved `package.json` with `"dev": "vite"` ✓
- [tsconfig.json](tsconfig.json) `baseUrl: "."`, `paths: { "@/*": ["src/*"] }`, `references: [{ "path": "./tsconfig.node.json" }]` — all relative, all move together ✓
- [.gitignore](.gitignore) patterns are unanchored (`node_modules/`, `dist/`, `src-tauri/target/`, `tsconfig.node.tsbuildinfo`) — they still match inside `apps/web/` post-move ✓
- 17 `include_str!("../migrations/NNN_*.sql")` calls in `src-tauri/src/lib.rs` are UNCHANGED in Phase 1 — `src-tauri/` and `migrations/` move together, so `../migrations/...` keeps resolving. Phase 6 is what updates these paths.

## Decisions (confirmed with user)

1. **`docs/` stays at root.** Project-wide documentation (including this restructure plan itself); not web-specific. Not touched by Phase 1.
2. **Verification split.** I run `pnpm install`, `pnpm build` (tsc + Vite), and `cargo check` to catch path/typecheck/Rust issues. User runs `pnpm tauri dev` interactively to confirm Dashboard + Settings render.
3. **Single commit.** Move + checkbox tick in one commit: `feat(monorepo): move web code into apps/web`.

## What moves vs. stays

**MOVE (root → `apps/web/`) via `git mv`** — 8 entries:

| From | To |
|---|---|
| `src/` | `apps/web/src/` |
| `src-tauri/` (including ignored `target/`) | `apps/web/src-tauri/` |
| `index.html` | `apps/web/index.html` |
| `vite.config.ts` | `apps/web/vite.config.ts` |
| `tsconfig.json` | `apps/web/tsconfig.json` |
| `tsconfig.node.json` | `apps/web/tsconfig.node.json` |
| `package.json` | `apps/web/package.json` |
| `assets/` (screenshots) | `apps/web/assets/` |

`git mv` on a directory physically moves all contents, including untracked/ignored files like `src-tauri/target/` (Rust build cache preserved).

**STAY at root**: `node_modules/`, `pnpm-lock.yaml`, `package-lock.json`, `dist/` (gitignored, will go stale and recreated as `apps/web/dist/` by the build — harmless), `README.md`, `LICENSE`, `.gitignore`, `.github/`, `.claude/`, `docs/`, `.git/`.

## Execution steps

1. **Create target directory.**
   ```bash
   mkdir -p apps/web
   ```
   Do not create `apps/mobile/` or `packages/shared/` yet — later phases own those.

2. **`git mv` each item individually** (so a single failure is isolated and re-runnable):
   ```bash
   git mv src                 apps/web/src
   git mv src-tauri           apps/web/src-tauri
   git mv index.html          apps/web/index.html
   git mv vite.config.ts      apps/web/vite.config.ts
   git mv tsconfig.json       apps/web/tsconfig.json
   git mv tsconfig.node.json  apps/web/tsconfig.node.json
   git mv package.json        apps/web/package.json
   git mv assets              apps/web/assets
   ```

3. **Sanity check the layout.**
   ```bash
   ls apps/web
   git status --short
   ```
   Expect: all 8 entries inside `apps/web/`; root contains only the STAY list; no content changes (only renames in `git status`).

4. **Install + Vite/TS build (I run).**
   ```bash
   cd apps/web && pnpm install
   pnpm build           # tsc -b then vite build → apps/web/dist/
   ```
   This may create `apps/web/pnpm-lock.yaml` alongside the root one. That's expected — Phase 2 (Step 11 of the source plan) consolidates lockfiles when the workspace config is added. Don't pre-empt.

5. **Rust compile check (I run).**
   ```bash
   cd apps/web/src-tauri && cargo check
   ```
   Confirms `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, and the 17 `include_str!` migration paths still resolve from the new location. We are NOT running full `cargo build` / `pnpm tauri build` — too slow, and not needed for the move verification.

6. **Interactive smoke (USER runs).**
   ```bash
   cd apps/web && pnpm tauri dev
   ```
   Confirm: app window opens, Dashboard renders, Settings page opens. Per the source plan, full UI regression is deferred to Phase 2.

7. **Mark Phase 1 complete in the source plan.** Tick the Phase 1 box in [docs/plans/monorepo-restructure.md:13](docs/plans/monorepo-restructure.md:13) and individual step boxes in lines 230–235. Append a short Phase 1 note (mirror of the Phase 0 note on line 226) describing what was moved, the verification done, and any deviations.

8. **Single commit.**
   ```bash
   git add -A
   git commit -m "feat(monorepo): move web code into apps/web"
   ```
   The `-A` is intentional: it picks up the renames AND the plan-file edit. We will NOT include untracked `.claude/plans/*` files (they remain untracked).

## Critical files

- [docs/plans/monorepo-restructure.md](docs/plans/monorepo-restructure.md) — source plan; Phase 1 checkbox + step checkboxes get ticked, Phase 1 note appended at the end of the Phase 1 block.
- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) — verified, no edits.
- [vite.config.ts](vite.config.ts) — verified, no edits.
- [tsconfig.json](tsconfig.json) — verified, no edits (Phase 3 adds a root orchestrator tsconfig; this one becomes `apps/web/tsconfig.json` unchanged).
- [package.json](package.json) — verified, no edits (Phase 2 may rename to `@opengnothia/web`; not in this phase).
- [index.html](index.html) — verified, no edits.

## Verification end-to-end

After step 5, I will report:
- `apps/web/` contents = the 8 moved items.
- `pnpm install` exit code = 0; print final dependency count.
- `pnpm build` exit code = 0; `apps/web/dist/index.html` exists.
- `cargo check` exit code = 0.

After step 6, the user reports interactively whether Dashboard + Settings open without console errors. If they do, step 7 (plan tick) + step 8 (commit) proceed. If they don't, we stop and diagnose before committing.

## Rollback

Pre-Phase-1 state is `HEAD` (commit `9189cfc`). If anything fails before the commit:
```bash
git restore --source=HEAD --staged --worktree .
# remove the empty apps/web directory if it was created
[ -d apps/web ] && rmdir apps/web 2>/dev/null || true
[ -d apps ] && rmdir apps 2>/dev/null || true
```
`pnpm install` and `pnpm build` only write into `apps/web/` (gitignored `node_modules/`, `dist/`) and possibly create `apps/web/pnpm-lock.yaml` — these are easy to clean.

After the commit, rollback is `git reset --hard 9189cfc` (only if user explicitly approves).

## Out of scope (handled by later phases)

- Root `package.json`, `pnpm-workspace.yaml`, root orchestrator `tsconfig.json` — Phase 2.
- Renaming `apps/web/package.json` name to `@opengnothia/web` — deferred (Phase 2 open question).
- Consolidating duplicate `pnpm-lock.yaml` — Phase 2 Step 11.
- Deleting root `package-lock.json` — Phase 2 Step 11.
- `packages/shared` scaffold and module extraction — Phases 3–4.
- `DatabasePort`, queries, Tauri adapter — Phase 5.
- Migrations move and `include_str!` path rewrites — Phase 6.
- `release.yml` workflow path updates — Phase 7.
- Version bump to 1.7.0 — Phase 8.
- Expo mobile smoke test — Phase 9.
- Final UI regression checklist — Phase 10 (and partial earlier passes).
