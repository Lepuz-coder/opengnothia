import { useAppStore } from "@/stores/useAppStore";
import { sendMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { upsertPatientNotes, saveTokenUsage } from "@/services/db/queries";
import type { AIProvider, ChatMessage, TokenUsage } from "@/types";

interface BackgroundNotesParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  customBaseUrl?: string;
  callType: string;
  sessionId?: string | null;
}

function trackUsage(
  provider: AIProvider,
  model: string,
  sessionId: string | null,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  saveTokenUsage({
    session_id: sessionId,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: callType,
  });
}

export function takeBackgroundNotes(params: BackgroundNotesParams) {
  const { setNoteTaking } = useAppStore.getState();
  setNoteTaking(true);

  sendMessage({
    provider: params.provider,
    apiKey: params.apiKey,
    model: params.model,
    messages: params.messages,
    systemPrompt: params.systemPrompt,
    customBaseUrl: params.customBaseUrl,
  })
    .then(async (result) => {
      if (result.content && result.content.trim().length > 0) {
        await upsertPatientNotes(result.content.trim());
      }
      trackUsage(
        params.provider,
        params.model,
        params.sessionId ?? null,
        params.callType,
        result.usage,
      );
    })
    .catch(() => {
      // Silent failure for background notes
    })
    .finally(() => {
      setNoteTaking(false);
    });
}
