# OpenGnothia Desktop

The Tauri 2 + React 19 desktop app. Part of the OpenGnothia pnpm monorepo — see the [root README](../../README.md) for the product overview.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

## Install

Run at the repository root (installs every workspace package):

```bash
pnpm install
```

## Develop

```bash
# from this directory
pnpm tauri dev

# or from the repository root
pnpm dev:desktop
```

`pnpm dev` (or `pnpm dev:desktop:vite` from the root) runs the Vite dev server alone, without the Tauri shell — native APIs (SQLite, settings store, file dialogs) are unavailable there.

## Build

```bash
# from this directory
pnpm tauri build

# or from the repository root
pnpm build:desktop:tauri
```

Bundles land in `src-tauri/target/release/bundle/`.

## Notes

- Platform-agnostic code (database queries, AI services, i18n, types) comes from [`@opengnothia/shared`](../../packages/shared); the SQLite migrations in `packages/shared/migrations/` are embedded into the Rust binary at compile time via `include_str!` in [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs).
- Releases are cut by [`.github/workflows/release.yml`](../../.github/workflows/release.yml) on `v*` tag pushes. `scripts/` holds the local signed-build helpers (Developer ID, Mac App Store).
