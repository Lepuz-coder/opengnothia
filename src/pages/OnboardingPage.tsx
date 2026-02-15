import { useState } from "react";
import { loadSettings } from "@/lib/store";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { upsertUserProfile } from "@/services/db/queries";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { ApiSetupStep } from "@/components/onboarding/ApiSetupStep";
import { InterviewStep } from "@/components/onboarding/InterviewStep";
import { ReadyStep } from "@/components/onboarding/ReadyStep";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { setOnboarded } = useAppStore();
  const { provider, apiKey, model, approach, preferredSessionTime, sessionDurationMinutes } = useSettingsStore();

  async function handleComplete() {
    // Save settings to store
    const store = await loadSettings();
    await store.set("isOnboarded", true);
    await store.set("provider", provider);
    await store.set("apiKey", apiKey);
    await store.set("providerApiKeys", { [provider]: apiKey });
    await store.set("model", model);
    await store.save();

    // Save user profile to DB
    await upsertUserProfile({
      approach,
      preferred_session_time: preferredSessionTime,
      session_duration_minutes: sessionDurationMinutes,
    });

    setOnboarded(true);
  }

  async function handleInterviewNext(data: {
    name: string;
    age: number | null;
    gender: string;
    occupation: string;
    goals: string[];
    approach: string;
    sessionTime: string;
  }) {
    await upsertUserProfile({
      name: data.name,
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
      goals: data.goals,
      approach: data.approach as any,
      preferred_session_time: data.sessionTime,
    });
    setStep(3);
  }

  return (
    <OnboardingShell step={step} totalSteps={4}>
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <ApiSetupStep onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <InterviewStep onNext={handleInterviewNext} onBack={() => setStep(1)} />}
      {step === 3 && <ReadyStep onComplete={handleComplete} />}
    </OnboardingShell>
  );
}
