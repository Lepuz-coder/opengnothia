import { createMiddleware } from "hono/factory";
import type { AppEnv, Bindings } from "../env";
import { openaiError } from "../errors";

export type Endpoint = "chat" | "transcription" | "tts";

// Counters are date-scoped; the TTL only needs to outlive the key's own day.
const COUNTER_TTL_SECONDS = 2 * 24 * 60 * 60;

function dailyLimit(env: Bindings, endpoint: Endpoint): number {
  switch (endpoint) {
    case "chat":
      return Number(env.DAILY_CHAT_LIMIT);
    case "transcription":
      return Number(env.DAILY_STT_LIMIT);
    case "tts":
      return Number(env.DAILY_TTS_LIMIT);
  }
}

// Runs after requireSubscription (needs appUserId). Order: body size,
// per-minute rate limit, then the per-endpoint daily counter.
export function enforceLimits(endpoint: Endpoint, maxBodyBytes: number) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const contentLength = Number(c.req.header("Content-Length") ?? "0");
    if (contentLength > maxBodyBytes) {
      return openaiError(
        c,
        413,
        `Request body may not exceed ${Math.floor(maxBodyBytes / (1024 * 1024))} MB.`,
        "invalid_request_error",
        "payload_too_large",
      );
    }

    const appUserId = c.get("appUserId");
    const { success } = await c.env.RATE_LIMITER.limit({ key: appUserId });
    if (!success) {
      return openaiError(
        c,
        429,
        "You are sending requests too quickly. Please wait a moment and try again.",
        "rate_limit_error",
        "quota_exceeded",
      );
    }

    const day = new Date().toISOString().slice(0, 10);
    const counterKey = `quota:${endpoint}:${day}:${appUserId}`;
    // KV get+put is not atomic and allows ~1 write/s per key, so racing
    // requests can undercount or make the put throw. Counting failures must
    // not fail the request — fail open; the caps are generous (D16) and the
    // per-minute limiter above bounds the race.
    try {
      const used = Number((await c.env.USAGE_KV.get(counterKey)) ?? "0");
      if (used >= dailyLimit(c.env, endpoint)) {
        return openaiError(
          c,
          429,
          "You have reached today's usage limit for this feature. It resets at midnight UTC.",
          "rate_limit_error",
          "quota_exceeded",
        );
      }
      await c.env.USAGE_KV.put(counterKey, String(used + 1), { expirationTtl: COUNTER_TTL_SECONDS });
    } catch {
      console.error(`usage counter kv error: ${endpoint}`);
    }

    await next();
  });
}
