import { Pressable, Text, View } from "react-native";
import { cn } from "@opengnothia/shared/lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      className={cn("flex-row items-center gap-3", disabled && "opacity-50", className)}
    >
      <View className={cn("h-7 w-12 justify-center rounded-full px-1", checked ? "bg-primary-500" : "bg-line")}>
        <View className={cn("h-5 w-5 rounded-full bg-white", checked && "self-end")} />
      </View>
      {label !== undefined && <Text className="flex-1 text-sm text-ink-soft">{label}</Text>}
    </Pressable>
  );
}
