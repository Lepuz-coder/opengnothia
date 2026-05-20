import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/i18n";
import { generateSalt, hashPassword } from "@/lib/security";
import { invoke } from "@tauri-apps/api/core";
import { loadSettings } from "@/lib/store";

interface SecuritySetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SecuritySetupStep({ onNext, onBack }: SecuritySetupStepProps) {
  const { t } = useTranslation();
  const { setLockEnabled } = useAppStore();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [hint, setHint] = useState("");
  const [biometric, setBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    invoke<boolean>("biometric_available").then(setBiometricAvailable).catch(() => {});
  }, []);

  const passwordError =
    password.length > 0 && password.length < 4
      ? t.security.passwordTooShort
      : "";
  const mismatchError =
    confirmPw.length > 0 && password !== confirmPw
      ? t.security.passwordMismatch
      : "";
  const canProceed =
    password.length >= 4 && confirmPw === password && !error;

  async function handleSetPassword() {
    if (!canProceed) return;
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    const store = await loadSettings();
    await store.set("lockEnabled", true);
    await store.set("passwordHash", hash);
    await store.set("passwordSalt", salt);
    await store.set("passwordHint", hint);
    await store.set("biometricEnabled", biometric);
    await store.save();
    setLockEnabled(true);
    onNext();
  }

  async function handleSkip() {
    const store = await loadSettings();
    await store.set("lockEnabled", false);
    await store.set("passwordHash", "");
    await store.set("passwordSalt", "");
    await store.set("passwordHint", "");
    await store.set("biometricEnabled", false);
    await store.save();
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {t.security.setupPassword}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t.security.setupPasswordDescription}
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label={t.security.password}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          error={passwordError}
        />
        <Input
          label={t.security.confirmPassword}
          type="password"
          value={confirmPw}
          onChange={(e) => {
            setConfirmPw(e.target.value);
            setError("");
          }}
          error={mismatchError}
        />
        <Input
          label={t.security.passwordHint}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder={t.security.hintPlaceholder}
        />

        {biometricAvailable && (
          <div className="border-t border-[var(--border-color)] pt-4">
            <Toggle
              checked={biometric}
              onChange={setBiometric}
              label={t.security.biometricToggle}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1 ml-14">
              {t.security.biometricDescription}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          {t.common.back}
        </Button>
        <Button
          onClick={handleSetPassword}
          disabled={!canProceed}
          className="flex-1"
        >
          {t.common.continue}
        </Button>
      </div>

      <button
        onClick={handleSkip}
        className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {t.security.skipSetup}
        <span className="block text-xs mt-0.5">
          {t.security.skipSetupDescription}
        </span>
      </button>
    </div>
  );
}
