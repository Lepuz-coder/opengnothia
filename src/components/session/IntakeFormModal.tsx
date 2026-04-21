import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { loadSettings } from "@/lib/store";
import { upsertPatientIntakeForm, getPatientIntakeForm } from "@/services/db/queries";
import type { PatientIntakeForm, PatientIntakeFormField } from "@/types";

interface IntakeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (form: PatientIntakeForm | null, didSave: boolean) => void;
  allowSkip: boolean;
  initialData: PatientIntakeForm | null;
  titleOverride?: string;
  descriptionOverride?: string;
}

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

async function persistStepIndex(step: number) {
  const store = await loadSettings();
  await store.set("intakeFormLastStep", step);
  await store.save();
}

export function IntakeFormModal({
  isOpen,
  onClose,
  onSaved,
  allowSkip,
  initialData,
  titleOverride,
  descriptionOverride,
}: IntakeFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() => formFromInitial(initialData));
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const nextForm = formFromInitial(initialData);
      let resumeStep = 0;
      try {
        const store = await loadSettings();
        const saved = await store.get<number>("intakeFormLastStep");
        if (typeof saved === "number" && saved >= 0 && saved < TOTAL_STEPS) {
          resumeStep = saved;
        }
      } catch {
        resumeStep = 0;
      }
      if (cancelled) return;
      setForm(nextForm);
      setStepIndex(resumeStep);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialData]);

  const fields: { key: PatientIntakeFormField; label: string; placeholder: string }[] = useMemo(
    () => [
      { key: "reason_for_seeking", label: t.session.intakeFieldReasonLabel, placeholder: t.session.intakeFieldReasonPlaceholder },
      { key: "current_concerns", label: t.session.intakeFieldConcernsLabel, placeholder: t.session.intakeFieldConcernsPlaceholder },
      { key: "previous_therapy", label: t.session.intakeFieldPreviousTherapyLabel, placeholder: t.session.intakeFieldPreviousTherapyPlaceholder },
      { key: "current_medications", label: t.session.intakeFieldMedicationsLabel, placeholder: t.session.intakeFieldMedicationsPlaceholder },
      { key: "family_relationships", label: t.session.intakeFieldFamilyLabel, placeholder: t.session.intakeFieldFamilyPlaceholder },
      { key: "significant_life_events", label: t.session.intakeFieldLifeEventsLabel, placeholder: t.session.intakeFieldLifeEventsPlaceholder },
      { key: "sleep_patterns", label: t.session.intakeFieldSleepLabel, placeholder: t.session.intakeFieldSleepPlaceholder },
      { key: "physical_health", label: t.session.intakeFieldPhysicalHealthLabel, placeholder: t.session.intakeFieldPhysicalHealthPlaceholder },
      { key: "strengths_support", label: t.session.intakeFieldStrengthsLabel, placeholder: t.session.intakeFieldStrengthsPlaceholder },
      { key: "therapy_expectations", label: t.session.intakeFieldExpectationsLabel, placeholder: t.session.intakeFieldExpectationsPlaceholder },
    ],
    [t],
  );

  const currentField = fields[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / TOTAL_STEPS) * 100);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOTAL_STEPS - 1;

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [stepIndex, isOpen]);

  const goNext = async () => {
    if (saving) return;
    const next = Math.min(stepIndex + 1, TOTAL_STEPS - 1);
    setStepIndex(next);
    await upsertPatientIntakeForm(toPayload(form));
    await persistStepIndex(next);
  };

  const goPrev = async () => {
    if (saving) return;
    const prev = Math.max(stepIndex - 1, 0);
    setStepIndex(prev);
    await upsertPatientIntakeForm(toPayload(form));
    await persistStepIndex(prev);
  };

  const handleSave = async () => {
    setSaving(true);
    await upsertPatientIntakeForm(toPayload(form));
    await persistStepIndex(0);
    const latest = await getPatientIntakeForm();
    setSaving(false);
    onSaved(latest, true);
    onClose();
  };

  const handleClose = async () => {
    if (saving) return;
    await upsertPatientIntakeForm(toPayload(form));
    await persistStepIndex(stepIndex);
    const latest = await getPatientIntakeForm();
    onSaved(latest, false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titleOverride ?? t.session.intakeModalTitle}
      className="max-w-2xl"
    >
      {isFirst && (
        <p className="text-sm text-[var(--text-muted)] mb-5">
          {descriptionOverride ?? t.session.intakeModalDescription}
        </p>
      )}

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
          <span className="font-semibold text-[var(--text-secondary)]">
            {t.session.intakeQuestionLabel} {stepIndex + 1} / {TOTAL_STEPS}
          </span>
          <span className="tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="min-h-[240px]">
        <p className="text-base md:text-lg font-medium text-[var(--text-primary)] mb-3 leading-relaxed">
          {currentField.placeholder}
        </p>
        <textarea
          key={currentField.key}
          ref={textareaRef}
          value={form[currentField.key]}
          onChange={(e) => setForm((prev) => ({ ...prev, [currentField.key]: e.target.value }))}
          rows={6}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none resize-y"
        />
      </div>

      <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-[var(--border-color)]/50">
        {isFirst ? (
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            {allowSkip ? t.session.intakeSkipButton : t.session.intakeCancelButton}
          </Button>
        ) : (
          <Button variant="ghost" onClick={goPrev} disabled={saving}>
            <ArrowLeft className="w-4 h-4" />
            {t.session.intakePreviousButton}
          </Button>
        )}

        {isLast ? (
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.session.intakeSaving}
              </span>
            ) : (
              t.session.intakeSaveButton
            )}
          </Button>
        ) : (
          <Button variant="primary" onClick={goNext} disabled={saving}>
            {t.session.intakeNextButton}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Modal>
  );
}
