import { Brain } from "lucide-react";
import { cn } from "@/lib/cn";

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function OnboardingShell({ step, totalSteps, children }: OnboardingShellProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          OpenGnothia
        </span>
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
