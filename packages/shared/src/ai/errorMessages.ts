import type { Translations } from "../i18n";
import type { AIProvider } from "../types";
import { AIError } from "./AIError";

export interface ErrorDisplayInfo {
  title: string;
  message: string;
  showSettingsLink: boolean;
  settingsButtonLabel?: string;
  details?: string;
}

export function buildErrorDetails(error: unknown): string | undefined {
  if (error == null) return undefined;
  const parts: string[] = [];
  if (error instanceof AIError) {
    parts.push(`Name: ${error.name}`);
    if (error.statusCode !== undefined) parts.push(`Status: ${error.statusCode}`);
    if (error.message) parts.push(`Message: ${error.message}`);
    if (error.rawBody) {
      let body = error.rawBody;
      try {
        body = JSON.stringify(JSON.parse(error.rawBody), null, 2);
      } catch {
        // keep as-is if not JSON
      }
      parts.push(`Response Body:\n${body}`);
    }
    if (error.stack) parts.push(`Stack:\n${error.stack}`);
  } else if (error instanceof Error) {
    parts.push(`Name: ${error.name}`);
    if (error.message) parts.push(`Message: ${error.message}`);
    if (error.stack) parts.push(`Stack:\n${error.stack}`);
  } else {
    try {
      parts.push(JSON.stringify(error, null, 2));
    } catch {
      parts.push(String(error));
    }
  }
  const result = parts.join("\n\n").trim();
  return result.length > 0 ? result : undefined;
}

// Error codes emitted only by our subscription-gating proxy (apps/backend).
// They reuse the 401/403/429 statuses but mean something different than the
// BYOK texts below: no API key is involved, so no settings link.
const PROXY_ERROR_CODES = ["invalid_identity", "subscription_required", "quota_exceeded"] as const;
type ProxyErrorCode = (typeof PROXY_ERROR_CODES)[number];

function extractProxyErrorCode(error: unknown): ProxyErrorCode | undefined {
  if (!(error instanceof AIError) || !error.rawBody) return undefined;
  try {
    const code = (JSON.parse(error.rawBody) as { error?: { code?: unknown } }).error?.code;
    return PROXY_ERROR_CODES.includes(code as ProxyErrorCode) ? (code as ProxyErrorCode) : undefined;
  } catch {
    return undefined;
  }
}

export function getErrorDisplayInfo(
  t: Translations,
  statusCode: number | undefined,
  provider: AIProvider,
  error?: unknown,
): ErrorDisplayInfo {
  const details = buildErrorDetails(error);
  const base = (info: Omit<ErrorDisplayInfo, "details">): ErrorDisplayInfo => ({ ...info, details });

  switch (extractProxyErrorCode(error)) {
    case "invalid_identity":
      return base({
        title: t.errors.proxyIdentityTitle,
        message: t.errors.proxyIdentityMessage,
        showSettingsLink: false,
      });
    case "subscription_required":
      return base({
        title: t.errors.proxySubscriptionTitle,
        message: t.errors.proxySubscriptionMessage,
        showSettingsLink: false,
      });
    case "quota_exceeded":
      return base({
        title: t.errors.proxyQuotaTitle,
        message: t.errors.proxyQuotaMessage,
        showSettingsLink: false,
      });
  }

  if (statusCode === undefined) {
    return base({
      title: t.errors.unknownStatusTitle,
      message: t.errors.unknownStatusMessage,
      showSettingsLink: false,
    });
  }

  switch (statusCode) {
    case 401:
      return base({
        title: t.errors.status401Title,
        message: provider === "anthropic" ? t.errors.status401Anthropic : t.errors.status401OpenAI,
        showSettingsLink: true,
      });
    case 403:
      return base({
        title: t.errors.status403Title,
        message: provider === "anthropic" ? t.errors.status403Anthropic : t.errors.status403OpenAI,
        showSettingsLink: true,
      });
    case 404:
      return base({
        title: t.errors.status404Title,
        message: provider === "anthropic" ? t.errors.status404Anthropic : t.errors.status404OpenAI,
        showSettingsLink: true,
      });
    case 429:
      return base({
        title: t.errors.status429Title,
        message: provider === "anthropic" ? t.errors.status429Anthropic : t.errors.status429OpenAI,
        showSettingsLink: false,
      });
    case 500:
      return base({
        title: t.errors.status500Title,
        message: provider === "anthropic" ? t.errors.status500Anthropic : t.errors.status500OpenAI,
        showSettingsLink: false,
      });
    case 502:
      return base({
        title: t.errors.status502Title,
        message: t.errors.status502Message,
        showSettingsLink: false,
      });
    case 503:
      return base({
        title: t.errors.status503Title,
        message: t.errors.status503Message,
        showSettingsLink: false,
      });
    case 529:
      return base({
        title: t.errors.status529Title,
        message: t.errors.status529Message,
        showSettingsLink: false,
      });
    default:
      return base({
        title: t.errors.unknownStatusTitle,
        message: t.errors.unknownStatusMessage,
        showSettingsLink: false,
      });
  }
}
