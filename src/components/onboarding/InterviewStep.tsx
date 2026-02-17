import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "@/i18n";
import type { Translations } from "@/i18n";

interface InterviewStepProps {
  onNext: (data: {
    name: string;
    age: number | null;
    gender: string;
    occupation: string;
    goals: string[];
    approach: string;
    sessionTime: string;
  }) => void;
  onBack: () => void;
}

const goalKeys: (keyof Translations["goals"])[] = [
  "stress_management",
  "self_discovery",
  "relationships",
  "self_esteem",
  "grief",
  "work_stress",
  "sleep",
  "motivation",
  "emotion_regulation",
  "general_support",
];

export function InterviewStep({ onNext, onBack }: InterviewStepProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { approach, preferredSessionTime, setPreferredSessionTime } = useSettingsStore();

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{t.onboarding.getToKnow}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t.onboarding.getToKnowDescription}
        </p>
      </div>

      {/* Personal Info */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t.onboarding.yourName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.onboarding.yourNamePlaceholder}
        />
        <Input
          label={t.settings.age}
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
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
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <Input
          label={t.settings.occupation}
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder={t.settings.occupationPlaceholder}
        />
      </div>

      {/* Goals */}
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          {t.onboarding.whatBroughtYou}
        </p>
        <div className="flex flex-wrap gap-2">
          {goalKeys.map((key) => (
            <Badge
              key={key}
              selected={selectedGoals.includes(key)}
              onClick={() => toggleGoal(key)}
            >
              {t.goals[key]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Session time */}
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          {t.onboarding.preferredSessionTime}
        </p>
        <input
          type="time"
          value={preferredSessionTime}
          onChange={(e) => setPreferredSessionTime(e.target.value)}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          {t.common.back}
        </Button>
        <Button
          onClick={() => onNext({
            name: name.trim(),
            age: age ? parseInt(age, 10) : null,
            gender,
            occupation: occupation.trim(),
            goals: selectedGoals,
            approach,
            sessionTime: preferredSessionTime,
          })}
          disabled={selectedGoals.length === 0 || !name.trim()}
          className="flex-1"
        >
          {t.common.continue}
        </Button>
      </div>
    </div>
  );
}
