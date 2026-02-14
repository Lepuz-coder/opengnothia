import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function PlaceholderPage({
  icon: Icon,
  title,
  description = "Bu özellik yakında eklenecek.",
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-900/30 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary-400" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      <p className="text-[var(--text-muted)] text-center max-w-md">{description}</p>
    </div>
  );
}
