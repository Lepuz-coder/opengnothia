import { Pressable, Text, View } from "react-native";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { countFilledIntakeFields, INTAKE_FORM_TOTAL_FIELDS, intakeFormHasContent } from "@opengnothia/shared/db/queries";
import type { PatientIntakeForm } from "@opengnothia/shared/types";
import { useThemeColors } from "@/theme/useAppTheme";
import { Card } from "@/ui";

interface IntakeCardProps {
  intakeForm: PatientIntakeForm | null;
  onPress: () => void;
}

/**
 * Desktop's IntakeFormCTA + IntakeFormSummaryCard merged into one tappable
 * card with three states: empty (fill it in), in progress (n/10 + continue),
 * complete (preview + edit).
 */
export function IntakeCard({ intakeForm, onPress }: IntakeCardProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  const hasContent = intakeFormHasContent(intakeForm);
  const filledCount = countFilledIntakeFields(intakeForm);
  const isComplete = filledCount >= INTAKE_FORM_TOTAL_FIELDS;
  const progressPct = Math.round((filledCount / INTAKE_FORM_TOTAL_FIELDS) * 100);

  const preview =
    intakeForm?.reason_for_seeking?.trim() ||
    intakeForm?.current_concerns?.trim() ||
    intakeForm?.therapy_expectations?.trim() ||
    "";

  if (!hasContent) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
        <Card className="border-accent-500/30 bg-accent-500/10">
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15">
              <ClipboardList size={24} color={colors.accent} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
                {t.session.intakeCtaLabel}
              </Text>
              <Text className="mt-0.5 text-base font-bold text-ink">{t.session.intakeCtaTitle}</Text>
              <Text className="mt-0.5 text-xs text-ink-mute">{t.session.intakeCtaSubtitle}</Text>
            </View>
            <ArrowRight size={18} color={colors.inkMute} />
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      <Card>
        <View className="flex-row items-start gap-3">
          <View
            className={
              isComplete
                ? "h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15"
                : "h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15"
            }
          >
            {isComplete ? (
              <CheckCircle2 size={20} color={colors.accent} />
            ) : (
              <ClipboardList size={20} color={colors.tint} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-ink">
              {isComplete ? t.session.intakeSavedTitle : t.session.intakeInProgressTitle}
            </Text>
            {isComplete ? (
              preview !== "" && (
                <Text className="mt-1 text-xs text-ink-mute" numberOfLines={2}>
                  {t.session.intakeSavedPreviewLabel}: {preview}
                </Text>
              )
            ) : (
              <View className="mt-2">
                <View className="flex-row items-center gap-3">
                  <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                    <View className="h-full rounded-full bg-primary-500" style={{ width: `${progressPct}%` }} />
                  </View>
                  <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
                    {progressPct}%
                  </Text>
                </View>
                <Text className="mt-1.5 text-xs text-ink-mute">
                  {t.session.intakeProgressCountLabel
                    .replace("{filled}", String(filledCount))
                    .replace("{total}", String(INTAKE_FORM_TOTAL_FIELDS))}
                </Text>
              </View>
            )}
          </View>
          <Text className="self-center text-xs font-medium text-primary-600 dark:text-primary-400">
            {isComplete ? t.session.intakeEditButton : t.session.intakeContinueButton}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
