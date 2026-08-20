import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Check, RefreshCw, Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { getLocalizedSchoolQuiz } from "@opengnothia/shared/i18n/schoolQuiz";
import { getTherapySchool } from "@opengnothia/shared/constants/therapySchools";
import {
  SCHOOL_QUIZ_QUESTIONS,
  scoreSchoolQuiz,
  type SchoolQuizAnswers,
  type SchoolQuizSchool,
} from "@opengnothia/shared/constants/schoolQuiz";
import { cn } from "@opengnothia/shared/lib/cn";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";

interface SchoolQuizFlowProps {
  /** Result screen's primary action label — continue (onboarding) or save (settings retake). */
  completeLabel: string;
  /** Back from the first question: leave the quiz (previous step / close the modal). */
  onCancel: () => void;
  onComplete: (school: SchoolQuizSchool) => void;
}

/** Brief selected-state flash before advancing, so the tap lands visibly. */
const ADVANCE_DELAY_MS = 220;

/**
 * M2: the school quiz — question stepper plus result screen. The result offers
 * exactly two ways out: accept, or retake from scratch. No alternative-school
 * card, no back-editing single answers; a change of mind reruns the quiz.
 * The chosen school is saved to the settings store on accept, not on compute,
 * so a dismissed retake keeps the previous school.
 */
export function SchoolQuizFlow({ completeLabel, onCancel, onComplete }: SchoolQuizFlowProps) {
  const { t, language } = useTranslation();
  const { colors } = useThemeColors();
  const texts = getLocalizedSchoolQuiz(language);
  const setSchoolId = useSettingsStore((s) => s.setSchoolId);

  const [answers, setAnswers] = useState<SchoolQuizAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<SchoolQuizSchool | null>(null);
  const advancingRef = useRef(false);

  const totalSteps = SCHOOL_QUIZ_QUESTIONS.length;
  const question = SCHOOL_QUIZ_QUESTIONS[stepIndex];
  const questionTexts = texts.questions[question.id];

  const pickOption = (optionId: string) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const nextAnswers = { ...answers, [question.id]: optionId };
    setAnswers(nextAnswers);
    setTimeout(() => {
      advancingRef.current = false;
      if (stepIndex + 1 < totalSteps) {
        setStepIndex(stepIndex + 1);
      } else {
        setResult(scoreSchoolQuiz(nextAnswers).school);
      }
    }, ADVANCE_DELAY_MS);
  };

  const retake = () => {
    setAnswers({});
    setStepIndex(0);
    setResult(null);
  };

  const accept = () => {
    if (result === null) return;
    setSchoolId(result);
    onComplete(result);
  };

  if (result !== null) {
    const school = getTherapySchool(result, language);
    return (
      <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-4 px-5 py-6">
        <View className="items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-primary-100 dark:bg-primary-900/40">
            <Sparkles size={30} color={colors.tint} />
          </View>
          <Text className="text-center text-sm font-medium uppercase tracking-widest text-ink-mute">
            {texts.resultTitle}
          </Text>
          <Text className="mt-2 text-center text-3xl font-bold text-ink">{school?.name ?? result}</Text>
          {school && (
            <Text className="mt-3 text-center text-base leading-relaxed text-ink-soft">
              {school.description}
            </Text>
          )}
        </View>

        <Card>
          <Text className="text-sm font-semibold text-ink">{texts.resultWhyTitle}</Text>
          <Text className="mt-2 text-sm leading-relaxed text-ink-soft">{texts.reasons[result]}</Text>
        </Card>

        <View className="mt-2 gap-2">
          <Button size="lg" onPress={accept}>
            {completeLabel}
          </Button>
          <Button
            variant="ghost"
            onPress={retake}
            icon={<RefreshCw size={16} color={colors.inkMute} />}
          >
            {texts.retakeButton}
          </Button>
        </View>
      </ScrollView>
    );
  }

  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          onPress={() => (stepIndex === 0 ? onCancel() : setStepIndex(stepIndex - 1))}
          className="rounded-full bg-raised p-2 active:bg-line"
        >
          <ArrowLeft size={18} color={colors.inkMute} />
        </Pressable>
        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
          <View className="h-full rounded-full bg-primary-500" style={{ width: `${progressPct}%` }} />
        </View>
        <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
          {texts.progress
            .replace("{current}", String(stepIndex + 1))
            .replace("{total}", String(totalSteps))}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 py-4">
        {stepIndex === 0 && (
          <Text className="text-sm leading-relaxed text-ink-mute">{texts.intro}</Text>
        )}
        <Text className="text-xl font-semibold leading-relaxed text-ink">{questionTexts.text}</Text>
        <View className="gap-2.5">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => pickOption(option.id)}
                className={cn(
                  "flex-row items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3.5 active:opacity-90",
                  selected ? "border-tint" : "border-line"
                )}
              >
                <Text className="flex-1 text-[15px] leading-snug text-ink">
                  {questionTexts.options[option.id]}
                </Text>
                {selected && <Check size={18} color={colors.tint} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
