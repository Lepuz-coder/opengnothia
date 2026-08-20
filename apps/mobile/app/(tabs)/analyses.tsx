import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BookOpen, MessageSquare, Moon, Sparkles, type LucideIcon } from "lucide-react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import { buildMilestoneAnalysisPrompt } from "@opengnothia/shared/ai/promptBuilder";
import {
  MILESTONE_DEFS,
  MILESTONES,
  type Milestone,
  type MilestoneDef,
} from "@opengnothia/shared/constants/milestones";
import { useAIErrorHandler } from "@/ai/useAIErrorHandler";
import { getQueries } from "@/db";
import { useProGate } from "@/hooks/useProGate";
import { toIsoUtc } from "@/lib/date";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card } from "@/ui";
import { AnalysisSheet } from "@/features/analyses/AnalysisSheet";
import { streamAnalysisContent } from "@/features/analyses/analysisActions";
import { MilestoneCard } from "@/features/analyses/MilestoneCard";

/**
 * Steps 51–52: desktop AnalysesPage as the roadmap tab. One deliberate break
 * from desktop: there is no zero-session empty state and no separate next-goal
 * block — the tab is the permanent conversion surface (M3), so the full
 * roadmap always renders (all locked at 0 sessions), the dashboard journey
 * card already carries the next goal, and free users get the Pro CTA on top.
 * Generation is gated (M3); reading a cached analysis never is (M4).
 */
export default function AnalysesScreen() {
  const { t, language } = useTranslation();
  const locale = getDateLocale(language);
  const { colors } = useThemeColors();
  const router = useRouter();
  const { isPro, gate } = useProGate();
  // Generation streams inside the analysis pageSheet — its errors must not
  // push the paywall route underneath it.
  const handleAIError = useAIErrorHandler({ modalHosted: true });

  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  const [cachedAnalyses, setCachedAnalyses] = useState<Map<number, string>>(new Map());
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const load = useCallback(async () => {
    const queries = await getQueries();
    const [sessions, journal, dreams] = await Promise.all([
      queries.getCompletedSessionCount(),
      queries.getJournalEntryCount(),
      queries.getDreamCount(),
    ]);
    const cached = new Map<number, string>();
    for (const m of MILESTONES) {
      if (sessions >= m) {
        const existing = await queries.getMilestoneAnalysis(m);
        if (existing) cached.set(m, existing.content);
      }
    }
    setSessionCount(sessions);
    setJournalCount(journal);
    setDreamCount(dreams);
    setCachedAnalyses(cached);
    setLoading(false);
  }, []);

  // Counts move while this tab stays mounted (sessions completed, entries
  // written elsewhere) — reload on every focus, like the dashboard.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleGenerate = useCallback(
    async (milestone: Milestone) => {
      if (generating) return;
      setCurrentMilestone(milestone);
      setStreamContent("");
      setGenerating(true);
      setSheetOpen(true);

      try {
        const queries = await getQueries();
        const [patientNotes, sessions, profile] = await Promise.all([
          queries.getPatientNotes(),
          queries.getCompletedSessions(),
          queries.getUserProfile(),
        ]);

        const sessionSummaries = sessions.map((s) => ({
          date: s.started_at ? new Date(toIsoUtc(s.started_at)).toLocaleDateString(locale) : "Unknown",
          narrative: s.summary_narrative ?? null,
          summary: s.summary ?? null,
        }));

        const prompt = buildMilestoneAnalysisPrompt({
          milestone,
          patientNotes,
          sessionSummaries,
          profile,
          totalSessions: sessionCount,
          language,
        });

        const full = await streamAnalysisContent({
          messages: [
            {
              id: crypto.randomUUID(),
              role: "user",
              content: `Generate my ${milestone}-session milestone analysis.`,
              timestamp: new Date().toISOString(),
            },
          ],
          systemPrompt: prompt,
          callType: "milestone_analysis",
          onChunk: (chunk) => setStreamContent((prev) => prev + chunk),
          onAIError: handleAIError,
        });

        if (full !== null && full.trim().length > 0) {
          await queries.saveMilestoneAnalysis(milestone, full);
          setCachedAnalyses((prev) => new Map(prev).set(milestone, full));
        }
      } catch (err) {
        handleAIError(err);
      } finally {
        setGenerating(false);
      }
    },
    [generating, sessionCount, language, locale, handleAIError]
  );

  const handleMilestonePress = (def: MilestoneDef) => {
    if (cachedAnalyses.has(def.sessions)) {
      // Reading an already generated analysis is free (M4).
      setCurrentMilestone(def.sessions);
      setStreamContent("");
      setSheetOpen(true);
      return;
    }
    gate(() => void handleGenerate(def.sessions));
  };

  // The sheet's retry (after a failed run): same gate as the card, but a
  // paywall route would present below the open sheet — close it first.
  const handleSheetGeneratePress = () => {
    if (currentMilestone === null) return;
    if (isPro) {
      void handleGenerate(currentMilestone);
      return;
    }
    setSheetOpen(false);
    setTimeout(() => gate(() => undefined), 400);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  const currentDef = MILESTONE_DEFS.find((m) => m.sessions === currentMilestone);

  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4">
        <Text className="text-sm text-ink-mute">{t.analyses.description}</Text>

        {/* M3: the roadmap is visible to everyone; free users get the CTA on top. */}
        {!isPro && (
          <Card className="border-accent-500/40 bg-accent-500/10">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15">
                <Sparkles size={20} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-ink">{t.paywall.title}</Text>
                <Text className="mt-0.5 text-xs leading-relaxed text-ink-mute">{t.paywall.featureMilestones}</Text>
              </View>
            </View>
            <Button className="mt-3" onPress={() => router.push("/paywall")}>
              {t.paywall.purchaseCta}
            </Button>
          </Card>
        )}

        {/* Desktop's stat tiles */}
        <View className="flex-row gap-3">
          <StatTile icon={MessageSquare} value={sessionCount} label={t.analyses.totalSessions} />
          <StatTile icon={BookOpen} value={journalCount} label={t.analyses.totalJournal} />
          <StatTile icon={Moon} value={dreamCount} label={t.analyses.totalDreams} />
        </View>

        <Text className="mt-1 text-base font-semibold text-ink">{t.analyses.milestones}</Text>

        {MILESTONE_DEFS.map((def) => (
          <MilestoneCard
            key={def.sessions}
            def={def}
            sessionCount={sessionCount}
            hasCached={cachedAnalyses.has(def.sessions)}
            generating={generating && currentMilestone === def.sessions}
            disabled={generating}
            onPress={() => handleMilestonePress(def)}
          />
        ))}
      </ScrollView>

      <AnalysisSheet
        visible={sheetOpen}
        title={currentDef ? `${currentDef.emoji} ${t.analyses[currentDef.nameKey]}` : t.analyses.aiAnalysis}
        content={currentMilestone !== null ? (cachedAnalyses.get(currentMilestone) ?? null) : null}
        generating={generating}
        streamContent={streamContent}
        generatingLabel={t.analyses.analyzing}
        generateLabel={t.analyses.generateAnalysis}
        onGeneratePress={handleSheetGeneratePress}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  const { colors } = useThemeColors();
  return (
    <Card className="flex-1 items-center" padding="sm">
      <Icon size={16} color={colors.tint} />
      <Text className="mt-1 text-xl font-bold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
      <Text className="text-center text-[11px] text-ink-mute" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}
