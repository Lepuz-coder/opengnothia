import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, View } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import type { PatientIntakeForm, PatientIntakeFormField } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button } from "@/ui";

type FormState = Record<PatientIntakeFormField, string>;

const EMPTY_FORM: FormState = {
  reason_for_seeking: "",
  current_concerns: "",
  previous_therapy: "",
  current_medications: "",
  family_relationships: "",
  significant_life_events: "",
  sleep_patterns: "",
  physical_health: "",
  strengths_support: "",
  therapy_expectations: "",
};

const TOTAL_STEPS = 10;

function formFromInitial(initial: PatientIntakeForm | null): FormState {
  if (!initial) return { ...EMPTY_FORM };
  const out: FormState = { ...EMPTY_FORM };
  (Object.keys(EMPTY_FORM) as PatientIntakeFormField[]).forEach((key) => {
    out[key] = initial[key] ?? "";
  });
  return out;
}

function toPayload(state: FormState): Partial<PatientIntakeForm> {
  const payload: Partial<PatientIntakeForm> = {};
  (Object.keys(state) as PatientIntakeFormField[]).forEach((key) => {
    const value = state[key].trim();
    payload[key] = value.length > 0 ? value : null;
  });
  return payload;
}

interface IntakeFormSheetProps {
  visible: boolean;
  initialData: PatientIntakeForm | null;
  allowSkip: boolean;
  /** First-session nudge variant (M11: paywall-skippers complete intake here). */
  isFirstSessionPrompt: boolean;
  onClose: () => void;
  onSaved: (form: PatientIntakeForm | null, didSave: boolean) => void;
}

/**
 * Desktop's IntakeFormModal on a page sheet: one question per step, progress
 * on top, every navigation autosaves — closing halfway loses nothing, and the
 * resume step lives in the settings store (desktop keeps it in the Tauri
 * store).
 */
export function IntakeFormSheet({
  visible,
  initialData,
  allowSkip,
  isFirstSessionPrompt,
  onClose,
  onSaved,
}: IntakeFormSheetProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [form, setForm] = useState<FormState>(() => formFromInitial(initialData));
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(formFromInitial(initialData));
    const saved = useSettingsStore.getState().intakeLastStep;
    setStepIndex(saved >= 0 && saved < TOTAL_STEPS ? saved : 0);
  }, [visible, initialData]);

  const fields: { key: PatientIntakeFormField; question: string }[] = useMemo(
    () => [
      { key: "reason_for_seeking", question: t.session.intakeFieldReasonPlaceholder },
      { key: "current_concerns", question: t.session.intakeFieldConcernsPlaceholder },
      { key: "previous_therapy", question: t.session.intakeFieldPreviousTherapyPlaceholder },
      { key: "current_medications", question: t.session.intakeFieldMedicationsPlaceholder },
      { key: "family_relationships", question: t.session.intakeFieldFamilyPlaceholder },
      { key: "significant_life_events", question: t.session.intakeFieldLifeEventsPlaceholder },
      { key: "sleep_patterns", question: t.session.intakeFieldSleepPlaceholder },
      { key: "physical_health", question: t.session.intakeFieldPhysicalHealthPlaceholder },
      { key: "strengths_support", question: t.session.intakeFieldStrengthsPlaceholder },
      { key: "therapy_expectations", question: t.session.intakeFieldExpectationsPlaceholder },
    ],
    [t],
  );

  const currentField = fields[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / TOTAL_STEPS) * 100);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOTAL_STEPS - 1;

  const persist = async () => {
    const queries = await getQueries();
    await queries.upsertPatientIntakeForm(toPayload(form));
  };

  const goTo = async (next: number) => {
    if (saving) return;
    setStepIndex(next);
    useSettingsStore.getState().setIntakeLastStep(next);
    await persist();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist();
      useSettingsStore.getState().setIntakeLastStep(0);
      const queries = await getQueries();
      const latest = await queries.getPatientIntakeForm();
      onSaved(latest, true);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (saving) return;
    await persist();
    useSettingsStore.getState().setIntakeLastStep(stepIndex);
    const queries = await getQueries();
    const latest = await queries.getPatientIntakeForm();
    onSaved(latest, false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
        {/* Header: skip/cancel · title */}
        <View className="flex-row items-center border-b border-line px-3 py-2.5">
          <Button variant="ghost" size="sm" onPress={handleClose} disabled={saving}>
            {allowSkip ? t.session.intakeSkipButton : t.session.intakeCancelButton}
          </Button>
          <Text className="mx-2 flex-1 text-center text-base font-semibold text-ink" numberOfLines={1}>
            {isFirstSessionPrompt ? t.session.intakeFirstSessionTitle : t.session.intakeModalTitle}
          </Text>
          {/* Balances the left button so the title stays centered. */}
          <View style={{ width: 76 }} />
        </View>

        <View className="flex-1 px-5 pt-4">
          {isFirst && (
            <Text className="mb-4 text-sm leading-relaxed text-ink-mute">
              {isFirstSessionPrompt ? t.session.intakeFirstSessionDescription : t.session.intakeModalDescription}
            </Text>
          )}

          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-ink-soft">
              {t.session.intakeQuestionLabel} {stepIndex + 1} / {TOTAL_STEPS}
            </Text>
            <Text className="text-xs text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
              {progressPct}%
            </Text>
          </View>
          <View className="mb-5 h-1.5 overflow-hidden rounded-full bg-raised">
            <View className="h-full rounded-full bg-primary-500" style={{ width: `${progressPct}%` }} />
          </View>

          <Text className="mb-3 text-lg font-medium leading-relaxed text-ink">{currentField.question}</Text>
          <TextInput
            key={currentField.key}
            multiline
            autoFocus
            value={form[currentField.key]}
            onChangeText={(value) => setForm((prev) => ({ ...prev, [currentField.key]: value }))}
            placeholderTextColor={colors.inkMute}
            textAlignVertical="top"
            className="min-h-[140px] flex-1 rounded-xl border border-line bg-card px-4 py-3 text-base leading-relaxed text-ink"
          />
        </View>

        <View className="flex-row items-center justify-between border-t border-line px-4 py-3">
          {isFirst ? (
            <View />
          ) : (
            <Button variant="ghost" onPress={() => goTo(stepIndex - 1)} disabled={saving} icon={<ArrowLeft size={16} color={colors.inkMute} />}>
              {t.session.intakePreviousButton}
            </Button>
          )}
          {isLast ? (
            <Button onPress={handleSave} loading={saving}>
              {t.session.intakeSaveButton}
            </Button>
          ) : (
            <Button onPress={() => goTo(stepIndex + 1)} disabled={saving} icon={<ArrowRight size={16} color="#fff" />}>
              {t.session.intakeNextButton}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
