import { Hono } from "hono";
import type { AppEnv } from "./env";
import { openaiError } from "./errors";
import { chat } from "./routes/chat";
import { transcription } from "./routes/transcription";
import { tts } from "./routes/tts";

const app = new Hono<AppEnv>();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/v1/chat/completions", chat);
app.route("/v1/audio/transcriptions", transcription);
app.route("/v1/audio/speech", tts);

app.notFound((c) => openaiError(c, 404, "Unknown endpoint.", "invalid_request_error", "not_found"));

// D17: log the path and nothing else — no bodies, no identities.
app.onError((err, c) => {
  console.error(`unhandled ${err.name} ${new URL(c.req.url).pathname}`);
  return openaiError(c, 500, "Internal server error.", "api_error", "internal_error");
});

export default app;
