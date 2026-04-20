import type { AIProvider, ChatMessage, ThinkingLevel, ThinkingType, TokenUsage } from "@/types";
import { modelRequiresAdaptiveThinking } from "@/constants/providers";

interface SendMessageParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
  thinkingEnabled?: boolean;
  thinkingLevel?: ThinkingLevel;
  thinkingType?: ThinkingType;
  maxTokens?: number;
}

interface StreamRequestParams extends SendMessageParams {
  thinkingEnabled: boolean;
  thinkingLevel?: ThinkingLevel;
  thinkingType?: ThinkingType;
}

const THINKING_BUDGETS: Record<ThinkingLevel, { budget_tokens: number; max_tokens: number }> = {
  low: { budget_tokens: 5000, max_tokens: 16000 },
  medium: { budget_tokens: 10000, max_tokens: 16000 },
  high: { budget_tokens: 25000, max_tokens: 32000 },
  max: { budget_tokens: 50000, max_tokens: 64000 },
};

const ADAPTIVE_EFFORT: Record<ThinkingLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
  max: "max",
};

const ADAPTIVE_MAX_TOKENS: Record<ThinkingLevel, number> = {
  low: 16000,
  medium: 16000,
  high: 32000,
  max: 64000,
};

const OPENAI_REASONING_EFFORT: Record<ThinkingLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
  max: "high",
};

const OPENAI_THINKING_TOKENS: Record<ThinkingLevel, number> = {
  low: 16000,
  medium: 25000,
  high: 50000,
  max: 50000,
};

export type StreamChunk =
  | { type: "thinking"; content: string }
  | { type: "text"; content: string }
  | { type: "done" }
  | { type: "done_with_usage"; usage: TokenUsage }
  | { type: "usage_delta"; inputTokens?: number; outputTokens?: number }
  | { type: "error"; message: string };

interface ProviderAdapter {
  formatRequest(params: SendMessageParams): { url: string; init: RequestInit };
  parseResponse(data: unknown): { content: string; usage: TokenUsage | null };
  formatStreamRequest(params: StreamRequestParams): { url: string; init: RequestInit };
  parseSSEEvent(eventType: string, data: string): StreamChunk | null;
}

function isReasoningModel(model: string): boolean {
  return /^o\d/.test(model) || /^gpt-5/.test(model);
}

const openaiAdapter: ProviderAdapter = {
  formatRequest({ apiKey, model, messages, systemPrompt, customBaseUrl, thinkingEnabled, thinkingLevel, maxTokens }) {
    const baseUrl = customBaseUrl || "https://api.openai.com/v1";
    const isReasoning = isReasoningModel(model);
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: isReasoning ? "developer" : "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };
    if (!isReasoning) {
      body.temperature = 0.7;
      if (maxTokens) body.max_tokens = maxTokens;
    }
    if (isReasoning && thinkingEnabled) {
      body.reasoning_effort = OPENAI_REASONING_EFFORT[thinkingLevel ?? "medium"];
      body.max_completion_tokens = maxTokens || OPENAI_THINKING_TOKENS[thinkingLevel ?? "medium"];
    }
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
  parseResponse(data: unknown): { content: string; usage: TokenUsage | null } {
    const d = data as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const content = d.choices[0]?.message?.content ?? "";
    const usage = d.usage
      ? { inputTokens: d.usage.prompt_tokens, outputTokens: d.usage.completion_tokens }
      : null;
    return { content, usage };
  },
  formatStreamRequest({ apiKey, model, messages, systemPrompt, customBaseUrl, thinkingEnabled, thinkingLevel }) {
    const baseUrl = customBaseUrl || "https://api.openai.com/v1";
    const isReasoning = isReasoningModel(model);

    // Use Responses API when thinking is enabled for reasoning models
    if (isReasoning && thinkingEnabled) {
      const body: Record<string, unknown> = {
        model,
        stream: true,
        instructions: systemPrompt,
        input: messages.map((m) => ({ role: m.role, content: m.content })),
        reasoning: {
          effort: OPENAI_REASONING_EFFORT[thinkingLevel ?? "medium"],
          summary: "concise",
        },
        max_output_tokens: OPENAI_THINKING_TOKENS[thinkingLevel ?? "medium"],
      };
      return {
        url: `${baseUrl}/responses`,
        init: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        },
      };
    }

    // Chat Completions API for non-reasoning or thinking disabled
    const body: Record<string, unknown> = {
      model,
      stream: true,
      messages: [
        { role: isReasoning ? "developer" : "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };
    if (!isReasoning) {
      body.temperature = 0.7;
    }
    body.stream_options = { include_usage: true };
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
  parseSSEEvent(eventType: string, data: string): StreamChunk | null {
    // Responses API events
    if (eventType === "response.reasoning_summary_text.delta") {
      try {
        const parsed = JSON.parse(data);
        return parsed.delta ? { type: "thinking", content: parsed.delta } : null;
      } catch { return null; }
    }
    if (eventType === "response.output_text.delta") {
      try {
        const parsed = JSON.parse(data);
        return parsed.delta ? { type: "text", content: parsed.delta } : null;
      } catch { return null; }
    }
    if (eventType === "response.completed") {
      try {
        const parsed = JSON.parse(data);
        if (parsed.response?.usage) {
          return {
            type: "done_with_usage",
            usage: {
              inputTokens: parsed.response.usage.input_tokens,
              outputTokens: parsed.response.usage.output_tokens,
            },
          };
        }
      } catch { /* fall through */ }
      return { type: "done" };
    }
    if (eventType === "error" || eventType === "response.failed") {
      try {
        const parsed = JSON.parse(data);
        return { type: "error", message: parsed.error?.message ?? "Stream error" };
      } catch { return { type: "error", message: "Stream error" }; }
    }

    // Chat Completions API events
    if (data === "[DONE]") return { type: "done" };
    try {
      const parsed = JSON.parse(data);
      // Usage chunk (sent before [DONE] when stream_options.include_usage is true)
      if (parsed.usage && (!parsed.choices || parsed.choices.length === 0 || !parsed.choices[0]?.delta?.content)) {
        return {
          type: "done_with_usage",
          usage: {
            inputTokens: parsed.usage.prompt_tokens,
            outputTokens: parsed.usage.completion_tokens,
          },
        };
      }
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) return null;
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
  formatRequest({ apiKey, model, messages, systemPrompt, maxTokens, thinkingEnabled, thinkingLevel, thinkingType }) {
    const body: Record<string, unknown> = {
      model,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (thinkingEnabled) {
      const level = thinkingLevel ?? "medium";
      const useAdaptive = thinkingType === "adaptive" || modelRequiresAdaptiveThinking("anthropic", model);
      if (useAdaptive) {
        body.thinking = { type: "adaptive" };
        body.output_config = { effort: ADAPTIVE_EFFORT[level] };
        body.max_tokens = ADAPTIVE_MAX_TOKENS[level];
      } else {
        const budget = THINKING_BUDGETS[level];
        body.thinking = { type: "enabled", budget_tokens: budget.budget_tokens };
        body.max_tokens = budget.max_tokens;
      }
    } else {
      body.max_tokens = maxTokens || 8192;
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
  parseResponse(data: unknown): { content: string; usage: TokenUsage | null } {
    const d = data as {
      content: { type: string; text: string }[];
      usage?: { input_tokens: number; output_tokens: number };
    };
    const content = d.content.find((c) => c.type === "text")?.text ?? "";
    const usage = d.usage
      ? { inputTokens: d.usage.input_tokens, outputTokens: d.usage.output_tokens }
      : null;
    return { content, usage };
  },
  formatStreamRequest({ apiKey, model, messages, systemPrompt, thinkingEnabled, thinkingLevel, thinkingType }) {
    const body: Record<string, unknown> = {
      model,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (thinkingEnabled) {
      const level = thinkingLevel ?? "medium";
      const useAdaptive = thinkingType === "adaptive" || modelRequiresAdaptiveThinking("anthropic", model);
      if (useAdaptive) {
        body.thinking = { type: "adaptive" };
        body.output_config = { effort: ADAPTIVE_EFFORT[level] };
        body.max_tokens = ADAPTIVE_MAX_TOKENS[level];
      } else {
        const budget = THINKING_BUDGETS[level];
        body.thinking = { type: "enabled", budget_tokens: budget.budget_tokens };
        body.max_tokens = budget.max_tokens;
      }
      // temperature must NOT be sent when thinking is enabled
    } else {
      body.max_tokens = 8192;
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
    if (eventType === "message_start") {
      try {
        const parsed = JSON.parse(data);
        const inputTokens = parsed.message?.usage?.input_tokens;
        if (inputTokens !== undefined) {
          return { type: "usage_delta", inputTokens };
        }
      } catch { /* ignore */ }
      return null;
    }
    if (eventType === "message_delta") {
      try {
        const parsed = JSON.parse(data);
        const outputTokens = parsed.usage?.output_tokens;
        if (outputTokens !== undefined) {
          return { type: "usage_delta", outputTokens };
        }
      } catch { /* ignore */ }
      return null;
    }
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
