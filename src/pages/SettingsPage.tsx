import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { loadSettings } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { providers, getProvider } from "@/constants/providers";
import type { Theme, AIProvider } from "@/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { setOnboarded } = useAppStore();
  const settings = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const currentProvider = getProvider(settings.provider);
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = currentProvider?.models.map((m) => ({ value: m.id, label: m.name })) ?? [];

  const themeOptions = [
    { value: "system", label: "Sistem" },
    { value: "light", label: "Açık" },
    { value: "dark", label: "Koyu" },
  ];

  async function handleSave() {
    const store = await loadSettings();
    await store.set("provider", settings.provider);
    await store.set("apiKey", settings.apiKey);
    await store.set("model", settings.model);
    await store.set("theme", theme);
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

      {/* Appearance */}
      <Card>
        <h2 className="font-semibold mb-4">Görünüm</h2>
        <Select
          label="Tema"
          options={themeOptions}
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        />
      </Card>

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
              onChange={(e) => settings.setModel(e.target.value)}
            />
          )}
        </div>
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
      <Card className="border-red-200 dark:border-red-900">
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
