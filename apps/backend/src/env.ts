export const OPENAI_BASE_URL = "https://api.openai.com/v1";

export interface Bindings {
  USAGE_KV: KVNamespace;
  RATE_LIMITER: RateLimit;
  OPENAI_API_KEY: string;
  REVENUECAT_API_KEY: string;
  CHAT_MODEL: string;
  CHAT_REASONING_EFFORT: string;
  CHAT_MAX_COMPLETION_TOKENS: string;
  STT_MODEL: string;
  TTS_MODEL: string;
  TTS_VOICE: string;
  ENTITLEMENT_ID: string;
  DAILY_CHAT_LIMIT: string;
  DAILY_STT_LIMIT: string;
  DAILY_TTS_LIMIT: string;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    appUserId: string;
  };
};
