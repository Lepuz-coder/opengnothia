import { useState, useEffect } from "react";
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
import { getUserProfile, upsertUserProfile } from "@/services/db/queries";
import type { AIProvider, TherapySchool, ThinkingLevel } from "@/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { setOnboarded } = useAppStore();
  const settings = useSettingsStore();
  const [saved, setSaved] = useState(false);
  const [apiKeyFocused, setApiKeyFocused] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileOccupation, setProfileOccupation] = useState("");

  useEffect(() => {
    getUserProfile().then((profile) => {
      if (profile) {
        setProfileName(profile.name ?? "");
        setProfileAge(profile.age != null ? String(profile.age) : "");
        setProfileGender(profile.gender ?? "");
        setProfileOccupation(profile.occupation ?? "");
      }
    });
  }, []);

  const currentProvider = getProvider(settings.provider);
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = currentProvider?.models.map((m) => ({ value: m.id, label: m.name })) ?? [];
  const showThinkingToggle = modelSupportsThinking(settings.provider, settings.model);
  const showMemoryThinkingToggle = modelSupportsThinking(settings.provider, settings.memoryModel);

  async function handleSave() {
    const store = await loadSettings();
    await store.set("provider", settings.provider);
    await store.set("apiKey", settings.apiKey);
    await store.set("providerApiKeys", settings.providerApiKeys);
    await store.set("model", settings.model);
    await store.set("theme", theme);
    await store.set("thinkingEnabled", settings.thinkingEnabled);
    await store.set("thinkingLevel", settings.thinkingLevel);
    await store.set("providerThinkingSettings", settings.providerThinkingSettings);
    await store.set("memoryModel", settings.memoryModel);
    await store.set("memoryThinkingEnabled", settings.memoryThinkingEnabled);
    await store.set("memoryThinkingLevel", settings.memoryThinkingLevel);
    await store.set("providerMemoryThinkingSettings", settings.providerMemoryThinkingSettings);
    await store.set("therapySchool", settings.therapySchool);
    await store.save();

    await upsertUserProfile({
      name: profileName.trim() || null,
      age: profileAge ? parseInt(profileAge, 10) : null,
      gender: profileGender || null,
      occupation: profileOccupation.trim() || null,
    });

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

      {/* Personal Info */}
      <Card>
        <h2 className="font-semibold mb-4">Kişisel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ad"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Adını gir"
          />
          <Input
            label="Yaş"
            type="number"
            value={profileAge}
            onChange={(e) => setProfileAge(e.target.value)}
            placeholder="25"
            min={1}
            max={120}
          />
          <Select
            label="Cinsiyet"
            options={[
              { value: "", label: "Seçiniz" },
              { value: "Kadın", label: "Kadın" },
              { value: "Erkek", label: "Erkek" },
              { value: "Diğer", label: "Diğer" },
              { value: "Belirtmek istemiyorum", label: "Belirtmek istemiyorum" },
            ]}
            value={profileGender}
            onChange={(e) => setProfileGender(e.target.value)}
          />
          <Input
            label="Meslek / Okul Durumu"
            value={profileOccupation}
            onChange={(e) => setProfileOccupation(e.target.value)}
            placeholder="Öğrenci, Mühendis, vb."
          />
        </div>
      </Card>

      {/* AI Connection */}
      <Card>
        <h2 className="font-semibold mb-4">AI Bağlantısı</h2>
        <div className="space-y-4">
          <Select
            label="Sağlayıcı"
            options={providerOptions}
            value={settings.provider}
            onChange={(e) => {
              settings.setProvider(e.target.value as AIProvider);
            }}
          />

          {currentProvider?.requiresKey && (
            <Input
              label="API Anahtarı"
              type={apiKeyFocused ? "text" : "text"}
              value={
                apiKeyFocused || !settings.apiKey
                  ? settings.apiKey
                  : settings.apiKey.length > 10
                    ? settings.apiKey.slice(0, 5) + "•".repeat(Math.min(settings.apiKey.length - 10, 20)) + settings.apiKey.slice(-5)
                    : settings.apiKey
              }
              onChange={(e) => settings.setApiKey(e.target.value)}
              onFocus={() => setApiKeyFocused(true)}
              onBlur={() => setApiKeyFocused(false)}
            />
          )}
        </div>
      </Card>

      {/* Chat Model */}
      <Card>
        <h2 className="font-semibold mb-4">Genel Chat Modeli</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Seans, özet, rüya analizi ve günlük analizi için kullanılır.
        </p>
        <div className="space-y-4">
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
                ...(settings.provider !== "openai" ? [{ value: "max", label: "Kapsamlı — En derin analiz, en yavaş yanıt" }] : []),
              ]}
              value={settings.thinkingLevel}
              onChange={(e) => settings.setThinkingLevel(e.target.value as ThinkingLevel)}
            />
          )}
        </div>
      </Card>

      {/* Memory Model */}
      <Card>
        <h2 className="font-semibold mb-4">Hafıza Modeli</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Hasta notları çıkarımı için kullanılır. Daha küçük/ucuz bir model seçebilirsin.
        </p>
        <div className="space-y-4">
          {modelOptions.length > 0 && (
            <Select
              label="Model"
              options={modelOptions}
              value={settings.memoryModel}
              onChange={(e) => {
                settings.setMemoryModel(e.target.value);
                if (!modelSupportsThinking(settings.provider, e.target.value)) {
                  settings.setMemoryThinkingEnabled(false);
                }
              }}
            />
          )}

          {showMemoryThinkingToggle && (
            <div className="pt-1">
              <Toggle
                checked={settings.memoryThinkingEnabled}
                onChange={settings.setMemoryThinkingEnabled}
                label="Düşünce Modu"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
                Hasta notları çıkarımında düşünce modunu kullanır.
              </p>
            </div>
          )}

          {showMemoryThinkingToggle && settings.memoryThinkingEnabled && (
            <Select
              label="Düşünce Seviyesi"
              options={[
                { value: "low", label: "Hızlı — Kısa düşünür, çabuk yanıt verir" },
                { value: "medium", label: "Dengeli — Yeterince düşünür, makul hızda" },
                { value: "high", label: "Derinlemesine — Uzun düşünür, detaylı analiz" },
                ...(settings.provider !== "openai" ? [{ value: "max", label: "Kapsamlı — En derin analiz, en yavaş yanıt" }] : []),
              ]}
              value={settings.memoryThinkingLevel}
              onChange={(e) => settings.setMemoryThinkingLevel(e.target.value as ThinkingLevel)}
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
