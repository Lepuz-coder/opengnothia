import { sendMessage } from "./aiService";
import { calculateCost } from "./costCalculator";
import type { Queries } from "../db";
import type { AIProvider, ChatMessage, ThinkingLevel, ThinkingType, TokenUsage } from "../types";

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
  /** App-owned database access — desktop and mobile each pass their own getQueries. */
  getQueries: () => Promise<Queries>;
  /**
   * Optional UI status hook (desktop's NoteTakingBanner, mobile's session
   * banner). Callers that manage a richer status themselves simply omit it.
   */
  onNoteTaking?: (active: boolean) => void;
}

async function trackUsage(
  getQueries: () => Promise<Queries>,
  provider: AIProvider,
  model: string,
  sessionId: string | null,
  callType: string,
  usage: TokenUsage | null,
) {
  if (!usage) return;
  const cost = calculateCost(provider, model, usage.inputTokens, usage.outputTokens);
  const queries = await getQueries();
  await queries.saveTokenUsage({
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
  params.onNoteTaking?.(true);

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
      const queries = await params.getQueries();
      await queries.upsertPatientNotes(notes);
    }
    await trackUsage(
      params.getQueries,
      params.provider,
      params.model,
      params.sessionId ?? null,
      params.callType,
      result.usage,
    );
  } catch {
    // Silent failure for background notes
  } finally {
    params.onNoteTaking?.(false);
  }
}
