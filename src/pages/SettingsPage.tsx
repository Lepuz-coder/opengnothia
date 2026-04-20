import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Save, CheckCircle, Shield, Lock, Loader2, Volume2 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { loadSettings } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSchoolsStore } from "@/stores/useSchoolsStore";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { providers, getProvider, modelSupportsThinking, modelSupportsAdaptiveThinking, modelRequiresAdaptiveThinking } from "@/constants/providers";
import { getUserProfile, upsertUserProfile, clearAllData } from "@/services/db/queries";
import { Modal } from "@/components/ui/Modal";
import { invoke } from "@tauri-apps/api/core";
import { generateSalt, hashPassword, verifyPassword } from "@/lib/security";
import { synthesizeSpeech, playAudioBlob } from "@/services/ai/ttsService";
import type { AIProvider, Language, SessionMode, TherapySchool, ThinkingLevel, ThinkingType, TTSModel, TTSVoice } from "@/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { setOnboarded, setLocked, lockEnabled, setLockEnabled: setLockEnabledGlobal } = useAppStore();
  const settings = useSettingsStore();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [apiKeyFocused, setApiKeyFocused] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileOccupation, setProfileOccupation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [transcriptKeyFocused, setTranscriptKeyFocused] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const previewStopRef = useRef<(() => void) | null>(null);
  const [searchParams] = useSearchParams();
  const validTabs = ["general", "ai", "voice", "security"] as const;
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<(typeof validTabs)[number]>(
    validTabs.includes(initialTab as any) ? (initialTab as (typeof validTabs)[number]) : "general"
  );

  // Security state
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPasswordForDeleteModal, setShowPasswordForDeleteModal] = useState(false);
  const [showDisableLockModal, setShowDisableLockModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [newHint, setNewHint] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    getUserProfile().then((profile) => {
      if (profile) {
        setProfileName(profile.name ?? "");
        setProfileAge(profile.age != null ? String(profile.age) : "");
        setProfileGender(profile.gender ?? "");
        setProfileOccupation(profile.occupation ?? "");
      }
    });
    loadSettings().then(async (store) => {
      const bio = await store.get<boolean>("biometricEnabled");
      setBiometricEnabledState(bio ?? false);
    });
    invoke<boolean>("biometric_available").then(setBiometricAvailable).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab !== "voice") {
      previewStopRef.current?.();
      previewStopRef.current = null;
      setPreviewPlaying(null);
    }
  }, [activeTab]);

  const currentProvider = getProvider(settings.provider);
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = currentProvider?.models.map((m) => ({
    value: m.id,
    label: m.id === "claude-opus-4-7" ? `${m.name} (${t.settings.recommended})` : m.name,
  })) ?? [];
  const memoryModelOptions = currentProvider?.models.map((m) => {
    const baseName = m.name.replace(` (${t.settings.recommended})`, "").replace(" (Recommended)", "").replace(" (Önerilen)", "");
    return {
      value: m.id,
      label: m.id === "claude-sonnet-4-6" ? `${baseName} (${t.settings.recommended})` : baseName,
    };
  }) ?? [];
  const showThinkingToggle = modelSupportsThinking(settings.provider, settings.model);
  const showMemoryThinkingToggle = modelSupportsThinking(settings.provider, settings.memoryModel);
  const chatRequiresAdaptive = modelRequiresAdaptiveThinking(settings.provider, settings.model);
  const memoryRequiresAdaptive = modelRequiresAdaptiveThinking(settings.provider, settings.memoryModel);
  const showAdaptiveOption = modelSupportsAdaptiveThinking(settings.provider, settings.model) && !chatRequiresAdaptive;
  const showMemoryAdaptiveOption = modelSupportsAdaptiveThinking(settings.provider, settings.memoryModel) && !memoryRequiresAdaptive;

  async function handleSave() {
    const store = await loadSettings();
    await store.set("language", settings.language);
    await store.set("provider", settings.provider);
    await store.set("apiKey", settings.apiKey);
    await store.set("providerApiKeys", settings.providerApiKeys);
    await store.set("model", settings.model);
    await store.set("theme", theme);
    await store.set("thinkingEnabled", settings.thinkingEnabled);
    await store.set("thinkingLevel", settings.thinkingLevel);
    await store.set("thinkingType", settings.thinkingType);
    // Ensure current provider's thinking settings are included in providerThinkingSettings
    const updatedThinkingSettings = {
      ...settings.providerThinkingSettings,
      [settings.provider]: { enabled: settings.thinkingEnabled, level: settings.thinkingLevel, type: settings.thinkingType },
    };
    await store.set("providerThinkingSettings", updatedThinkingSettings);
    await store.set("memoryModel", settings.memoryModel);
    await store.set("memoryThinkingEnabled", settings.memoryThinkingEnabled);
    await store.set("memoryThinkingLevel", settings.memoryThinkingLevel);
    await store.set("memoryThinkingType", settings.memoryThinkingType);
    // Ensure current provider's memory thinking settings are included
    const updatedMemoryThinkingSettings = {
      ...settings.providerMemoryThinkingSettings,
      [settings.provider]: { enabled: settings.memoryThinkingEnabled, level: settings.memoryThinkingLevel, type: settings.memoryThinkingType },
    };
    await store.set("providerMemoryThinkingSettings", updatedMemoryThinkingSettings);
    await store.set("therapySchool", settings.therapySchool);
    await store.set("transcriptApiKey", settings.transcriptApiKey);
    await store.set("ttsModel", settings.ttsModel);
    await store.set("ttsVoice", settings.ttsVoice);
    await store.set("preferredSessionMode", settings.preferredSessionMode);
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

  function handleLockApp() {
    setLocked(true);
  }

  function handleDeleteAllData() {
    if (lockEnabled) {
      setShowPasswordForDeleteModal(true);
    } else {
      setShowDeleteModal(true);
    }
  }

  async function handleVerifyPasswordForDelete() {
    const store = await loadSettings();
    const hash = await store.get<string>("passwordHash");
    const salt = await store.get<string>("passwordSalt");
    const ok = await verifyPassword(currentPw, salt ?? "", hash ?? "");
    if (ok) {
      setShowPasswordForDeleteModal(false);
      setCurrentPw("");
      setSecurityError("");
      setShowDeleteModal(true);
    } else {
      setSecurityError(t.security.wrongPassword);
    }
  }

  async function handleChangePassword() {
    const store = await loadSettings();
    const hash = await store.get<string>("passwordHash");
    const salt = await store.get<string>("passwordSalt");
    const ok = await verifyPassword(currentPw, salt ?? "", hash ?? "");
    if (!ok) {
      setSecurityError(t.security.wrongPassword);
      return;
    }
    if (newPw.length < 4) {
      setSecurityError(t.security.passwordTooShort);
      return;
    }
    if (newPw !== confirmNewPw) {
      setSecurityError(t.security.passwordMismatch);
      return;
    }
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPw, newSalt);
    await store.set("passwordHash", newHash);
    await store.set("passwordSalt", newSalt);
    await store.set("passwordHint", newHint);
    await store.save();
    setShowChangePasswordModal(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmNewPw("");
    setNewHint("");
    setSecurityError("");
    setPasswordChanged(true);
    setTimeout(() => setPasswordChanged(false), 2000);
  }

  async function handleToggleLock() {
    if (lockEnabled) {
      // Disabling lock — need password confirmation
      setShowDisableLockModal(true);
    } else {
      // Enabling lock — need to set up a password first
      setShowChangePasswordModal(true);
    }
  }

  async function handleDisableLock() {
    const store = await loadSettings();
    const hash = await store.get<string>("passwordHash");
    const salt = await store.get<string>("passwordSalt");
    const ok = await verifyPassword(currentPw, salt ?? "", hash ?? "");
    if (!ok) {
      setSecurityError(t.security.wrongPassword);
      return;
    }
    await store.set("lockEnabled", false);
    await store.set("passwordHash", "");
    await store.set("passwordSalt", "");
    await store.set("passwordHint", "");
    await store.set("biometricEnabled", false);
    await store.save();
    setLockEnabledGlobal(false);
    setBiometricEnabledState(false);
    setShowDisableLockModal(false);
    setCurrentPw("");
    setSecurityError("");
  }

  async function handleEnableLock() {
    if (newPw.length < 4) {
      setSecurityError(t.security.passwordTooShort);
      return;
    }
    if (newPw !== confirmNewPw) {
      setSecurityError(t.security.passwordMismatch);
      return;
    }
    const salt = generateSalt();
    const hash = await hashPassword(newPw, salt);
    const store = await loadSettings();
    await store.set("lockEnabled", true);
    await store.set("passwordHash", hash);
    await store.set("passwordSalt", salt);
    await store.set("passwordHint", newHint);
    await store.save();
    setLockEnabledGlobal(true);
    setShowChangePasswordModal(false);
    setNewPw("");
    setConfirmNewPw("");
    setNewHint("");
    setSecurityError("");
  }

  async function handleToggleBiometric(enabled: boolean) {
    const store = await loadSettings();
    await store.set("biometricEnabled", enabled);
    await store.save();
    setBiometricEnabledState(enabled);
  }

  async function confirmDeleteAllData() {
    if (deleteConfirmText !== t.settings.deleteConfirmText) return;
    await clearAllData();
    const store = await loadSettings();
    await store.set("isOnboarded", false);
    await store.set("hasSeenNoteTutorial", false);
    await store.set("provider", "anthropic");
    await store.set("apiKey", "");
    await store.set("providerApiKeys", {});
    await store.set("model", "claude-opus-4-6");
    await store.set("customBaseUrl", "");
    await store.set("language", "tr");
    await store.set("therapySchool", "psychodynamic");
    await store.set("thinkingEnabled", true);
    await store.set("thinkingLevel", "medium");
    await store.set("thinkingType", "budget");
    await store.set("providerThinkingSettings", {});
    await store.set("memoryModel", "claude-sonnet-4-6");
    await store.set("memoryThinkingEnabled", true);
    await store.set("memoryThinkingLevel", "medium");
    await store.set("memoryThinkingType", "budget");
    await store.set("providerMemoryThinkingSettings", {});
    await store.set("lockEnabled", false);
    await store.set("passwordHash", "");
    await store.set("passwordSalt", "");
    await store.set("passwordHint", "");
    await store.set("biometricEnabled", false);
    await store.set("transcriptApiKey", "");
    await store.set("ttsModel", "tts-1");
    await store.set("ttsVoice", "alloy");
    await store.set("preferredSessionMode", "chat");
    await store.set("customSchools", []);
    await store.set("promptOverrides", {});
    await store.save();
    setLockEnabledGlobal(false);
    setBiometricEnabledState(false);
    settings.loadFromStore({
      language: "tr" as Language,
      provider: "anthropic" as AIProvider,
      apiKey: "",
      providerApiKeys: {},
      model: "claude-opus-4-6",
      customBaseUrl: "",
      therapySchool: "psychodynamic" as TherapySchool,
      thinkingEnabled: true,
      thinkingLevel: "medium" as ThinkingLevel,
      thinkingType: "budget" as ThinkingType,
      providerThinkingSettings: {},
      memoryModel: "claude-sonnet-4-6",
      memoryThinkingEnabled: true,
      memoryThinkingLevel: "medium" as ThinkingLevel,
      memoryThinkingType: "budget" as ThinkingType,
      providerMemoryThinkingSettings: {},
      transcriptApiKey: "",
      ttsModel: "tts-1" as TTSModel,
      ttsVoice: "alloy" as TTSVoice,
      preferredSessionMode: "chat" as SessionMode,
    });
    useSchoolsStore.getState().loadFromStore({ customSchools: [], promptOverrides: {} });
    setShowDeleteModal(false);
    setOnboarded(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t.settings.title}</h1>

      <Tabs
        tabs={[
          { id: "general", label: t.settings.tabs.general },
          { id: "ai", label: t.settings.tabs.ai },
          { id: "voice", label: t.settings.tabs.voice },
          { id: "security", label: t.settings.tabs.security },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      {/* Tab: General */}
      {activeTab === "general" && (
      <div className="space-y-6">
      {/* Language */}
      <Card>
        <h2 className="font-semibold mb-4">{t.settings.language}</h2>
        <Select
          label={t.settings.languageLabel}
          options={[
            { value: "tr", label: "Türkçe" },
            { value: "en", label: "English" },
            { value: "zh", label: "中文" },
            { value: "es", label: "Español" },
            { value: "pt", label: "Português" },
            { value: "de", label: "Deutsch" },
            { value: "fr", label: "Français" },
            { value: "ja", label: "日本語" },
          ]}
          value={settings.language}
          onChange={(e) => settings.setLanguage(e.target.value as Language)}
        />
      </Card>

      {/* Personal Info */}
      <Card>
        <h2 className="font-semibold mb-4">{t.settings.personalInfo}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t.settings.name}
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder={t.settings.namePlaceholder}
          />
          <Input
            label={t.settings.age}
            type="number"
            value={profileAge}
            onChange={(e) => setProfileAge(e.target.value)}
            placeholder={t.settings.agePlaceholder}
            min={1}
            max={120}
          />
          <Select
            label={t.settings.genderLabel}
            options={[
              { value: "", label: t.gender.select },
              { value: "female", label: t.gender.female },
              { value: "male", label: t.gender.male },
              { value: "other", label: t.gender.other },
              { value: "preferNot", label: t.gender.preferNot },
            ]}
            value={profileGender}
            onChange={(e) => setProfileGender(e.target.value)}
          />
          <Input
            label={t.settings.occupation}
            value={profileOccupation}
            onChange={(e) => setProfileOccupation(e.target.value)}
            placeholder={t.settings.occupationPlaceholder}
          />
        </div>
      </Card>
      </div>
      )}

      {/* Tab: AI */}
      {activeTab === "ai" && (
      <div className="space-y-6">
      {/* AI Connection */}
      <Card>
        <h2 className="font-semibold mb-4">{t.settings.aiConnection}</h2>
        <div className="space-y-4">
          <Select
            label={t.settings.provider}
            options={providerOptions}
            value={settings.provider}
            onChange={(e) => {
              settings.setProvider(e.target.value as AIProvider);
            }}
          />

          {currentProvider?.requiresKey && (
            <Input
              label={t.settings.apiKey}
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
        <h2 className="font-semibold mb-4">{t.settings.chatModel}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          {t.settings.chatModelDescription}
        </p>
        <div className="space-y-4">
          {modelOptions.length > 0 && (
            <Select
              label={t.settings.model}
              options={modelOptions}
              value={settings.model}
              onChange={(e) => {
                settings.setModel(e.target.value);
                if (!modelSupportsThinking(settings.provider, e.target.value)) {
                  settings.setThinkingEnabled(false);
                }
                settings.setThinkingType(
                  modelRequiresAdaptiveThinking(settings.provider, e.target.value) ? "adaptive" : "budget",
                );
              }}
            />
          )}

          {showThinkingToggle && (
            <div className="pt-1">
              <Toggle
                checked={settings.thinkingEnabled}
                onChange={settings.setThinkingEnabled}
                label={t.settings.thinkingMode}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
                {t.settings.thinkingModeDescription}
              </p>
            </div>
          )}

          {showThinkingToggle && settings.thinkingEnabled && showAdaptiveOption && (
            <div>
              <Select
                label={t.settings.thinkingType}
                options={[
                  { value: "budget", label: t.settings.thinkingTypeBudget },
                  { value: "adaptive", label: t.settings.thinkingTypeAdaptive },
                ]}
                value={settings.thinkingType}
                onChange={(e) => settings.setThinkingType(e.target.value as ThinkingType)}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {settings.thinkingType === "adaptive" ? t.settings.thinkingTypeAdaptiveDesc : t.settings.thinkingTypeBudgetDesc}
              </p>
            </div>
          )}

          {showThinkingToggle && settings.thinkingEnabled && (
            <Select
              label={t.settings.thinkingLevel}
              options={[
                { value: "low", label: t.settings.thinkingLow },
                { value: "medium", label: t.settings.thinkingMedium },
                { value: "high", label: t.settings.thinkingHigh },
                ...(settings.provider !== "openai" ? [{ value: "max", label: t.settings.thinkingMax }] : []),
              ]}
              value={settings.thinkingLevel}
              onChange={(e) => settings.setThinkingLevel(e.target.value as ThinkingLevel)}
            />
          )}
        </div>
      </Card>

      {/* Memory Model */}
      <Card>
        <h2 className="font-semibold mb-4">{t.settings.memoryModel}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          {t.settings.memoryModelDescription}
        </p>
        <div className="space-y-4">
          {modelOptions.length > 0 && (
            <Select
              label={t.settings.model}
              options={memoryModelOptions}
              value={settings.memoryModel}
              onChange={(e) => {
                settings.setMemoryModel(e.target.value);
                if (!modelSupportsThinking(settings.provider, e.target.value)) {
                  settings.setMemoryThinkingEnabled(false);
                }
                settings.setMemoryThinkingType(
                  modelRequiresAdaptiveThinking(settings.provider, e.target.value) ? "adaptive" : "budget",
                );
              }}
            />
          )}

          {showMemoryThinkingToggle && (
            <div className="pt-1">
              <Toggle
                checked={settings.memoryThinkingEnabled}
                onChange={settings.setMemoryThinkingEnabled}
                label={t.settings.thinkingMode}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
                {t.settings.memoryThinkingDescription}
              </p>
            </div>
          )}

          {showMemoryThinkingToggle && settings.memoryThinkingEnabled && showMemoryAdaptiveOption && (
            <div>
              <Select
                label={t.settings.thinkingType}
                options={[
                  { value: "budget", label: t.settings.thinkingTypeBudget },
                  { value: "adaptive", label: t.settings.thinkingTypeAdaptive },
                ]}
                value={settings.memoryThinkingType}
                onChange={(e) => settings.setMemoryThinkingType(e.target.value as ThinkingType)}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {settings.memoryThinkingType === "adaptive" ? t.settings.thinkingTypeAdaptiveDesc : t.settings.thinkingTypeBudgetDesc}
              </p>
            </div>
          )}

          {showMemoryThinkingToggle && settings.memoryThinkingEnabled && (
            <Select
              label={t.settings.thinkingLevel}
              options={[
                { value: "low", label: t.settings.thinkingLow },
                { value: "medium", label: t.settings.thinkingMedium },
                { value: "high", label: t.settings.thinkingHigh },
                ...(settings.provider !== "openai" ? [{ value: "max", label: t.settings.thinkingMax }] : []),
              ]}
              value={settings.memoryThinkingLevel}
              onChange={(e) => settings.setMemoryThinkingLevel(e.target.value as ThinkingLevel)}
            />
          )}
        </div>
      </Card>
      </div>
      )}

      {/* Tab: Voice */}
      {activeTab === "voice" && (
      <div className="space-y-6">
      {/* Transcript Settings */}
      <Card>
        <h2 className="font-semibold mb-2">{t.transcript.title}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          {t.transcript.description}
        </p>
        <Input
          label={t.transcript.openaiApiKey}
          value={
            transcriptKeyFocused || !settings.transcriptApiKey
              ? settings.transcriptApiKey
              : settings.transcriptApiKey.length > 10
                ? settings.transcriptApiKey.slice(0, 5) + "\u2022".repeat(Math.min(settings.transcriptApiKey.length - 10, 20)) + settings.transcriptApiKey.slice(-5)
                : settings.transcriptApiKey
          }
          onChange={(e) => settings.setTranscriptApiKey(e.target.value)}
          onFocus={() => setTranscriptKeyFocused(true)}
          onBlur={() => setTranscriptKeyFocused(false)}
          placeholder="sk-..."
        />
      </Card>

      {/* Voice Settings */}
      <Card>
        <h2 className="font-semibold mb-2">{t.voice.title}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          {t.voice.description}
        </p>
        <div className="space-y-4">
          <Select
            label={t.voice.ttsModel}
            options={[
              { value: "tts-1", label: "TTS-1 ($0.015/1K chars)" },
              { value: "tts-1-hd", label: "TTS-1 HD ($0.030/1K chars)" },
            ]}
            value={settings.ttsModel}
            onChange={(e) => settings.setTtsModel(e.target.value as TTSModel)}
          />
          <p className="text-xs text-[var(--text-muted)] -mt-2">
            {t.voice.ttsModelDescription}
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              {t.voice.voiceSelect}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => settings.setTtsVoice(v)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${
                    settings.ttsVoice === v
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <span className="capitalize font-medium">{v}</span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (previewPlaying || !settings.transcriptApiKey) return;
                      previewStopRef.current?.();
                      setPreviewPlaying(v);
                      try {
                        const result = await synthesizeSpeech(
                          t.voice.previewText,
                          settings.transcriptApiKey,
                          settings.ttsModel,
                          v,
                        );
                        const playback = playAudioBlob(result.audioBlob);
                        previewStopRef.current = playback.stop;
                        await playback.promise;
                      } catch (err) {
                        console.error("Preview failed:", err);
                      }
                      setPreviewPlaying(null);
                      previewStopRef.current = null;
                    }}
                    disabled={previewPlaying !== null || !settings.transcriptApiKey}
                    className="text-xs text-primary-500 hover:text-primary-400 disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
                  >
                    {previewPlaying === v ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </button>
              ))}
            </div>
            {!settings.transcriptApiKey && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t.transcript.openaiApiKey}
              </p>
            )}
          </div>
        </div>
      </Card>
      </div>
      )}

      {/* Tab: Security */}
      {activeTab === "security" && (
      <div className="space-y-6">
      {/* Security */}
      <Card>
        <h2 className="font-semibold mb-2">{t.security.appLock}</h2>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          {t.security.appLockDescription}
        </p>

        <Toggle
          checked={lockEnabled}
          onChange={handleToggleLock}
          label={lockEnabled ? t.security.disableLock : t.security.enableLock}
        />

        {lockEnabled && (
          <div className="mt-5 space-y-5">
            {/* Biometric */}
            {biometricAvailable && (
              <div>
                <Toggle
                  checked={biometricEnabled}
                  onChange={handleToggleBiometric}
                  label={t.security.biometricToggle}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
                  {t.security.biometricDescription}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-[var(--border-color)] pt-5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setSecurityError("");
                  setCurrentPw("");
                  setNewPw("");
                  setConfirmNewPw("");
                  setNewHint("");
                }}
              >
                <Lock className="w-4 h-4" />
                {t.security.changePassword}
              </Button>

              <Button variant="secondary" size="sm" onClick={handleLockApp}>
                <Shield className="w-4 h-4" />
                {t.security.lockApp}
              </Button>

              {passwordChanged && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" /> {t.security.passwordChanged}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <Card className="border-red-900">
        <h2 className="font-semibold mb-2 text-red-600">{t.settings.dangerZone}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {t.settings.dangerDescription}
        </p>
        <Button variant="danger" size="sm" onClick={handleDeleteAllData}>
          {t.settings.deleteAllData}
        </Button>
      </Card>
      </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" />
          {t.common.save}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" /> {t.settings.saved}
          </span>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
        title={t.settings.deleteAllDataTitle}
      >
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {t.settings.deleteAllDataDescription}
        </p>
        <p className="text-sm mb-2">
          {t.settings.deleteConfirmInstruction} <strong>"{t.settings.deleteConfirmText}"</strong>
        </p>
        <Input
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder={t.settings.deleteConfirmText}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" size="sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}>
            {t.settings.cancelDelete}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={deleteConfirmText !== t.settings.deleteConfirmText}
            onClick={confirmDeleteAllData}
          >
            {t.settings.permanentlyDelete}
          </Button>
        </div>
      </Modal>

      {/* Change Password / Enable Lock Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => { setShowChangePasswordModal(false); setSecurityError(""); setCurrentPw(""); setNewPw(""); setConfirmNewPw(""); setNewHint(""); }}
        title={lockEnabled ? t.security.changePassword : t.security.setupPassword}
      >
        <div className="space-y-4">
          {lockEnabled && (
            <Input
              label={t.security.currentPassword}
              type="password"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setSecurityError(""); }}
            />
          )}
          <Input
            label={lockEnabled ? t.security.newPassword : t.security.password}
            type="password"
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setSecurityError(""); }}
            error={newPw.length > 0 && newPw.length < 4 ? t.security.passwordTooShort : ""}
          />
          <Input
            label={t.security.confirmPassword}
            type="password"
            value={confirmNewPw}
            onChange={(e) => { setConfirmNewPw(e.target.value); setSecurityError(""); }}
            error={confirmNewPw.length > 0 && newPw !== confirmNewPw ? t.security.passwordMismatch : ""}
          />
          <Input
            label={t.security.passwordHint}
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            placeholder={t.security.hintPlaceholder}
          />
          {securityError && <p className="text-sm text-red-500">{securityError}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => { setShowChangePasswordModal(false); setSecurityError(""); }}>
              {t.common.cancel}
            </Button>
            <Button
              size="sm"
              disabled={newPw.length < 4 || newPw !== confirmNewPw}
              onClick={lockEnabled ? handleChangePassword : handleEnableLock}
            >
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disable Lock Modal */}
      <Modal
        isOpen={showDisableLockModal}
        onClose={() => { setShowDisableLockModal(false); setSecurityError(""); setCurrentPw(""); }}
        title={t.security.disableLock}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {t.security.confirmDisable}
          </p>
          <Input
            label={t.security.password}
            type="password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setSecurityError(""); }}
          />
          {securityError && <p className="text-sm text-red-500">{securityError}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => { setShowDisableLockModal(false); setSecurityError(""); setCurrentPw(""); }}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" size="sm" disabled={!currentPw} onClick={handleDisableLock}>
              {t.security.disableLock}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password for Delete Modal */}
      <Modal
        isOpen={showPasswordForDeleteModal}
        onClose={() => { setShowPasswordForDeleteModal(false); setSecurityError(""); setCurrentPw(""); }}
        title={t.security.passwordRequired}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {t.security.passwordRequired}
          </p>
          <Input
            label={t.security.password}
            type="password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setSecurityError(""); }}
          />
          {securityError && <p className="text-sm text-red-500">{securityError}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => { setShowPasswordForDeleteModal(false); setSecurityError(""); setCurrentPw(""); }}>
              {t.common.cancel}
            </Button>
            <Button size="sm" disabled={!currentPw} onClick={handleVerifyPasswordForDelete}>
              {t.common.continue}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
