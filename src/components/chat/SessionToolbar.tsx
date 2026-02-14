import { Square } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SessionToolbarProps {
  onEnd: () => void;
}

export function SessionToolbar({ onEnd }: SessionToolbarProps) {
  return (
    <div className="flex items-center justify-end px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <Button variant="danger" size="sm" onClick={onEnd}>
        <Square className="w-4 h-4" />
        Bitir
      </Button>
    </div>
  );
}
