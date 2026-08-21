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
 *
 * Empty and in-progress share the promo shell ported from IntakeFormCTA:
 * accent border, breathing-glow circle (static here), eyebrow label, bold
 * title, the same subtitle copy, and a full-width CTA. The whole card is one
 * Pressable, so the "button" is purely visual.
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

  if (!isComplete) {
    const inProgress = hasContent;
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
        <Card className="overflow-hidden rounded-3xl border-accent-500/20 p-5">
          <View className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent-500/5" />
          <View className="absolute -right-6 -top-14 h-40 w-40 rounded-full bg-accent-500/10" />

          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/20">
              <ClipboardList size={26} color={colors.accent} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
                {t.session.intakeCtaLabel}
              </Text>
              <Text className="mt-1 text-lg font-bold leading-snug text-ink">
                {inProgress ? t.session.intakeInProgressTitle : t.session.intakeCtaTitle}
              </Text>
            </View>
          </View>

          <Text className="mt-3 text-[13px] leading-relaxed text-ink-mute">{t.session.intakeCtaSubtitle}</Text>

          {inProgress && (
            <View className="mt-3">
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

          <View className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5">
            <Text className="text-base font-medium text-white">
              {inProgress ? t.session.intakeContinueButton : t.session.intakeCtaButton}
            </Text>
            <ArrowRight size={18} color="#fff" />
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      <Card>
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15">
            <CheckCircle2 size={20} color={colors.accent} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-ink">{t.session.intakeSavedTitle}</Text>
            {preview !== "" && (
              <Text className="mt-1 text-xs text-ink-mute" numberOfLines={2}>
                {t.session.intakeSavedPreviewLabel}: {preview}
              </Text>
            )}
          </View>
          <Text className="self-center text-xs font-medium text-primary-600 dark:text-primary-400">
            {t.session.intakeEditButton}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
