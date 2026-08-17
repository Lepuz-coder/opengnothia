# Phase 3 — Scaffold `@opengnothia/shared` package

Source plan: [docs/plans/monorepo-restructure.md](../../docs/plans/monorepo-restructure.md) — Phase 3 (Steps 18–25).

## Context

Phases 0–2 of the monorepo restructure are complete: the working branch `restructure/monorepo` exists, all web code lives under `apps/web/`, and a pnpm workspace (`pnpm-workspace.yaml`, root `package.json` with `packageManager: pnpm@10.18.2`) is wired. The workspace currently has only one member (`apps/web`).

Phase 3 creates the empty-but-wired `@opengnothia/shared` package so that later phases can drop in types/i18n/AI/db code without re-doing plumbing. The phase produces no behavioral change in the desktop app — its success criterion is that `apps/web` can resolve `import { __sharedLoaded } from "@opengnothia/shared"` at Vite dev-time and at `tsc` build-time, after which the temporary import is removed.

## Goal

After Phase 3:
- `packages/shared/` exists with `package.json`, `tsconfig.json`, and a placeholder `src/index.ts`.
- `apps/web/package.json` lists `@opengnothia/shared: "workspace:*"` and pnpm has created the symlink at `apps/web/node_modules/@opengnothia/shared`.
- Root `tsconfig.json` exists as a solution file referencing `./packages/shared`.
- `apps/web/tsconfig.json` references `../../packages/shared`.
- Desktop app boots; Vite resolves the shared package; verification artifact is removed before commit.

## Critical files

**Create:**
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `tsconfig.json` (repo root)

**Modify:**
- `apps/web/package.json` — append `@opengnothia/shared` to `dependencies`
- `apps/web/tsconfig.json` — append `{ "path": "../../packages/shared" }` to `references`
- `apps/web/src/main.tsx` — add temporary verification import (then revert in Step 25)

**No-op (already covered):**
- `.gitignore` — existing `dist/` rule covers `packages/shared/dist/` (declaration-emit output). Existing `tsconfig.node.tsbuildinfo` rule is web-specific; we'll let TS write `packages/shared/tsconfig.tsbuildinfo` and only widen the ignore if it bleeds into the diff (see Notes).

## Resolved inconsistencies in the source plan

1. **Missing root export entry.** `docs/plans/monorepo-restructure.md` Step 18 lists subpath exports only (`./types`, `./i18n`, …) but Step 22 imports from the bare `@opengnothia/shared` specifier. Fix: add `".": "./src/index.ts"` to the exports map. The placeholder barrel doubles as the root entry; later phases can keep using granular subpaths for tree-shaking.
2. **Composite + `allowImportingTsExtensions` conflict.** Web's tsconfig sets `allowImportingTsExtensions: true`, which TypeScript rejects when paired with composite emit. Fix: omit that flag from shared's tsconfig (no shared source uses `.ts` extensions in imports).
3. **Root tsconfig references.** Plan Step 23 says "create root tsconfig with references to both packages", but `apps/web/tsconfig.json` has `noEmit: true` and is not composite, so it cannot be a project-reference target. Fix: root tsconfig references only `./packages/shared`. `apps/web` keeps typechecking itself via its own `pnpm build` script (`tsc && vite build`). When `apps/mobile` lands in Phase 9, that reference is appended.

## Step-by-step

### Step 18 — `packages/shared/package.json`

```json
{
  "name": "@opengnothia/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
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

The subpath targets (e.g. `./src/types/index.ts`) do not need to exist yet — Phase 3 only validates the root specifier. Subpath consumers come online in Phases 4–6.

### Step 19 — `packages/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "composite": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

Mirrors `apps/web/tsconfig.json` where applicable; differences:
- adds `composite`, `declaration`, `emitDeclarationOnly`, `outDir` (required by composite mode)
- drops `allowImportingTsExtensions` (incompatible with emit)
- drops `baseUrl`/`paths` (shared has no app-local alias)

Emitted `dist/` is covered by the root `.gitignore`'s blanket `dist/` rule.

### Step 20 — `packages/shared/src/index.ts`

```ts
export const __sharedLoaded = true;
```

### Step 21 — Wire shared as a workspace dependency

Edit `apps/web/package.json` `dependencies` (insert alphabetically, before `@tauri-apps/api`):

```json
"@opengnothia/shared": "workspace:*",
```

Then from repo root:

```
pnpm install
```

Expected result:
- `pnpm-lock.yaml` updates with the workspace link entry.
- `apps/web/node_modules/@opengnothia/shared` becomes a symlink into `../../../packages/shared/`. Verify with `ls -la apps/web/node_modules/@opengnothia/`.

### Step 22 — Temporary verification import in `apps/web/src/main.tsx`

Add the import block at the top of [apps/web/src/main.tsx](apps/web/src/main.tsx) (after the existing imports, before `ReactDOM.createRoot(...)`):

```ts
import { __sharedLoaded } from "@opengnothia/shared";

if (import.meta.env.DEV) {
  console.log("[shared] loaded:", __sharedLoaded);
}
```

The `import.meta.env.DEV` guard keeps the log out of production bundles (though the whole block is removed in Step 25 anyway).

### Step 23 — TypeScript project references

**Edit `apps/web/tsconfig.json`** — append the shared reference (preserve the existing node ref):

```json
"references": [
  { "path": "./tsconfig.node.json" },
  { "path": "../../packages/shared" }
]
```

**Create `tsconfig.json` at repo root:**

```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" }
  ]
}
```

`files: []` makes this a pure solution file with no compilation of its own. `tsc --build` from root will typecheck shared; `apps/web` continues to self-typecheck via its own build script.

### Step 24 — Verification (smoke only — no full UI regression at this stage)

1. From repo root:
   ```
   pnpm install
   ```
   Confirm no lockfile errors. `apps/web/node_modules/@opengnothia/shared` should resolve to a symlink.

2. Type-only check (fast):
   ```
   pnpm --filter @opengnothia/web exec tsc --noEmit
   ```
   Should complete with no errors. (Optional but high-signal.)

3. Vite dev (lightweight smoke):
   ```
   pnpm dev:web:vite
   ```
   Open the served page in the browser. In DevTools console expect: `[shared] loaded: true`. No red errors. Then Ctrl-C.

4. (Optional, higher confidence) Full Tauri smoke:
   ```
   pnpm dev:web
   ```
   Confirm the desktop window opens, Dashboard renders, no crashes. The verification log appears in the WebView's DevTools console.

5. (Optional) Build:
   ```
   pnpm build:web
   ```
   `tsc && vite build` should both succeed.

**Stop conditions:**
- If pnpm fails to symlink, inspect `pnpm-workspace.yaml` and ensure `packages/*` is listed (it is, from Phase 2).
- If TS complains about composite emit settings, double-check Step 19's tsconfig exactly.
- If Vite logs "Failed to resolve import \"@opengnothia/shared\"", the exports map's `"."` entry is missing or the package.json `"type": "module"` is missing.

### Step 25 — Remove the verification artifact & commit

Revert the changes from Step 22: delete the `import { __sharedLoaded } from "@opengnothia/shared";` line and the `if (import.meta.env.DEV) { … }` block from [apps/web/src/main.tsx](apps/web/src/main.tsx). Confirm the file is back to its original 11-line state.

`git status` should now show:

```
modified:   apps/web/package.json          # +@opengnothia/shared dep
modified:   apps/web/tsconfig.json         # +reference
modified:   pnpm-lock.yaml                 # +workspace link
new file:   packages/shared/package.json
new file:   packages/shared/tsconfig.json
new file:   packages/shared/src/index.ts
new file:   tsconfig.json                  # root solution file
```

(No diff in `apps/web/src/main.tsx`.)

Commit:
```
chore(shared): scaffold @opengnothia/shared package
```

Then tick Step 18–25 in [docs/plans/monorepo-restructure.md](../../docs/plans/monorepo-restructure.md), tick the Phase 3 checkbox at the top, and add a one-paragraph Phase 3 note with the date (`2026-05-20`), the resolved inconsistencies above, and any deviation observed during execution.

## Notes / known unknowns

- **`packages/shared/tsconfig.tsbuildinfo`.** Composite mode writes a build-info file next to the tsconfig. If it appears in `git status` after Step 24, widen `.gitignore` from `tsconfig.node.tsbuildinfo` to a broader rule (e.g. `*.tsbuildinfo` plus keep the existing line, or add `packages/shared/tsconfig.tsbuildinfo`). Decision deferred to whatever actually shows up.
- **Vite + workspace package exports.** Vite ≥4 respects `package.json` `exports` for workspace packages out of the box; no plugin needed. If a subpath import later fails, double-check the `exports` key matches the import path exactly.
- **Phase 4 follow-on.** The subpath exports declared in Step 18 (`./types`, `./i18n`, …) point at files that don't exist yet. They get populated in Phase 4 via `git mv`. This is intentional — TypeScript only complains about a missing exports target when something imports it.
