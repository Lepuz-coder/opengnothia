import { Hono } from "hono";
import { OPENAI_BASE_URL, type AppEnv } from "../env";
import { openaiError, upstreamResponse } from "../errors";
import { requireSubscription } from "../middleware/auth";
import { enforceLimits } from "../middleware/limits";

const MAX_BODY_BYTES = 25 * 1024 * 1024;

export const transcription = new Hono<AppEnv>();

// Multipart passthrough: only `file` and `language` survive; `model` is the
// server constant (D15).
transcription.post("/", requireSubscription, enforceLimits("transcription", MAX_BODY_BYTES), async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return openaiError(c, 400, "Request body must be multipart/form-data.", "invalid_request_error", "invalid_multipart");
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return openaiError(c, 400, "`file` is required.", "invalid_request_error", "invalid_file");
  }
  if (file.size > MAX_BODY_BYTES) {
    return openaiError(c, 413, "Audio file may not exceed 25 MB.", "invalid_request_error", "payload_too_large");
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name || "audio.wav");
  upstreamForm.append("model", c.env.STT_MODEL);
  const language = form.get("language");
  if (typeof language === "string" && language) {
    upstreamForm.append("language", language);
  }

  const upstream = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.env.OPENAI_API_KEY}` },
    body: upstreamForm,
  });
  return upstreamResponse(c, upstream);
});
