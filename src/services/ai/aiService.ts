import type { AIProvider, ChatMessage, ThinkingLevel, ThinkingType, TokenUsage } from "@/types";
import { getAdapter } from "./providers";
import { getCurrentLanguage, getTranslation } from "@/i18n";
import { TEST_MESSAGE, TEST_SYSTEM_PROMPT } from "./promptBuilder";
import { AIError } from "./AIError";

export async function sendMessage(params: {
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
}): Promise<{ content: string; usage: TokenUsage | null }> {
  const adapter = getAdapter(params.provider);
  const { url, init } = adapter.formatRequest(params);

  const response = await fetch(url, init);
  if (!response.ok) {
    const error = await response.text();
    throw new AIError(`AI API error (${response.status}): ${error}`, response.status, error);
  }

  const data = await response.json();
  return adapter.parseResponse(data);
}

export async function testApiKey(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; error?: string; statusCode?: number; rawBody?: string }> {
  const lang = getCurrentLanguage();
  const t = getTranslation(lang);
  try {
    const result = await sendMessage({
      ...params,
      messages: [{ id: "test", role: "user", content: TEST_MESSAGE, timestamp: new Date().toISOString() }],
      systemPrompt: TEST_SYSTEM_PROMPT,
    });
    return { success: result.content.length > 0 };
  } catch (err) {
    const statusCode = err instanceof AIError ? err.statusCode : undefined;
    const rawBody = err instanceof AIError ? err.rawBody : undefined;
    return { success: false, error: err instanceof Error ? err.message : t.errors.unknown, statusCode, rawBody };
  }
}

export async function streamMessage(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
  thinkingEnabled: boolean;
  thinkingLevel?: ThinkingLevel;
  thinkingType?: ThinkingType;
  abortSignal?: AbortSignal;
  onThinking: (chunk: string) => void;
  onContent: (chunk: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onUsage?: (usage: TokenUsage) => void;
}): Promise<void> {
  const adapter = getAdapter(params.provider);
  const { url, init } = adapter.formatStreamRequest(params);

  try {
    const response = await fetch(url, {
      ...init,
      signal: params.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIError(`AI API error (${response.status}): ${errorText}`, response.status, errorText);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Stream body is null");

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEventType = "";
    const usageAccumulator = { inputTokens: 0, outputTokens: 0 };
    let hasUsage = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
          currentEventType = "";
          continue;
        }

        if (trimmed.startsWith("event: ")) {
          currentEventType = trimmed.slice(7);
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6);
          const parsed = adapter.parseSSEEvent(currentEventType, data);
          if (!parsed) continue;
          const chunks = Array.isArray(parsed) ? parsed : [parsed];

          for (const chunk of chunks) {
            switch (chunk.type) {
              case "thinking":
                params.onThinking(chunk.content);
                break;
              case "text":
                params.onContent(chunk.content);
                break;
              case "done":
                if (hasUsage) {
                  params.onUsage?.(usageAccumulator);
                }
                params.onDone();
                return;
              case "done_with_usage":
                params.onUsage?.(chunk.usage);
                params.onDone();
                return;
              case "usage_delta":
                if (chunk.inputTokens !== undefined) {
                  usageAccumulator.inputTokens = chunk.inputTokens;
                  hasUsage = true;
                }
                if (chunk.outputTokens !== undefined) {
                  usageAccumulator.outputTokens = chunk.outputTokens;
                  hasUsage = true;
                }
                break;
              case "error":
                params.onError(new AIError(chunk.message));
                return;
            }
          }
        }
      }
    }

    // If we reach here without a "done" event, still signal completion
    if (hasUsage) {
      params.onUsage?.(usageAccumulator);
    }
    params.onDone();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // User cancelled — don't call onError
      return;
    }
    const lang = getCurrentLanguage();
    const t = getTranslation(lang);
    params.onError(err instanceof AIError ? err : err instanceof Error ? new AIError(err.message) : new AIError(t.errors.stream));
  }
}
