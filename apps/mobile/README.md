# OpenGnothia Mobile

The Expo (React Native) app. Part of the OpenGnothia pnpm monorepo — see the [root README](../../README.md) for the product overview.

Right now this is a shell, not a product: the five tabs render placeholders, and only Settings (language + theme) does anything. The design tokens, navigation, database bootstrap and UI kit underneath them are real — screens land phase by phase, tracked in [`docs/plans/mobile-app.html`](../../docs/plans/mobile-app.html).

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/)
- Xcode + CocoaPods (the app uses native modules — `react-native-purchases`, `expo-audio`, … — so **Expo Go no longer works**; a local [dev client](https://docs.expo.dev/develop/development-builds/introduction/) build is required)

## Install

Run at the repository root (installs every workspace package):

```bash
pnpm install
```

## Develop

Build and install the dev client on the iOS simulator (needed once, and again whenever a native dependency changes):

```bash
# from this directory
pnpm run:ios
```

CocoaPods requires a UTF-8 locale; if `pod install` fails with an `Encoding::CompatibilityError`, run `export LANG=en_US.UTF-8` first.

Afterwards day-to-day development only needs the Metro server:

```bash
# from this directory
pnpm start

# or from the repository root
pnpm dev:mobile
```

Then press `i` to open the installed dev client in the iOS simulator.

## Layout

| Path | What lives there |
| --- | --- |
| `app/` | Expo Router routes. `(tabs)` holds the five bottom tabs, `(onboarding)` is a skeleton for a later phase, `settings.tsx` is pushed from the Home header gear. |
| `src/db/` | Opens the database, runs the shared migrations, hands out one shared `Queries` instance. |
| `src/ui/` | NativeWind components — the RN counterparts of the desktop app's `components/ui`. |
| `src/stores/` | Zustand stores. Settings persist to AsyncStorage. |
| `src/theme/` | Colour-scheme plumbing: the `theme` setting drives NativeWind, and `colors.ts` carries the handful of values native navigators need as plain strings. |
| `src/i18n/` | Registers the app's language source with `@opengnothia/shared/i18n`. |

## Notes

- Styling is [NativeWind](https://www.nativewind.dev/) v4. The colour tokens in [`tailwind.config.js`](tailwind.config.js) are the desktop app's `styles.css` palette; the light/dark values behind them live in [`global.css`](global.css). `react-native-css-interop` is a direct dependency on purpose — Babel rewrites JSX to import its runtime, which pnpm's isolated store will not resolve through `nativewind` alone.
- [`src/adapters/expoSqliteAdapter.ts`](src/adapters/expoSqliteAdapter.ts) implements the shared `DatabasePort` on expo-sqlite: parameterized statements go through `runAsync`, statement-less scripts through `execAsync` so multi-statement migration files work.
- Migrations have a single source of truth in [`packages/shared/migrations/`](../../packages/shared/migrations). [`scripts/generate-migrations.mjs`](scripts/generate-migrations.mjs) embeds them into `src/generated/migrations.ts` (committed; regenerated automatically by `pnpm start`, or manually with `pnpm generate:migrations`). `runMigrations` tracks progress with `PRAGMA user_version` — the desktop app instead embeds the same `.sql` files into its Rust binary via `include_str!`.
- [`metro.config.js`](metro.config.js) wraps the config in `withNativeWind` and pins the workspace root as a watch folder. Hierarchical module lookup must stay enabled: pnpm's isolated `.pnpm` store resolves transitive dependencies by walking upward.
