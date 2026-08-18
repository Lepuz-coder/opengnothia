import * as Crypto from "expo-crypto";

// Hermes ships no Web Crypto, but shared/db/queries.ts mints every row id
// with crypto.randomUUID() — fine inside desktop's WebView. Faz 1 never hit
// this because the smoke screen only ran SELECTs; the Defter create flows are
// the first inserts on this platform.
const g = globalThis as { crypto?: { randomUUID?: () => string } };
if (!g.crypto) g.crypto = {};
if (typeof g.crypto.randomUUID !== "function") {
  g.crypto.randomUUID = () => Crypto.randomUUID();
}
