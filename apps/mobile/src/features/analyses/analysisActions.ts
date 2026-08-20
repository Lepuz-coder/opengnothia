import { buildPatientNotesUpdatePrompt } from "@opengnothia/shared/ai/promptBuilder";
import { getCurrentLanguage } from "@opengnothia/shared/i18n";
import { createBufferedTextStream } from "@opengnothia/shared/lib/createBufferedTextStream";
import type { ChatMessage, TokenUsage } from "@opengnothia/shared/types";
import { streamChat, takeSessionNotes } from "@/ai/client";
import { getQueries } from "@/db";
import { useSessionStore } from "@/stores/useSessionStore";

async function trackUsage(callType: string, usage: TokenUsage | null) {
  if (!usage) return;
  const queries = await getQueries();
  // Model/cost are opaque behind the proxy (M5): record the token trail with
  // the placeholder model id and zero cost.
  await queries.saveTokenUsage({
    session_id: null,
    provider: "openai",
    model: "proxy",
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost: 0,
    call_type: callType,
  });
}

/**
 * Faz 6's shared streaming shape for the three analysis surfaces (journal,
 * dream, milestone): buffered UI chunks, the proxy usage trail, and error
 * routing through the caller's AI error handler. Resolves with the full text,
 * or null when the stream failed — the caller then skips persisting.
 */
export async function streamAnalysisContent(params: {
  messages: ChatMessage[];
  systemPrompt: string;
  callType: string;
  onChunk: (chunk: string) => void;
  onAIError: (error: unknown) => void;
}): Promise<string | null> {
  let full = "";
  let failed = false;
  const buffered = createBufferedTextStream(params.onChunk);

  try {
    await streamChat({
      messages: params.messages,
      systemPrompt: params.systemPrompt,
      onContent: (chunk) => {
        full += chunk;
        buffered.push(chunk);
      },
      onDone: () => buffered.flush(),
      onUsage: (usage) => {
        void trackUsage(params.callType, usage);
      },
      onError: (error) => {
        failed = true;
        buffered.cancel();
        params.onAIError(error);
      },
    });
  } catch (err) {
    failed = true;
    buffered.cancel();
    params.onAIError(err);
  }

  return failed ? null : full;
}

/**
 * Desktop's journal/dream pattern: after an analysis lands, patient notes are
 * refreshed in the background from the entry + its analysis. Reuses the
 * session store's note-taking flags, so the session tab shows its banner and
 * a new session start stays blocked while the memory file is being rewritten.
 */
export function kickOffAnalysisNotes(noteMessage: string): void {
  const runStartedAt = useSessionStore.getState().startNoteTaking();

  getQueries()
    .then((queries) => Promise.all([queries.getPatientNotes(), queries.getPatientNotesUpdatedAt()]))
    .then(([existingNotes, notesUpdatedAt]) =>
      takeSessionNotes({
        messages: [
          { id: crypto.randomUUID(), role: "user", content: noteMessage, timestamp: new Date().toISOString() },
        ],
        systemPrompt: buildPatientNotesUpdatePrompt(existingNotes, notesUpdatedAt, getCurrentLanguage()),
        callType: "patient_notes",
        sessionId: null,
      })
    )
    .catch(() => {
      // Silent failure for background notes
    })
    .finally(() => {
      useSessionStore.getState().finishNoteTaking(runStartedAt);
    });
}
