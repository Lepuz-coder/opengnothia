import type { Context } from "hono";

type ErrorStatus = 400 | 401 | 403 | 404 | 413 | 429 | 500 | 502;

// OpenAI-style error envelope so the shared client's AIError/errorMessages
// handling works unchanged (D15).
export function openaiError(
  c: Context,
  status: ErrorStatus,
  message: string,
  type: string,
  code: string,
): Response {
  return c.json({ error: { message, type, code, param: null } }, status);
}

// Streams the upstream OpenAI response back as-is (SSE, JSON or binary audio).
// Upstream 401/403 mean OUR key is broken — those bodies can echo key fragments,
// so they collapse to an opaque 502 instead of passing through.
export function upstreamResponse(c: Context, upstream: Response): Response {
  if (upstream.status === 401 || upstream.status === 403) {
    console.error(`openai auth error ${upstream.status} ${new URL(c.req.url).pathname}`);
    void upstream.body?.cancel();
    return openaiError(c, 502, "The AI service is temporarily unavailable.", "api_error", "upstream_error");
  }
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  return new Response(upstream.body, { status: upstream.status, headers });
}
