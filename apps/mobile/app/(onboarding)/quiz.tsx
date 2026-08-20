import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@opengnothia/shared/i18n";
import { SchoolQuizFlow } from "@/features/quiz/SchoolQuizFlow";

/** M11 step 3 (M2): the quiz + result screen; accepting moves on to the paywall. */
export default function OnboardingQuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <SchoolQuizFlow
        completeLabel={t.common.continue}
        onCancel={() => router.back()}
        onComplete={() => router.push("/subscribe")}
      />
    </View>
  );
}
