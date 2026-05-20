import { useAppStore } from "@/stores/useAppStore";
import { sendMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { upsertPatientNotes, saveTokenUsage } from "@/services/db/queries";
import type { AIProvider, ChatMessage, ThinkingLevel, ThinkingType, TokenUsage } from "@/types";


interface BackgroundNotesParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
  thinkingEnabled?: boolean;
  thinkingLevel?: ThinkingLevel;
  thinkingType?: ThinkingType;
  callType: string;
  sessionId?: string | null;
  manageNoteTaking?: boolean;
}

async function trackUsage(
  provider: AIProvider,
  model: string,
  sessionId: string | null,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  await saveTokenUsage({
    session_id: sessionId,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: callType,
  });
}

export async function takeBackgroundNotes(params: BackgroundNotesParams): Promise<void> {
  const setNoteTaking = params.manageNoteTaking === false
    ? null
    : useAppStore.getState().setNoteTaking;
  setNoteTaking?.(true);

  try {
    const result = await sendMessage({
      provider: params.provider,
      apiKey: params.apiKey,
      model: params.model,
      messages: params.messages,
      systemPrompt: params.systemPrompt,
      customBaseUrl: params.customBaseUrl,
      thinkingEnabled: params.thinkingEnabled,
      thinkingLevel: params.thinkingLevel,
      thinkingType: params.thinkingType,
      maxTokens: 20000,
    });

    if (result.content && result.content.trim().length > 0) {
      const notes = result.content.trim();
      await upsertPatientNotes(notes);
    }
    await trackUsage(
      params.provider,
      params.model,
      params.sessionId ?? null,
      params.callType,
      result.usage,
    );
  } catch {
    // Silent failure for background notes
  } finally {
    setNoteTaking?.(false);
  }
}
