import { CheckCircle2, ClipboardList, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { countFilledIntakeFields, INTAKE_FORM_TOTAL_FIELDS } from "@/services/db/queries";
import type { PatientIntakeForm } from "@/types";

interface IntakeFormSummaryCardProps {
  intakeForm: PatientIntakeForm;
  onEdit: () => void;
}

export function IntakeFormSummaryCard({ intakeForm, onEdit }: IntakeFormSummaryCardProps) {
  const { t } = useTranslation();

  const filledCount = countFilledIntakeFields(intakeForm);
  const isComplete = filledCount >= INTAKE_FORM_TOTAL_FIELDS;
  const progressPct = Math.round((filledCount / INTAKE_FORM_TOTAL_FIELDS) * 100);

  const preview = intakeForm.reason_for_seeking?.trim()
    || intakeForm.current_concerns?.trim()
    || intakeForm.therapy_expectations?.trim()
    || "";

  return (
    <section className="rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)] p-4 md:p-5">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0 ${
            isComplete
              ? "bg-accent-500/15 ring-accent-500/25 text-accent-400"
              : "bg-primary-500/15 ring-primary-500/25 text-primary-400"
          }`}
        >
          {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {isComplete ? t.session.intakeSavedTitle : t.session.intakeInProgressTitle}
          </h3>

          {isComplete ? (
            preview && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                <span className="font-medium">{t.session.intakeSavedPreviewLabel}:</span>{" "}
                {preview}
              </p>
            )
          ) : (
            <div className="mt-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-[var(--text-muted)] shrink-0">
                  {progressPct}%
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                {t.session.intakeProgressCountLabel
                  .replace("{filled}", String(filledCount))
                  .replace("{total}", String(INTAKE_FORM_TOTAL_FIELDS))}
              </p>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0 self-center">
          {isComplete ? (
            <>
              <Pencil className="w-3.5 h-3.5" />
              {t.session.intakeEditButton}
            </>
          ) : (
            <>
              {t.session.intakeContinueButton}
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
