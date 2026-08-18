import { Hono } from "hono";
import { OPENAI_BASE_URL, type AppEnv } from "../env";
import { openaiError, upstreamResponse } from "../errors";
import { requireSubscription } from "../middleware/auth";
import { enforceLimits } from "../middleware/limits";

const MAX_BODY_BYTES = 1024 * 1024;

export const tts = new Hono<AppEnv>();

// Only `input` and `response_format` survive; `model` and `voice` are server
// constants (D15). The audio bytes stream back untouched.
tts.post("/", requireSubscription, enforceLimits("tts", MAX_BODY_BYTES), async (c) => {
  const raw = await c.req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return openaiError(c, 413, "Request body may not exceed 1 MB.", "invalid_request_error", "payload_too_large");
  }
  let clientBody: Record<string, unknown>;
  try {
    clientBody = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return openaiError(c, 400, "Request body must be valid JSON.", "invalid_request_error", "invalid_json");
  }
  const input = clientBody.input;
  if (typeof input !== "string" || input.length === 0) {
    return openaiError(c, 400, "`input` must be a non-empty string.", "invalid_request_error", "invalid_input");
  }

  const body: Record<string, unknown> = {
    model: c.env.TTS_MODEL,
    voice: c.env.TTS_VOICE,
    input,
  };
  if (typeof clientBody.response_format === "string") {
    body.response_format = clientBody.response_format;
  }

  const upstream = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return upstreamResponse(c, upstream);
});
