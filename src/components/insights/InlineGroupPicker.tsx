import { Plus } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { InsightGroup } from "@/types";

interface InlineGroupPickerProps {
  groups: InsightGroup[];
  value: string | null;
  onChange: (groupId: string | null) => void;
  onRequestCreate: () => void;
  placeholder?: string;
}

export function InlineGroupPicker({
  groups,
  value,
  onChange,
  onRequestCreate,
  placeholder,
}: InlineGroupPickerProps) {
  const { t } = useTranslation();
  const newGroupLabel = t.session.createNewGroup.replace(/^\+\s*/, "");

  return (
    <div className="flex items-center gap-2">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="flex-1 appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
      >
        <option value="" disabled>
          {placeholder ?? t.session.selectGroupForInsight}
        </option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.emoji} {g.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRequestCreate}
        title={newGroupLabel}
        aria-label={newGroupLabel}
        className="group/new-group-btn relative shrink-0 w-9 h-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="pointer-events-none absolute -top-8 right-0 z-10 whitespace-nowrap px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-medium shadow-lg border border-[var(--border-color)] opacity-0 group-hover/new-group-btn:opacity-100 transition-opacity">
          {newGroupLabel}
        </span>
      </button>
    </div>
  );
}
