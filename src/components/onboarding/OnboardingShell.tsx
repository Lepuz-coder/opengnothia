import { cn } from "@/lib/cn";
import logoImg from "@/assets/logo.png";

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function OnboardingShell({ step, totalSteps, children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 overflow-y-auto py-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src={logoImg} alt="OpenGnothia" className="w-10 h-10" />
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent leading-tight">
            OpenGnothia
          </span>
          <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--text-muted)] font-medium">
            Know Thyself
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < step ? "w-8 bg-primary-500" : i === step ? "w-8 bg-primary-300" : "w-4 bg-[var(--border-color)]"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-lg px-6">
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
