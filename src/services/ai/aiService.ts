import type { AIProvider, ChatMessage } from "@/types";
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
