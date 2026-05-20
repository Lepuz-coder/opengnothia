import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: PlaceholderPageProps) {
  const { t } = useTranslation();
  const displayDescription = description ?? t.placeholder.featureComingSoon;
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-900/30 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary-400" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      <p className="text-[var(--text-muted)] text-center max-w-md">{displayDescription}</p>
    </div>
  );
}
