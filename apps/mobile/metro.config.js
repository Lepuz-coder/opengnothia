const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
// expo/metro-config auto-configures pnpm monorepos since SDK 52; we only pin
// the workspace root as a watch folder so edits to packages/shared rebuild.
// Do NOT set resolver.disableHierarchicalLookup here: pnpm's isolated .pnpm
// virtual store relies on upward lookup (e.g. expo → expo-modules-core), so
// disabling it breaks resolution of transitive dependencies.
config.watchFolders = [...new Set([...(config.watchFolders ?? []), path.resolve(__dirname, "../..")])];
module.exports = config;
