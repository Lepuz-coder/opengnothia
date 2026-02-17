import type { Translations } from "@/i18n";
import type { AIProvider } from "@/types";

export interface ErrorDisplayInfo {
  title: string;
  message: string;
  showSettingsLink: boolean;
}

export function getErrorDisplayInfo(
  t: Translations,
  statusCode: number | undefined,
  provider: AIProvider,
): ErrorDisplayInfo {
  if (statusCode === undefined) {
    return {
      title: t.errors.unknownStatusTitle,
      message: t.errors.unknownStatusMessage,
      showSettingsLink: false,
    };
  }

  switch (statusCode) {
    case 401:
      return {
        title: t.errors.status401Title,
        message: provider === "anthropic" ? t.errors.status401Anthropic : t.errors.status401OpenAI,
        showSettingsLink: true,
      };
    case 403:
      return {
        title: t.errors.status403Title,
        message: provider === "anthropic" ? t.errors.status403Anthropic : t.errors.status403OpenAI,
        showSettingsLink: true,
      };
    case 404:
      return {
        title: t.errors.status404Title,
        message: provider === "anthropic" ? t.errors.status404Anthropic : t.errors.status404OpenAI,
        showSettingsLink: true,
      };
    case 429:
      return {
        title: t.errors.status429Title,
        message: provider === "anthropic" ? t.errors.status429Anthropic : t.errors.status429OpenAI,
        showSettingsLink: false,
      };
    case 500:
      return {
        title: t.errors.status500Title,
        message: provider === "anthropic" ? t.errors.status500Anthropic : t.errors.status500OpenAI,
        showSettingsLink: false,
      };
    case 502:
      return {
        title: t.errors.status502Title,
        message: t.errors.status502Message,
        showSettingsLink: false,
      };
    case 503:
      return {
        title: t.errors.status503Title,
        message: t.errors.status503Message,
        showSettingsLink: false,
      };
    case 529:
      return {
        title: t.errors.status529Title,
        message: t.errors.status529Message,
        showSettingsLink: false,
      };
    default:
      return {
        title: t.errors.unknownStatusTitle,
        message: t.errors.unknownStatusMessage,
        showSettingsLink: false,
      };
  }
}
