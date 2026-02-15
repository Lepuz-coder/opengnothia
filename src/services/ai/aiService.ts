import type { AIProvider, AIResponse, ChatMessage } from "@/types";
import { getAdapter } from "./providers";

export async function sendMessage(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
}): Promise<AIResponse> {
  const adapter = getAdapter(params.provider);
  const { url, init } = adapter.formatRequest(params);

  const response = await fetch(url, init);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return {
    content: adapter.parseResponse(data),
    usage: adapter.parseUsage(data),
  };
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
