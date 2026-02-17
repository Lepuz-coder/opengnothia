import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { providers, getProvider, modelSupportsThinking } from "@/constants/providers";
import { testApiKey } from "@/services/ai/aiService";
import type { ThinkingLevel } from "@/types";

interface ApiSetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ApiSetupStep({ onNext, onBack }: ApiSetupStepProps) {
  const {
    provider, setProvider, apiKey, setApiKey,
    model, setModel, thinkingEnabled, setThinkingEnabled, thinkingLevel, setThinkingLevel,
    memoryModel, setMemoryModel, memoryThinkingEnabled, setMemoryThinkingEnabled, memoryThinkingLevel, setMemoryThinkingLevel,
  } = useSettingsStore();
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  const currentProvider = getProvider(provider);
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = currentProvider?.models.map((m) => ({ value: m.id, label: m.name })) ?? [];
  const memoryModelOptions = currentProvider?.models.map((m) => ({
    value: m.id,
    label: m.id === "claude-sonnet-4-5-20250929" ? `${m.name} (Önerilen)` : m.name,
  })) ?? [];
  const showThinkingToggle = modelSupportsThinking(provider, model);
  const showMemoryThinkingToggle = modelSupportsThinking(provider, memoryModel);

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
      setTestError(result.error ?? "Bağlantı başarısız");
    }
  }

  const canProceed = apiKey.length > 0 || !currentProvider?.requiresKey;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Bağlantısı</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Kullanmak istediğin AI sağlayıcısını seç ve API anahtarını gir.
        </p>
      </div>

      <Select
        label="Sağlayıcı"
        options={providerOptions}
        value={provider}
        onChange={(e) => {
          setProvider(e.target.value as any);
          setTestStatus("idle");
        }}
      />

      {currentProvider?.requiresKey && (
        <Input
          label="API Anahtarı"
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
          placeholder={provider === "openai" ? "sk-..." : provider === "anthropic" ? "sk-ant-..." : "API anahtarını gir"}
        />
      )}

      {/* Chat Model */}
      <div className="border-t border-[var(--border-color)] pt-4 mt-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Genel Chat Modeli</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Seans, özet, rüya analizi ve günlük analizi için kullanılır.
        </p>
      </div>

      {modelOptions.length > 0 && (
        <Select
          label="Model"
          options={modelOptions}
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            if (!modelSupportsThinking(provider, e.target.value)) {
              setThinkingEnabled(false);
            }
          }}
        />
      )}

      {showThinkingToggle && (
        <div>
          <Toggle
            checked={thinkingEnabled}
            onChange={setThinkingEnabled}
            label="Düşünce Modu"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
            AI'ın düşünce sürecini görmeni sağlar. Daha yavaş ama daha derinlemesine yanıtlar.
          </p>
        </div>
      )}

      {showThinkingToggle && thinkingEnabled && (
        <Select
          label="Düşünce Seviyesi"
          options={[
            { value: "low", label: "Hızlı — Kısa düşünür, çabuk yanıt verir" },
            { value: "medium", label: "Dengeli — Yeterince düşünür, makul hızda" },
            { value: "high", label: "Derinlemesine — Uzun düşünür, detaylı analiz" },
            ...(provider !== "openai" ? [{ value: "max", label: "Kapsamlı — En derin analiz, en yavaş yanıt" }] : []),
          ]}
          value={thinkingLevel}
          onChange={(e) => setThinkingLevel(e.target.value as ThinkingLevel)}
        />
      )}

      {/* Memory Model */}
      <div className="border-t border-[var(--border-color)] pt-4 mt-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Hafıza Modeli</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Hasta notları çıkarımı için kullanılır. Daha küçük/ucuz bir model yeterli olabilir.
        </p>
      </div>

      {modelOptions.length > 0 && (
        <Select
          label="Model"
          options={memoryModelOptions}
          value={memoryModel}
          onChange={(e) => {
            setMemoryModel(e.target.value);
            if (!modelSupportsThinking(provider, e.target.value)) {
              setMemoryThinkingEnabled(false);
            }
          }}
        />
      )}

      {showMemoryThinkingToggle && (
        <div>
          <Toggle
            checked={memoryThinkingEnabled}
            onChange={setMemoryThinkingEnabled}
            label="Düşünce Modu"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
            Hasta notları çıkarımında düşünce modunu kullanır.
          </p>
        </div>
      )}

      {showMemoryThinkingToggle && memoryThinkingEnabled && (
        <Select
          label="Düşünce Seviyesi"
          options={[
            { value: "low", label: "Hızlı — Kısa düşünür, çabuk yanıt verir" },
            { value: "medium", label: "Dengeli — Yeterince düşünür, makul hızda" },
            { value: "high", label: "Derinlemesine — Uzun düşünür, detaylı analiz" },
            ...(provider !== "openai" ? [{ value: "max", label: "Kapsamlı — En derin analiz, en yavaş yanıt" }] : []),
          ]}
          value={memoryThinkingLevel}
          onChange={(e) => setMemoryThinkingLevel(e.target.value as ThinkingLevel)}
        />
      )}

      {/* Test button */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={handleTest} disabled={!canProceed || testStatus === "loading"}>
          {testStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          Test Et
        </Button>
        {testStatus === "success" && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" /> Bağlantı başarılı
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
          Geri
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          Devam
        </Button>
      </div>
    </div>
  );
}
