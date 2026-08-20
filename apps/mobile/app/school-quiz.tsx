import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "@opengnothia/shared/i18n";
import { showToast } from "@/stores/useToastStore";
import { SchoolQuizFlow } from "@/features/quiz/SchoolQuizFlow";

/**
 * Step 60 (M2): settings' "retake the quiz", reusing the onboarding flow on a
 * modal sheet. Dismissing (back on question 1, or the sheet's swipe) keeps the
 * previous school — the flow only persists on accept.
 */
export default function SchoolQuizRetakeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="flex-1 bg-canvas pt-3">
      <SchoolQuizFlow
        completeLabel={t.common.save}
        onCancel={() => router.back()}
        onComplete={() => {
          showToast(t.settings.saved, "success");
          router.back();
        }}
      />
    </View>
  );
}
