import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { getBreathingTechniques } from "@opengnothia/shared/constants/breathingTechniques";
import { BreathingExercise } from "@/features/breathing/BreathingExercise";
import { BreathingSetup } from "@/features/breathing/BreathingSetup";

/**
 * Breathe tab (Step 22) — state mirrors desktop's ToolsPage: technique id,
 * duration in seconds (as string, straight from the shared duration options)
 * and an active flag. The exercise is conditionally rendered so each run
 * mounts fresh — its timer baseline and animations start at zero.
 */
export default function BreatheScreen() {
  const { language } = useTranslation();
  const [selectedTechniqueId, setSelectedTechniqueId] = useState("box");
  const [selectedDuration, setSelectedDuration] = useState("180");
  const [isActive, setIsActive] = useState(false);

  const techniques = getBreathingTechniques(language);
  const technique = techniques.find((item) => item.id === selectedTechniqueId) ?? techniques[0];

  return (
    <View className="flex-1 bg-canvas">
      <BreathingSetup
        selectedTechniqueId={selectedTechniqueId}
        onSelectTechnique={setSelectedTechniqueId}
        selectedDuration={selectedDuration}
        onSelectDuration={setSelectedDuration}
        onStart={() => setIsActive(true)}
      />
      {isActive && (
        <BreathingExercise
          technique={technique}
          totalDuration={parseInt(selectedDuration, 10)}
          onStop={() => setIsActive(false)}
        />
      )}
    </View>
  );
}
