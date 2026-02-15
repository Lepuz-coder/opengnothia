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
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={onBreathing}>
        <Wind className="w-4 h-4" />
        <span className="hidden sm:inline">Nefes</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onGrounding}>
        <Anchor className="w-4 h-4" />
        <span className="hidden sm:inline">Grounding</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onSummary}>
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">Özet</span>
      </Button>
      <Button variant="danger" size="sm" onClick={onEnd}>
        <Square className="w-4 h-4" />
        <span className="hidden sm:inline">Bitir</span>
      </Button>
    </div>
  );
}
