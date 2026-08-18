import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, className, ...props }, ref) => {
  // placeholderTextColor is a prop, not a style, so it cannot come from a class.
  const { colors } = useThemeColors();

  return (
    <View className="gap-1.5">
      {label !== undefined && <Text className="text-sm font-medium text-ink-soft">{label}</Text>}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkMute}
        className={cn(
          "rounded-xl border border-line bg-canvas px-4 py-3 text-base text-ink",
          error !== undefined && "border-red-500",
          className
        )}
        {...props}
      />
      {error !== undefined && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
});

Input.displayName = "Input";
