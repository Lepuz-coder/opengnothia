import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { openaiError } from "../errors";

// D14: cancellations may lag up to this long. Negative results cache much
// shorter so a fresh purchase unlocks within minutes, not an hour.
const ACTIVE_TTL_SECONDS = 3600;
const INACTIVE_TTL_SECONDS = 300;
const RC_TIMEOUT_MS = 10_000;

// Bearer token is a RevenueCat appUserID (e.g. "$RCAnonymousID:<hex>"), not a
// secret we issue — bound well below KV's 512-byte key limit.
const MAX_APP_USER_ID_LENGTH = 200;

interface RevenueCatSubscriber {
  subscriber?: {
    entitlements?: Record<string, { expires_date: string | null }>;
  };
}

function isEntitlementActive(data: RevenueCatSubscriber, entitlementId: string): boolean {
  const entitlement = data.subscriber?.entitlements?.[entitlementId];
  if (!entitlement) return false;
  return entitlement.expires_date === null || Date.parse(entitlement.expires_date) > Date.now();
}

export const requireSubscription = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header("Authorization") ?? "";
  const appUserId = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!appUserId || appUserId.length > MAX_APP_USER_ID_LENGTH) {
    return openaiError(
      c,
      401,
      "Provide your app user ID as a bearer token in the Authorization header.",
      "invalid_request_error",
      "invalid_identity",
    );
  }

  const cacheKey = `ent:${appUserId}`;
  // A cache read failure is just a miss — the live RevenueCat check below
  // stays authoritative, so KV trouble never loosens the gate.
  let cached: string | null = null;
  try {
    cached = await c.env.USAGE_KV.get(cacheKey);
  } catch {
    console.error("entitlement cache read error");
  }
  let active = cached === "1";

  if (cached === null) {
    // GET /subscribers/{id} creates the subscriber when unknown, so a random
    // UUID yields 200 with no entitlements → 403, never 404.
    let verified = false;
    try {
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
        {
          headers: { Authorization: `Bearer ${c.env.REVENUECAT_API_KEY}` },
          signal: AbortSignal.timeout(RC_TIMEOUT_MS),
        },
      );
      if (response.ok) {
        const data = (await response.json()) as RevenueCatSubscriber;
        active = isEntitlementActive(data, c.env.ENTITLEMENT_ID);
        verified = true;
      } else {
        console.error(`revenuecat lookup failed: ${response.status}`);
      }
    } catch {
      console.error("revenuecat lookup failed: network");
    }
    if (!verified) {
      return openaiError(
        c,
        502,
        "Subscription verification is temporarily unavailable. Please try again.",
        "api_error",
        "verification_unavailable",
      );
    }
    try {
      await c.env.USAGE_KV.put(cacheKey, active ? "1" : "0", {
        expirationTtl: active ? ACTIVE_TTL_SECONDS : INACTIVE_TTL_SECONDS,
      });
    } catch {
      console.error("entitlement cache write error");
    }
  }

  if (!active) {
    return openaiError(
      c,
      403,
      "An active subscription is required to use AI features.",
      "invalid_request_error",
      "subscription_required",
    );
  }

  c.set("appUserId", appUserId);
  await next();
});
