import { ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";

interface IntakeFormCTAProps {
  onClick: () => void;
}

export function IntakeFormCTA({ onClick }: IntakeFormCTAProps) {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-6 md:p-7 bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-accent-900/30 border border-accent-500/20"
    >
      <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-accent-500/10 breathing-circle pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-accent-500/20 ring-1 ring-accent-500/30 text-accent-300 flex items-center justify-center backdrop-blur shrink-0">
          <ClipboardList className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-accent-400 mb-1.5 font-semibold">
            {t.session.intakeCtaLabel}
          </p>
          <h2 className="text-xl md:text-2xl font-bold mb-1 text-[var(--text-primary)]">
            {t.session.intakeCtaTitle}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {t.session.intakeCtaSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="lg" onClick={onClick}>
            {t.session.intakeCtaButton}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
