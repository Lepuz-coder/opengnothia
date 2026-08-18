# OpenGnothia Mobile

The Expo (React Native) app. Part of the OpenGnothia pnpm monorepo — see the [root README](../../README.md) for the product overview.

Right now this is a smoke-test shell, not a product: `App.tsx` opens an expo-sqlite database, wraps it in the shared `DatabasePort` adapter, runs the real shared migrations and answers a shared query on screen — proving `@opengnothia/shared` works on device. The actual mobile UI is planned separately.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/)
- [Expo Go](https://expo.dev/go) on a device, or Xcode / Android Studio for a simulator

## Install

Run at the repository root (installs every workspace package):

```bash
pnpm install
```

## Develop

```bash
# from this directory
pnpm start

# or from the repository root
pnpm dev:mobile
```

Then press `i` for the iOS simulator, `a` for Android, or scan the QR code with Expo Go.

## Notes

- [`src/adapters/expoSqliteAdapter.ts`](src/adapters/expoSqliteAdapter.ts) implements the shared `DatabasePort` on expo-sqlite: parameterized statements go through `runAsync`, statement-less scripts through `execAsync` so multi-statement migration files work.
- Migrations have a single source of truth in [`packages/shared/migrations/`](../../packages/shared/migrations). [`scripts/generate-migrations.mjs`](scripts/generate-migrations.mjs) embeds them into `src/generated/migrations.ts` (committed; regenerated automatically by `pnpm start`, or manually with `pnpm generate:migrations`). `runMigrations` tracks progress with `PRAGMA user_version` — the desktop app instead embeds the same `.sql` files into its Rust binary via `include_str!`.
- [`metro.config.js`](metro.config.js) only pins the workspace root as a watch folder. Hierarchical module lookup must stay enabled: pnpm's isolated `.pnpm` store resolves transitive dependencies by walking upward.
