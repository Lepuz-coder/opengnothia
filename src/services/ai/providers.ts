import type { AIProvider, ChatMessage, TokenUsage } from "@/types";

interface SendMessageParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
}

interface ProviderAdapter {
  formatRequest(params: SendMessageParams): { url: string; init: RequestInit };
  parseResponse(data: unknown): string;
  parseUsage(data: unknown): TokenUsage | null;
}

const openaiAdapter: ProviderAdapter = {
  formatRequest({ apiKey, model, messages, systemPrompt, customBaseUrl, provider }) {
    const baseUrl = customBaseUrl ||
      (provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");
    return {
      url: `${baseUrl}/chat/completions`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      },
    };
  },
  parseResponse(data: unknown): string {
    const d = data as { choices: { message: { content: string } }[] };
    return d.choices[0]?.message?.content ?? "";
  },
  parseUsage(data: unknown): TokenUsage | null {
    const d = data as { usage?: { prompt_tokens?: number; completion_tokens?: number } };
    if (!d.usage) return null;
    return {
      inputTokens: d.usage.prompt_tokens ?? 0,
      outputTokens: d.usage.completion_tokens ?? 0,
    };
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
  parseUsage(data: unknown): TokenUsage | null {
    const d = data as { usage?: { input_tokens?: number; output_tokens?: number } };
    if (!d.usage) return null;
    return {
      inputTokens: d.usage.input_tokens ?? 0,
      outputTokens: d.usage.output_tokens ?? 0,
    };
  },
};

const adapters: Partial<Record<AIProvider, ProviderAdapter>> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  ollama: openaiAdapter,
  openrouter: openaiAdapter,
  custom: openaiAdapter,
};

export function getAdapter(provider: AIProvider): ProviderAdapter {
  return adapters[provider] ?? openaiAdapter;
}
