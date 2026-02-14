import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Badge({ children, variant = "default", selected, onClick, className }: BadgeProps) {
  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
        {
          "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]": variant === "default" && !selected,
          "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300": variant === "primary" || selected,
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300": variant === "success",
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300": variant === "warning",
        },
        isClickable && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {children}
    </span>
  );
}
