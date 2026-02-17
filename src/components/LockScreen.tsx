import { useState, useEffect } from "react";
import { Brain, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/i18n";
import { invoke } from "@tauri-apps/api/core";
import { verifyPassword } from "@/lib/security";
import { loadSettings } from "@/lib/store";

export function LockScreen() {
  const { t } = useTranslation();
  const { setLocked } = useAppStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hashData, setHashData] = useState({ hash: "", salt: "" });

  useEffect(() => {
    loadSettings().then(async (store) => {
      const hash = await store.get<string>("passwordHash");
      const salt = await store.get<string>("passwordSalt");
      const pHint = await store.get<string>("passwordHint");
      const bio = await store.get<boolean>("biometricEnabled");
      setHashData({ hash: hash ?? "", salt: salt ?? "" });
      setHint(pHint ?? "");
      setBiometricEnabled(bio ?? false);
    });
    invoke<boolean>("biometric_available").then(setBiometricAvailable).catch(() => {});
  }, []);

  async function handleUnlock() {
    if (!password) return;
    const ok = await verifyPassword(password, hashData.salt, hashData.hash);
    if (ok) {
      setLocked(false);
    } else {
      setError(t.security.wrongPassword);
      setPassword("");
    }
  }

  async function handleBiometric() {
    try {
      await invoke("biometric_authenticate", { reason: t.security.biometricPrompt });
      setLocked(false);
    } catch {
      // User cancelled or biometric failed — do nothing
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleUnlock();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
          OpenGnothia
        </span>
      </div>

      <div className="w-full max-w-sm px-6">
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8 shadow-lg space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {t.security.enterPassword}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {t.security.passwordRequired}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={t.security.password}
              error={error}
              autoFocus
            />

            <Button onClick={handleUnlock} disabled={!password} className="w-full">
              {t.security.enterPassword}
            </Button>

            {biometricEnabled && biometricAvailable && (
              <Button variant="secondary" onClick={handleBiometric} className="w-full">
                <Fingerprint className="w-4 h-4" />
                {t.security.unlockWithBiometric}
              </Button>
            )}
          </div>

          {hint && (
            <div className="text-center">
              {showHint ? (
                <p className="text-sm text-[var(--text-muted)]">
                  {hint}
                </p>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {t.security.showHint}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
