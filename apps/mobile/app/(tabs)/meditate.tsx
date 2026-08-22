import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { getBreathingTechniques } from "@opengnothia/shared/constants/breathingTechniques";
import { BreathingExercise } from "@/features/breathing/BreathingExercise";
import { BreathingSetup } from "@/features/breathing/BreathingSetup";
import { MeditationSession } from "@/features/meditation/MeditationSession";
import { MeditationSetup } from "@/features/meditation/MeditationSetup";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { SegmentedTabs } from "@/ui";

type Segment = "timer" | "breathing";

/**
 * Meditation tab — the timer and the breathing exercises behind one segmented
 * control. The segment is a filter over two setup screens, not navigation, which
 * is what SegmentedTabs is for (same call as Defter's three journal segments).
 *
 * The breathing half is unchanged from when this tab was "Nefes": technique id,
 * duration in seconds (as string, straight from the shared duration options) and
 * an active flag, all local state. Both runners are conditionally rendered so
 * each run mounts fresh — timer baselines and animations start at zero.
 *
 * The segment itself is deliberately not persisted; the meditation timer's own
 * setup is (see useSettingsStore), so returning to the tab lands on a timer that
 * already remembers the last sitting.
 */
export default function MeditateScreen() {
  const { t, language } = useTranslation();
  const [segment, setSegment] = useState<Segment>("timer");

  const [selectedTechniqueId, setSelectedTechniqueId] = useState("box");
  const [selectedDuration, setSelectedDuration] = useState("180");
  const [breathingActive, setBreathingActive] = useState(false);
  const [meditationActive, setMeditationActive] = useState(false);


  const techniques = getBreathingTechniques(language);
  const technique = techniques.find((item) => item.id === selectedTechniqueId) ?? techniques[0];

  const meditationDuration = useSettingsStore((s) => s.meditationDuration);
  const meditationPrep = useSettingsStore((s) => s.meditationPrep);
  const meditationBells = useSettingsStore((s) => s.meditationBells);
  const meditationBell = useSettingsStore((s) => s.meditationBell);

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-4 pt-4">
        <SegmentedTabs<Segment>
          tabs={[
            { id: "timer", label: t.meditation.tabTimer },
            { id: "breathing", label: t.meditation.tabBreathing },
          ]}
          activeTab={segment}
          onChange={setSegment}
        />
      </View>

      {segment === "timer" ? (
        <MeditationSetup onStart={() => setMeditationActive(true)} />
      ) : (
        <BreathingSetup
          selectedTechniqueId={selectedTechniqueId}
          onSelectTechnique={setSelectedTechniqueId}
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          onStart={() => setBreathingActive(true)}
        />
      )}

      {breathingActive && (
        <BreathingExercise
          technique={technique}
          totalDuration={parseInt(selectedDuration, 10)}
          onStop={() => setBreathingActive(false)}
        />
      )}
      {meditationActive && (
        <MeditationSession
          totalSeconds={meditationDuration}
          prepSeconds={meditationPrep}
          bellsAt={meditationBells}
          bell={meditationBell}
          onStop={() => setMeditationActive(false)}
        />
      )}
    </View>
  );
}
