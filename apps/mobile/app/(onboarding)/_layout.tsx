import { Stack } from "expo-router";

// Empty skeleton for now — the welcome → language → quiz → paywall → intake
// flow is written in Faz 7 (M11). Kept as its own group so the root layout
// can swap between it and (tabs) on the `onboarded` flag without a reshuffle.
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
