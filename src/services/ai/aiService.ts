import type { AIProvider, ChatMessage, ThinkingLevel } from "@/types";
import { getAdapter } from "./providers";

export async function sendMessage(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
}): Promise<string> {
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
    return { success: result.length > 0 };
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
              params.onDone();
              return;
            case "error":
              params.onError(new Error(chunk.message));
              return;
          }
        }
      }
    }

    // If we reach here without a "done" event, still signal completion
    params.onDone();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // User cancelled — don't call onError
      return;
    }
    params.onError(err instanceof Error ? err : new Error("Stream hatası"));
  }
}
