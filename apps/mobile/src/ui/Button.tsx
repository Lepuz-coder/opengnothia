import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@opengnothia/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  textClassName?: string;
  children?: ReactNode;
}

const CONTAINER: Record<Variant, string> = {
  primary: "bg-primary-500 active:bg-primary-600",
  secondary: "bg-raised active:bg-line",
  ghost: "bg-transparent active:bg-raised",
  danger: "bg-red-600 active:bg-red-700",
};

const LABEL: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  ghost: "text-ink-soft",
  danger: "text-white",
};

const CONTAINER_SIZE: Record<Size, string> = {
  sm: "px-3 py-2 gap-1.5",
  md: "px-4 py-2.5 gap-2",
  lg: "px-6 py-3.5 gap-2",
};

const LABEL_SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
};

/**
 * NativeWind port of desktop's components/ui/Button. The desktop version keys
 * its states off :hover; on touch there is none, so the same intent is carried
 * by active: variants instead.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  textClassName,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center rounded-xl",
        CONTAINER[variant],
        CONTAINER_SIZE[size],
        isDisabled && "opacity-50",
        className
      )}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={variant === "secondary" || variant === "ghost" ? undefined : "#fff"} /> : icon}
      {typeof children === "string" ? (
        <Text className={cn("font-medium", LABEL[variant], LABEL_SIZE[size], textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
