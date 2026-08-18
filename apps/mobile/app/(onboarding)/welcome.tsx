import { Sparkles } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { ScreenPlaceholder } from "@/ui";

// Placeholder so the group is a valid navigator; replaced by the real welcome
// step in Faz 7 (M11). Deliberately not named index.tsx — that would make the
// group a second candidate for "/" and beat (tabs) on alphabetical order.
export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon={Sparkles} title={t.onboarding.welcome} />;
}
