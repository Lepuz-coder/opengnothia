import { Stack } from "expo-router";
import { useThemeColors } from "@/theme/useAppTheme";

// Without an anchor, "/" inside this group would resolve alphabetically —
// interview.tsx would beat welcome.tsx. The flow order itself is enforced by
// each screen's push target (M11), not by the navigator.
export const unstable_settings = { anchor: "welcome" };

export default function OnboardingLayout() {
  const { colors } = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  );
}
