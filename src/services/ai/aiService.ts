import type { AIProvider, ChatMessage, ThinkingLevel, TokenUsage } from "@/types";
import { getAdapter } from "./providers";

export async function sendMessage(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
}): Promise<{ content: string; usage: TokenUsage | null }> {
  const adapter = getAdapter(params.provider);
  const { url, init } = adapter.formatRequest(params);

  const response = await fetch(url, init);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return adapter.parseResponse(data);
}

export async function testApiKey(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendMessage({
      ...params,
      messages: [{ id: "test", role: "user", content: "Merhaba, test mesajı.", timestamp: new Date().toISOString() }],
      systemPrompt: "Kısa bir merhaba de.",
    });
    return { success: result.content.length > 0 };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
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
      throw new Error(`AI API error (${response.status}): ${errorText}`);
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
          const chunk = adapter.parseSSEEvent(currentEventType, data);
          if (!chunk) continue;

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
              params.onError(new Error(chunk.message));
              return;
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
    params.onError(err instanceof Error ? err : new Error("Stream hatası"));
  }
}
