import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/i18n";
import { providers, getProvider, modelSupportsThinking, modelSupportsAdaptiveThinking } from "@/constants/providers";
import { testApiKey } from "@/services/ai/aiService";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { ThinkingLevel, ThinkingType } from "@/types";

interface ApiSetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ApiSetupStep({ onNext, onBack }: ApiSetupStepProps) {
  const { t } = useTranslation();
  const {
    provider, setProvider, apiKey, setApiKey,
    model, setModel, thinkingEnabled, setThinkingEnabled, thinkingLevel, setThinkingLevel,
    thinkingType, setThinkingType,
    memoryModel, setMemoryModel, memoryThinkingEnabled, setMemoryThinkingEnabled, memoryThinkingLevel, setMemoryThinkingLevel,
    memoryThinkingType, setMemoryThinkingType,
  } = useSettingsStore();
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  const currentProvider = getProvider(provider);
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = currentProvider?.models.map((m) => ({
    value: m.id,
    label: m.id === "claude-opus-4-6" ? `${m.name} (${t.settings.recommended})` : m.name,
  })) ?? [];
  const memoryModelOptions = currentProvider?.models.map((m) => ({
    value: m.id,
    label: m.id === "claude-sonnet-4-5-20250929" ? `${m.name} (${t.settings.recommended})` : m.name,
  })) ?? [];
  const showThinkingToggle = modelSupportsThinking(provider, model);
  const showMemoryThinkingToggle = modelSupportsThinking(provider, memoryModel);
  const showAdaptiveOption = modelSupportsAdaptiveThinking(provider, model);
  const showMemoryAdaptiveOption = modelSupportsAdaptiveThinking(provider, memoryModel);

  async function handleTest() {
    setTestStatus("loading");
    setTestError("");
    const result = await testApiKey({
      provider,
      apiKey,
      model,
    });
    if (result.success) {
      setTestStatus("success");
    } else {
      setTestStatus("error");
      setTestError(result.error ?? t.settings.connectionFailed);
    }
  }

  const canProceed = apiKey.length > 0 || !currentProvider?.requiresKey;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{t.onboarding.aiConnection}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t.onboarding.aiConnectionDescription}
        </p>
      </div>

      <Select
        label={t.settings.provider}
        options={providerOptions}
        value={provider}
        onChange={(e) => {
          setProvider(e.target.value as any);
          setTestStatus("idle");
        }}
      />

      {currentProvider?.requiresKey && (
        <>
          <Input
            label={t.settings.apiKey}
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
            placeholder={provider === "openai" ? "sk-..." : provider === "anthropic" ? "sk-ant-..." : t.onboarding.apiKeyPlaceholder}
          />
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openUrl(
                provider === "anthropic"
                  ? "https://www.opengnothia.com/tr/blog/claude-api-key"
                  : "https://www.opengnothia.com/tr/blog/openai-api-key"
              );
            }}
            className="text-xs text-[var(--accent-color)] hover:underline cursor-pointer -mt-3 inline-block"
          >
            {t.onboarding.howToGetApiKey}
          </a>
        </>
      )}

      {/* Chat Model */}
      <div className="border-t border-[var(--border-color)] pt-4 mt-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t.onboarding.chatModelOnboarding}</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          {t.onboarding.chatModelOnboardingDescription}
        </p>
      </div>

      {modelOptions.length > 0 && (
        <Select
          label={t.settings.model}
          options={modelOptions}
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            if (!modelSupportsThinking(provider, e.target.value)) {
              setThinkingEnabled(false);
            }
            setThinkingType("budget");
          }}
        />
      )}

      {showThinkingToggle && (
        <div>
          <Toggle
            checked={thinkingEnabled}
            onChange={setThinkingEnabled}
            label={t.settings.thinkingMode}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
            {t.settings.thinkingModeDescription}
          </p>
        </div>
      )}

      {showThinkingToggle && thinkingEnabled && showAdaptiveOption && (
        <div>
          <Select
            label={t.settings.thinkingType}
            options={[
              { value: "budget", label: t.settings.thinkingTypeBudget },
              { value: "adaptive", label: t.settings.thinkingTypeAdaptive },
            ]}
            value={thinkingType}
            onChange={(e) => setThinkingType(e.target.value as ThinkingType)}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {thinkingType === "adaptive" ? t.settings.thinkingTypeAdaptiveDesc : t.settings.thinkingTypeBudgetDesc}
          </p>
        </div>
      )}

      {showThinkingToggle && thinkingEnabled && (
        <Select
          label={t.settings.thinkingLevel}
          options={[
            { value: "low", label: t.settings.thinkingLow },
            { value: "medium", label: t.settings.thinkingMedium },
            { value: "high", label: t.settings.thinkingHigh },
            ...(provider !== "openai" ? [{ value: "max", label: t.settings.thinkingMax }] : []),
          ]}
          value={thinkingLevel}
          onChange={(e) => setThinkingLevel(e.target.value as ThinkingLevel)}
        />
      )}

      {/* Memory Model */}
      <div className="border-t border-[var(--border-color)] pt-4 mt-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t.onboarding.memoryModelOnboarding}</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          {t.onboarding.memoryModelOnboardingDescription}
        </p>
      </div>

      {modelOptions.length > 0 && (
        <Select
          label={t.settings.model}
          options={memoryModelOptions}
          value={memoryModel}
          onChange={(e) => {
            setMemoryModel(e.target.value);
            if (!modelSupportsThinking(provider, e.target.value)) {
              setMemoryThinkingEnabled(false);
            }
            setMemoryThinkingType("budget");
          }}
        />
      )}

      {showMemoryThinkingToggle && (
        <div>
          <Toggle
            checked={memoryThinkingEnabled}
            onChange={setMemoryThinkingEnabled}
            label={t.settings.thinkingMode}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
            {t.settings.memoryThinkingDescription}
          </p>
        </div>
      )}

      {showMemoryThinkingToggle && memoryThinkingEnabled && showMemoryAdaptiveOption && (
        <div>
          <Select
            label={t.settings.thinkingType}
            options={[
              { value: "budget", label: t.settings.thinkingTypeBudget },
              { value: "adaptive", label: t.settings.thinkingTypeAdaptive },
            ]}
            value={memoryThinkingType}
            onChange={(e) => setMemoryThinkingType(e.target.value as ThinkingType)}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {memoryThinkingType === "adaptive" ? t.settings.thinkingTypeAdaptiveDesc : t.settings.thinkingTypeBudgetDesc}
          </p>
        </div>
      )}

      {showMemoryThinkingToggle && memoryThinkingEnabled && (
        <Select
          label={t.settings.thinkingLevel}
          options={[
            { value: "low", label: t.settings.thinkingLow },
            { value: "medium", label: t.settings.thinkingMedium },
            { value: "high", label: t.settings.thinkingHigh },
            ...(provider !== "openai" ? [{ value: "max", label: t.settings.thinkingMax }] : []),
          ]}
          value={memoryThinkingLevel}
          onChange={(e) => setMemoryThinkingLevel(e.target.value as ThinkingLevel)}
        />
      )}

      {/* Test button */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={handleTest} disabled={!canProceed || testStatus === "loading"}>
          {testStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {t.common.test}
        </Button>
        {testStatus === "success" && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" /> {t.settings.connectionSuccess}
          </span>
        )}
        {testStatus === "error" && (
          <span className="flex items-center gap-1.5 text-sm text-red-500">
            <XCircle className="w-4 h-4" /> {testError}
          </span>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          {t.common.back}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          {t.common.continue}
        </Button>
      </div>
    </div>
  );
}
