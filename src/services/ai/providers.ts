import type { AIProvider, ChatMessage, ThinkingLevel } from "@/types";

interface SendMessageParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
}

interface StreamRequestParams extends SendMessageParams {
  thinkingEnabled: boolean;
  thinkingLevel?: ThinkingLevel;
}

const THINKING_BUDGETS: Record<ThinkingLevel, { budget_tokens: number; max_tokens: number }> = {
  low: { budget_tokens: 5000, max_tokens: 16000 },
  medium: { budget_tokens: 10000, max_tokens: 16000 },
  high: { budget_tokens: 25000, max_tokens: 32000 },
  max: { budget_tokens: 50000, max_tokens: 64000 },
};

export type StreamChunk =
  | { type: "thinking"; content: string }
  | { type: "text"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

interface ProviderAdapter {
  formatRequest(params: SendMessageParams): { url: string; init: RequestInit };
  parseResponse(data: unknown): string;
  formatStreamRequest(params: StreamRequestParams): { url: string; init: RequestInit };
  parseSSEEvent(eventType: string, data: string): StreamChunk | null;
}

function isOSeriesModel(model: string): boolean {
  return /^o\d/.test(model);
}

const openaiAdapter: ProviderAdapter = {
  formatRequest({ apiKey, model, messages, systemPrompt, customBaseUrl, provider }) {
    const baseUrl = customBaseUrl || "https://api.openai.com/v1";
    const isO = isOSeriesModel(model);
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };
    if (!isO) {
      body.temperature = 0.7;
    }
    body.max_completion_tokens = 1024;
    return {
      url: `${baseUrl}/chat/completions`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
    };
  },
  parseResponse(data: unknown): string {
    const d = data as { choices: { message: { content: string } }[] };
    return d.choices[0]?.message?.content ?? "";
  },
  formatStreamRequest({ apiKey, model, messages, systemPrompt, customBaseUrl, provider }) {
    const baseUrl = customBaseUrl || "https://api.openai.com/v1";
    const isO = isOSeriesModel(model);
    const body: Record<string, unknown> = {
      model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };
    if (!isO) {
      body.temperature = 0.7;
    }
    body.max_completion_tokens = 1024;
    return {
      url: `${baseUrl}/chat/completions`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
    };
  },
  parseSSEEvent(_eventType: string, data: string): StreamChunk | null {
    if (data === "[DONE]") return { type: "done" };
    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) return null;
      if (delta.reasoning_content) {
        return { type: "thinking", content: delta.reasoning_content };
      }
      if (delta.content) {
        return { type: "text", content: delta.content };
      }
      return null;
    } catch {
      return null;
    }
  },
};

const anthropicAdapter: ProviderAdapter = {
  formatRequest({ apiKey, model, messages, systemPrompt }) {
    return {
      url: "https://api.anthropic.com/v1/messages",
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 1024,
        }),
      },
    };
  },
  parseResponse(data: unknown): string {
    const d = data as { content: { type: string; text: string }[] };
    return d.content.find((c) => c.type === "text")?.text ?? "";
  },
  formatStreamRequest({ apiKey, model, messages, systemPrompt, thinkingEnabled, thinkingLevel }) {
    const body: Record<string, unknown> = {
      model,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (thinkingEnabled) {
      const budget = THINKING_BUDGETS[thinkingLevel ?? "medium"];
      body.thinking = { type: "enabled", budget_tokens: budget.budget_tokens };
      body.max_tokens = budget.max_tokens;
      // temperature must NOT be sent when thinking is enabled
    } else {
      body.max_tokens = 1024;
    }
    return {
      url: "https://api.anthropic.com/v1/messages",
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      },
    };
  },
  parseSSEEvent(eventType: string, data: string): StreamChunk | null {
    if (eventType === "message_stop") return { type: "done" };
    if (eventType === "content_block_delta") {
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.delta;
        if (!delta) return null;
        if (delta.type === "thinking_delta" && delta.thinking) {
          return { type: "thinking", content: delta.thinking };
        }
        if (delta.type === "text_delta" && delta.text) {
          return { type: "text", content: delta.text };
        }
        return null;
      } catch {
        return null;
      }
    }
    if (eventType === "error") {
      try {
        const parsed = JSON.parse(data);
        return { type: "error", message: parsed.error?.message ?? "Stream error" };
      } catch {
        return { type: "error", message: "Stream error" };
      }
    }
    return null;
  },
};

const adapters: Record<AIProvider, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
};

export function getAdapter(provider: AIProvider): ProviderAdapter {
  return adapters[provider] ?? openaiAdapter;
}
