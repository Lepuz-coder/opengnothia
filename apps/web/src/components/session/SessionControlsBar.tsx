import { useTranslation } from "@/i18n";
import { SessionTimer } from "@/components/chat/SessionTimer";
import { ContextUsageIndicator } from "@/components/session/ContextUsageIndicator";

interface SessionControlsBarProps {
  startedAt: string | null;
  onEndSession: () => void;
  endDisabled: boolean;
  modelName: string;
  currentTokens: number;
  contextWindow: number;
  sessionId: string | null;
}

export function SessionControlsBar({
  startedAt,
  onEndSession,
  endDisabled,
  modelName,
  currentTokens,
  contextWindow,
  sessionId,
}: SessionControlsBarProps) {
  const { t } = useTranslation();
  return (
    <div className="px-4 pb-3 -mt-1">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {startedAt && <SessionTimer startedAt={startedAt} />}
          <button
            type="button"
            onClick={onEndSession}
            disabled={endDisabled}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.session.endSession}
          </button>
        </div>
        <ContextUsageIndicator
          modelName={modelName}
          currentTokens={currentTokens}
          contextWindow={contextWindow}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}
