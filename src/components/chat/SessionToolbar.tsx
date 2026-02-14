import { Wind, Anchor, FileText, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SessionToolbarProps {
  onBreathing: () => void;
  onGrounding: () => void;
  onSummary: () => void;
  onEnd: () => void;
}

export function SessionToolbar({ onBreathing, onGrounding, onSummary, onEnd }: SessionToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <Button variant="ghost" size="sm" onClick={onBreathing}>
        <Wind className="w-4 h-4" />
        Nefes
      </Button>
      <Button variant="ghost" size="sm" onClick={onGrounding}>
        <Anchor className="w-4 h-4" />
        Grounding
      </Button>
      <Button variant="ghost" size="sm" onClick={onSummary}>
        <FileText className="w-4 h-4" />
        Özet
      </Button>
      <div className="flex-1" />
      <Button variant="danger" size="sm" onClick={onEnd}>
        <Square className="w-4 h-4" />
        Bitir
      </Button>
    </div>
  );
}
