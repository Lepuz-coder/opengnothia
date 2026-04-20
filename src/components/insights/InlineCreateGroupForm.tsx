import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";
import { EMOJI_PRESETS, COLOR_PRESETS } from "@/constants/insightPresets";

export interface NewGroupDraft {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

interface InlineCreateGroupFormProps {
  onCreate: (draft: NewGroupDraft) => void;
  onCancel: () => void;
  submitting?: boolean;
  emojiPresetsLimit?: number;
}

export function InlineCreateGroupForm({
  onCreate,
  onCancel,
  submitting = false,
  emojiPresetsLimit = 10,
}: InlineCreateGroupFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💡");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3ABAB4");

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <div className="space-y-3 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {t.session.createNewGroup}
        </span>
        <button
          onClick={onCancel}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.session.newGroupName}
        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
        autoFocus
      />
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_PRESETS.slice(0, emojiPresetsLimit).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all",
              emoji === e
                ? "bg-primary-500/20 ring-2 ring-primary-500"
                : "bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]"
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={emoji}
          onChange={(e) => {
            const val = e.target.value;
            if (val) setEmoji(val.slice(-2));
          }}
          className="w-10 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-center text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
        <span className="text-xs text-[var(--text-muted)]">{t.insights.emojiCustom}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={cn(
              "w-6 h-6 rounded-full transition-all",
              color === c
                ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)]"
                : "hover:scale-110"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t.insights.descriptionOptional ?? ""}
        rows={2}
        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={() =>
            onCreate({
              name: name.trim(),
              emoji,
              description: description.trim(),
              color,
            })
          }
        >
          {t.common.add}
        </Button>
      </div>
    </div>
  );
}
