import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { getBreathingTechniques } from "@/constants/breathingTechniques";
import { BreathingSetup } from "@/components/breathing/BreathingSetup";
import { BreathingExercise } from "@/components/breathing/BreathingExercise";

export default function ToolsPage() {
  const setSidebarHidden = useAppStore((s) => s.setSidebarHidden);
  const [isActive, setIsActive] = useState(false);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState("box");
  const [selectedDuration, setSelectedDuration] = useState("180");

  useEffect(() => {
    return () => {
      useAppStore.getState().setSidebarHidden(false);
    };
  }, []);

  const handleStart = () => {
    setSidebarHidden(true);
    setIsActive(true);
  };

  const handleStop = () => {
    setSidebarHidden(false);
    setIsActive(false);
  };

  const technique = getBreathingTechniques().find(
    (t) => t.id === selectedTechniqueId
  )!;

  if (isActive) {
    return (
      <BreathingExercise
        technique={technique}
        totalDuration={parseInt(selectedDuration)}
        onStop={handleStop}
      />
    );
  }

  return (
    <BreathingSetup
      selectedTechniqueId={selectedTechniqueId}
      onSelectTechnique={setSelectedTechniqueId}
      selectedDuration={selectedDuration}
      onSelectDuration={setSelectedDuration}
      onStart={handleStart}
    />
  );
}
