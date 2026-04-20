import { MessageSquare, Play, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Session, UserProfile } from "@/types";
import type { Translations } from "@/i18n";

interface TodaySessionHeroProps {
  todaySession: Session | null;
  profile: UserProfile | null;
  t: Translations;
  onStart: () => void;
  onContinue: () => void;
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function TodaySessionHero({ todaySession, profile, t, onStart, onContinue }: TodaySessionHeroProps) {
  const isActive = todaySession?.status === "active";
  const isCompleted = todaySession?.status === "completed";

  let title: string;
  let subtitle: string;
  let primaryLabel: string;
  let primaryIcon = Play;
  let primaryAction = onStart;
  let accent: "primary" | "accent" = "primary";

  if (isActive) {
    const elapsed = minutesSince(todaySession!.started_at);
    title = t.dashboard.sessionInProgress;
    subtitle = t.dashboard.sessionStartedAgo.replace("{minutes}", String(elapsed));
    primaryLabel = t.dashboard.continueTodaySession;
    primaryIcon = ArrowRight;
    primaryAction = onContinue;
    accent = "primary";
  } else if (isCompleted) {
    title = t.dashboard.sessionCompletedToday;
    subtitle = "";
    primaryLabel = t.dashboard.startAnotherSession;
    primaryIcon = Play;
    primaryAction = onStart;
    accent = "accent";
  } else {
    title = t.dashboard.readyForSession;
    subtitle = t.dashboard.preferredTimeHint.replace(
      "{time}",
      profile?.preferred_session_time || "20:00"
    );
    primaryLabel = t.dashboard.startTodaySession;
    primaryIcon = Play;
    primaryAction = onStart;
    accent = "primary";
  }

  const PrimaryIcon = primaryIcon;
  const gradientClass =
    accent === "accent"
      ? "from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-accent-900/30"
      : "from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-primary-900/40";
  const borderClass = accent === "accent" ? "border-accent-500/20" : "border-primary-500/20";
  const orbClass = accent === "accent" ? "bg-accent-500/10" : "bg-primary-500/10";
  const iconBoxClass =
    accent === "accent"
      ? "bg-accent-500/20 ring-accent-500/30 text-accent-300"
      : "bg-primary-500/20 ring-primary-500/30 text-primary-300";
  const labelClass = accent === "accent" ? "text-accent-400" : "text-primary-400";

  return (
    <section
      className={`relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br ${gradientClass} border ${borderClass}`}
    >
      <div
        className={`absolute -right-20 -top-20 w-72 h-72 rounded-full ${orbClass} breathing-circle pointer-events-none`}
      />

      <div className="relative flex flex-col md:flex-row md:items-center gap-5">
        <div
          className={`w-14 h-14 rounded-2xl ${iconBoxClass} ring-1 flex items-center justify-center backdrop-blur shrink-0`}
        >
          {isCompleted ? (
            <Sparkles className="w-7 h-7" />
          ) : (
            <MessageSquare className="w-7 h-7" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-xs uppercase tracking-[0.18em] ${labelClass} mb-1.5 font-semibold`}>
            {t.dashboard.todaySession}
          </p>
          <h2 className="text-xl md:text-2xl font-bold mb-1 text-[var(--text-primary)]">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] line-clamp-2">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="lg" onClick={primaryAction}>
            <PrimaryIcon className="w-4 h-4" />
            {primaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
