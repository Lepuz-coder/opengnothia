import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { DreamsSegment } from "@/features/notebook/DreamsSegment";
import { InsightsSegment } from "@/features/notebook/insights/InsightsSegment";
import { JournalSegment } from "@/features/notebook/JournalSegment";
import { SegmentedTabs, type SegmentedTab } from "@/ui";

type Segment = "journal" | "dreams" | "insights";

/**
 * The Defter tab (M7): Günlük | Rüyalar | İçgörüler behind one segmented
 * control. All three segments stay mounted and the inactive ones are hidden,
 * so each keeps its own list state — month position, open detail, drafts —
 * across segment switches (Step 16).
 */
export default function NotebookScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>("journal");

  // Dashboard ritual cards land on a specific segment (?segment=dreams).
  // Manual segment switches afterwards win — this only reacts to a new param.
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: string }>();
  useEffect(() => {
    if (segmentParam === "journal" || segmentParam === "dreams" || segmentParam === "insights") {
      setSegment(segmentParam);
    }
  }, [segmentParam]);

  const tabs: SegmentedTab<Segment>[] = [
    { id: "journal", label: t.nav.journal },
    { id: "dreams", label: t.nav.dreams },
    { id: "insights", label: t.nav.insights },
  ];

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-4 pb-1 pt-2">
        <SegmentedTabs tabs={tabs} activeTab={segment} onChange={setSegment} />
      </View>
      <View className={cn("flex-1", segment !== "journal" && "hidden")}>
        <JournalSegment />
      </View>
      <View className={cn("flex-1", segment !== "dreams" && "hidden")}>
        <DreamsSegment />
      </View>
      <View className={cn("flex-1", segment !== "insights" && "hidden")}>
        <InsightsSegment />
      </View>
    </View>
  );
}
