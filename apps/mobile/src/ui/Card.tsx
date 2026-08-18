import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@opengnothia/shared/lib/cn";

type Padding = "none" | "sm" | "md" | "lg";

interface CardProps extends Omit<ViewProps, "style"> {
  padding?: Padding;
  className?: string;
  children?: ReactNode;
}

const PADDING: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

// Desktop's Card uses p-4/p-6/p-8; mobile drops one step because the whole
// screen is narrower than a single desktop column.
export function Card({ padding = "md", className, children, ...props }: CardProps) {
  return (
    <View className={cn("rounded-2xl border border-line bg-card", PADDING[padding], className)} {...props}>
      {children}
    </View>
  );
}
