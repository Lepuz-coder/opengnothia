import { cn } from "@/lib/cn";

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  labels?: string[];
  className?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  showValue = true,
  labels,
  className,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
        {showValue && (
          <span className="text-sm font-semibold text-primary-400">
            {value}/{max}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary-500"
        style={{
          background: `linear-gradient(to right, var(--color-primary-500) 0%, var(--color-primary-500) ${percentage}%, var(--color-surface-200) ${percentage}%, var(--color-surface-200) 100%)`,
        }}
      />
      {labels && (
        <div className="flex justify-between">
          {labels.map((l) => (
            <span key={l} className="text-xs text-[var(--text-muted)]">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
