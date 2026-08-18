import { Hono } from "hono";
import { OPENAI_BASE_URL, type AppEnv } from "../env";
import { openaiError, upstreamResponse } from "../errors";
import { requireSubscription } from "../middleware/auth";
import { enforceLimits } from "../middleware/limits";

const MAX_BODY_BYTES = 1024 * 1024;

function firstPositiveInteger(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }
  }
  return undefined;
}

export const chat = new Hono<AppEnv>();

// D15: the request body is rebuilt from an allowlist, never forwarded as-is.
// Client-sent model/reasoning/thinking/temperature fields are silently replaced
// by the server constants, so a model change never needs an app update; the
// client's max token request survives but is capped.
chat.post("/", requireSubscription, enforceLimits("chat", MAX_BODY_BYTES), async (c) => {
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
  if (!Array.isArray(clientBody.messages)) {
    return openaiError(c, 400, "`messages` must be an array.", "invalid_request_error", "invalid_messages");
  }

  const cap = Number(c.env.CHAT_MAX_COMPLETION_TOKENS);
  const requested = firstPositiveInteger(
    clientBody.max_completion_tokens,
    clientBody.max_tokens,
    clientBody.max_output_tokens,
  );
  const body: Record<string, unknown> = {
    model: c.env.CHAT_MODEL,
    messages: clientBody.messages,
    max_completion_tokens: requested === undefined ? cap : Math.min(requested, cap),
  };
  if (c.env.CHAT_REASONING_EFFORT) {
    body.reasoning_effort = c.env.CHAT_REASONING_EFFORT;
  }
  if (clientBody.stream === true) {
    body.stream = true;
    body.stream_options = { include_usage: true };
  }

  const upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return upstreamResponse(c, upstream);
});
