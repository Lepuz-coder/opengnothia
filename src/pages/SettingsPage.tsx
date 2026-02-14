import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { loadSettings } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { providers, getProvider, modelSupportsThinking } from "@/constants/providers";
import { therapySchools } from "@/constants/therapySchools";
import type { AIProvider, TherapySchool, ThinkingLevel } from "@/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { setOnboarded } = useAppStore();
  const settings = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const currentProvider = getProvider(settings.provider);
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = currentProvider?.models.map((m) => ({ value: m.id, label: m.name })) ?? [];
  const showThinkingToggle = modelSupportsThinking(settings.provider, settings.model);

  async function handleSave() {
    const store = await loadSettings();
    await store.set("provider", settings.provider);
    await store.set("apiKey", settings.apiKey);
    await store.set("model", settings.model);
    await store.set("theme", theme);
    await store.set("thinkingEnabled", settings.thinkingEnabled);
    await store.set("thinkingLevel", settings.thinkingLevel);
    await store.set("therapySchool", settings.therapySchool);
    if (settings.customBaseUrl) await store.set("customBaseUrl", settings.customBaseUrl);
    await store.save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleResetOnboarding() {
    const store = await loadSettings();
    await store.set("isOnboarded", false);
    await store.save();
    setOnboarded(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      {/* AI Settings */}
      <Card>
        <h2 className="font-semibold mb-4">AI Bağlantısı</h2>
        <div className="space-y-4">
          <Select
            label="Sağlayıcı"
            options={providerOptions}
            value={settings.provider}
            onChange={(e) => {
              settings.setProvider(e.target.value as AIProvider);
              const prov = getProvider(e.target.value);
              if (prov?.models[0]) settings.setModel(prov.models[0].id);
              settings.setThinkingEnabled(false);
            }}
          />

          {currentProvider?.requiresKey && (
            <Input
              label="API Anahtarı"
              type="password"
              value={settings.apiKey}
              onChange={(e) => settings.setApiKey(e.target.value)}
            />
          )}

          {settings.provider === "custom" && (
            <Input
              label="Base URL"
              value={settings.customBaseUrl}
              onChange={(e) => settings.setCustomBaseUrl(e.target.value)}
            />
          )}

          {modelOptions.length > 0 && (
            <Select
              label="Model"
              options={modelOptions}
              value={settings.model}
              onChange={(e) => {
                settings.setModel(e.target.value);
                if (!modelSupportsThinking(settings.provider, e.target.value)) {
                  settings.setThinkingEnabled(false);
                }
              }}
            />
          )}

          {showThinkingToggle && (
            <div className="pt-1">
              <Toggle
                checked={settings.thinkingEnabled}
                onChange={settings.setThinkingEnabled}
                label="Düşünce Modu"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
                AI'ın düşünce sürecini görmeni sağlar. Daha yavaş ama daha derinlemesine yanıtlar.
              </p>
            </div>
          )}

          {showThinkingToggle && settings.thinkingEnabled && (
            <Select
              label="Düşünce Seviyesi"
              options={[
                { value: "low", label: "Hızlı — Kısa düşünür, çabuk yanıt verir" },
                { value: "medium", label: "Dengeli — Yeterince düşünür, makul hızda" },
                { value: "high", label: "Derinlemesine — Uzun düşünür, detaylı analiz" },
                { value: "max", label: "Kapsamlı — En derin analiz, en yavaş yanıt" },
              ]}
              value={settings.thinkingLevel}
              onChange={(e) => settings.setThinkingLevel(e.target.value as ThinkingLevel)}
            />
          )}
        </div>
      </Card>

      {/* Therapy School */}
      <Card>
        <h2 className="font-semibold mb-4">Terapi Ekolü</h2>
        <Select
          label="Ekol"
          options={therapySchools.map((s) => ({ value: s.id, label: s.name }))}
          value={settings.therapySchool}
          onChange={(e) => settings.setTherapySchool(e.target.value as TherapySchool)}
        />
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" />
          Kaydet
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" /> Kaydedildi
          </span>
        )}
      </div>

      {/* Danger zone */}
      <Card className="border-red-900">
        <h2 className="font-semibold mb-2 text-red-600">Tehlikeli Alan</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Onboarding sürecini sıfırla ve tüm ayarları yeniden yapılandır.
        </p>
        <Button variant="danger" size="sm" onClick={handleResetOnboarding}>
          Onboarding'i Sıfırla
        </Button>
      </Card>
    </div>
  );
}
