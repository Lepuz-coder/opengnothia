import { useState } from "react";
import { GraduationCap, Hand, Compass, ArrowLeft, Check, CheckCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorModal } from "@/components/ui/ErrorModal";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useTranslation } from "@/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getAllSchools, RECOMMENDED_SCHOOL_ID } from "@/stores/useSchoolsStore";
import { loadSettings } from "@/lib/store";
import { useSchoolRecommendation } from "@/hooks/useSchoolRecommendation";
import { cn } from "@/lib/cn";
import type { TherapySchoolDef } from "@/constants/therapySchools";

interface SchoolSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

type Mode = "choose" | "manual" | "ai";

export function SchoolSelectionStep({ onNext, onBack }: SchoolSelectionStepProps) {
  const { t, language } = useTranslation();
  const { therapySchool, setTherapySchool } = useSettingsStore();
  const [mode, setMode] = useState<Mode>("choose");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(therapySchool);

  const allSchools = getAllSchools(language);

  async function persistSelectedSchool(id: string) {
    setTherapySchool(id);
    const store = await loadSettings();
    await store.set("therapySchool", id);
    await store.save();
  }

  async function handleManualContinue() {
    await persistSelectedSchool(selectedSchoolId);
    onNext();
  }

  const recommendation = useSchoolRecommendation({
    onSchoolSelected: async (school: TherapySchoolDef) => {
      await persistSelectedSchool(school.id);
      onNext();
    },
  });

  // AI recommendation full-screen view
  if (mode === "ai") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]/50 bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                recommendation.resetRecommendation();
                setMode("choose");
              }}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold">{t.schools.findIdealSchool}</h2>
          </div>
          <button
            onClick={() => {
              recommendation.resetRecommendation();
              setMode("choose");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
            {t.common.close}
          </button>
        </div>

        {/* Chat area */}
        <ChatContainer
          messages={recommendation.recMessages}
          isLoading={recommendation.recIsLoading}
          isStreaming={recommendation.recIsStreaming}
        />

        {/* Result card */}
        {recommendation.recPhase === "result" && recommendation.recRecommendedSchool && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto">
              <Card className="border-primary-500 ring-1 ring-primary-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-primary-500" />
                      <h3 className="font-semibold">{recommendation.recRecommendedSchool.name}</h3>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {recommendation.recRecommendedSchool.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={recommendation.handleApplyRecommendation}>
                    <Check className="w-4 h-4" />
                    {t.schools.applySchool}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      recommendation.resetRecommendation();
                      setMode("choose");
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Input */}
        {recommendation.recPhase === "chat" && (
          <ChatInput
            onSend={recommendation.handleRecommendationSend}
            disabled={recommendation.recIsLoading || recommendation.recIsStreaming}
          />
        )}

        {/* Error Modal */}
        <ErrorModal
          isOpen={recommendation.recError !== null}
          onClose={() => recommendation.setRecError(null)}
          title={recommendation.recError?.title ?? ""}
          message={recommendation.recError?.message ?? ""}
          showSettingsLink={recommendation.recError?.showSettingsLink ?? false}
          onGoToSettings={() => recommendation.setRecError(null)}
        />
      </div>
    );
  }

  // Manual selection view
  if (mode === "manual") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {t.schools.chooseManually}
          </h2>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allSchools.map((school) => {
            const isSelected = selectedSchoolId === school.id;
            const isRecommended = school.id === RECOMMENDED_SCHOOL_ID;
            return (
              <button
                key={school.id}
                onClick={() => setSelectedSchoolId(school.id)}
                className={cn(
                  "relative w-full text-left p-3 rounded-xl border transition-all",
                  isSelected
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/20"
                    : "border-[var(--border-color)] hover:border-primary-500/30"
                )}
              >
                {isRecommended && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/30 pointer-events-none">
                    <Sparkles className="w-3 h-3" />
                    {t.schools.recommended}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">{school.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      {school.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-500 shrink-0 ml-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={() => setMode("choose")} className="flex-1">
            {t.common.back}
          </Button>
          <Button onClick={handleManualContinue} className="flex-1">
            {t.common.continue}
          </Button>
        </div>
      </div>
    );
  }

  // Mode selection view (default)
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {t.schools.chooseSchoolMethod}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t.schools.chooseSchoolMethodDescription}
        </p>
      </div>

      <div className="space-y-3">
        {/* Manual selection card */}
        <button
          onClick={() => setMode("manual")}
          className="w-full text-left p-4 rounded-xl border border-[var(--border-color)] hover:border-primary-500/30 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
              <Hand className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-primary-400 transition-colors">
                {t.schools.chooseManually}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t.schools.chooseManuallyDescription}
              </p>
            </div>
          </div>
        </button>

        {/* AI recommendation card */}
        <button
          onClick={() => {
            setMode("ai");
            recommendation.startRecommendation();
          }}
          className="w-full text-left p-4 rounded-xl border border-[var(--border-color)] hover:border-accent-500/30 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-accent-400 transition-colors">
                {t.schools.chooseWithAI}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t.schools.chooseWithAIDescription}
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          {t.common.back}
        </Button>
      </div>
    </div>
  );
}
