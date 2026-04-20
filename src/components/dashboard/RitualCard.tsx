import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RitualCardProps {
  icon: LucideIcon;
  colorBg: string;
  title: string;
  body: string;
  done: boolean;
  actionLabel: string;
  onAction: () => void;
  totalCount: number;
  totalLabel: string;
  actionVariant?: "primary" | "secondary" | "ghost";
}

export function RitualCard({
  icon: Icon,
  colorBg,
  title,
  body,
  done,
  actionLabel,
  onAction,
  totalCount,
  totalLabel,
  actionVariant = "secondary",
}: RitualCardProps) {
  return (
    <Card className="relative flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {done ? (
          <div className="w-6 h-6 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-primary-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-[var(--border-color)]" />
        )}
      </div>
      <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4 min-h-[2.5em] line-clamp-2 flex-1">
        {body}
      </p>
      <div className="flex items-center justify-between gap-2">
        <Button variant={actionVariant} size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
        <span className="text-xs text-[var(--text-muted)] shrink-0">
          {totalCount} {totalLabel}
        </span>
      </div>
    </Card>
  );
}
