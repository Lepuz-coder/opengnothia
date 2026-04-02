import { sendMessage } from "@/services/ai/aiService";
import { calculateCost } from "@/services/ai/costCalculator";
import { upsertCourseNotes, saveTokenUsage } from "@/services/db/queries";
import type { AIProvider, ChatMessage, ThinkingLevel, ThinkingType, TokenUsage } from "@/types";

interface UpdateCourseNotesParams {
  courseId: string;
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
}

function trackUsage(
  provider: AIProvider,
  model: string,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  saveTokenUsage({
    session_id: null,
    provider,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost,
    call_type: callType,
  });
}

export async function updateCourseNotes(params: UpdateCourseNotesParams): Promise<void> {
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
    await upsertCourseNotes(params.courseId, result.content.trim());
  }

  trackUsage(params.provider, params.model, params.callType, result.usage);
}
