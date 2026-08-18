import { Text, View } from "react-native";
import { cn } from "@opengnothia/shared/lib/cn";

type Variant = "default" | "primary" | "success" | "warning";

interface BadgeProps {
  label: string;
  variant?: Variant;
  className?: string;
}

// Desktop only ever renders on the dark theme, so its badge tints are the
// dark: half here; the light half is the mirrored tint on the same ramp.
const CONTAINER: Record<Variant, string> = {
  default: "bg-raised",
  primary: "bg-primary-100 dark:bg-primary-900/40",
  success: "bg-green-100 dark:bg-green-900/40",
  warning: "bg-accent-100 dark:bg-accent-900/40",
};

const LABEL: Record<Variant, string> = {
  default: "text-ink-soft",
  primary: "text-primary-700 dark:text-primary-300",
  success: "text-green-700 dark:text-green-300",
  warning: "text-accent-700 dark:text-accent-300",
};

export function Badge({ label, variant = "default", className }: BadgeProps) {
  return (
    <View className={cn("self-start rounded-full px-3 py-1", CONTAINER[variant], className)}>
      <Text className={cn("text-xs font-medium", LABEL[variant])}>{label}</Text>
    </View>
  );
}
