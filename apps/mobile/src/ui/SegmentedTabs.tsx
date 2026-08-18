import { Pressable, Text, View } from "react-native";
import { cn } from "@opengnothia/shared/lib/cn";

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * Mobile stand-in for desktop's underlined Tabs: on a phone an iOS-style
 * segmented control is both easier to hit and clearer about being a filter
 * rather than navigation. Used for Defter's Günlük | Rüyalar | İçgörüler (M7).
 *
 * The track/pill tokens swap between schemes: the selected pill has to read as
 * the *nearer* surface, and "nearer" is lighter on light and lighter-still on
 * dark, so a single pair of tokens would invert on one of the two.
 */
export function SegmentedTabs<T extends string>({ tabs, activeTab, onChange, className }: SegmentedTabsProps<T>) {
  return (
    <View className={cn("flex-row rounded-xl bg-raised p-1 dark:bg-card", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            className={cn("flex-1 items-center rounded-lg py-2", isActive && "bg-card dark:bg-raised")}
          >
            <Text className={cn("text-sm font-medium", isActive ? "text-ink" : "text-ink-mute")}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
