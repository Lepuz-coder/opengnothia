import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/store";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { useCloseGuard } from "@/hooks/useCloseGuard";
import { useDatabase } from "@/hooks/useDatabase";
import { MainLayout } from "@/components/layout/MainLayout";
import OnboardingPage from "@/pages/OnboardingPage";
import DashboardPage from "@/pages/DashboardPage";
import SessionPage from "@/pages/SessionPage";
import SettingsPage from "@/pages/SettingsPage";
import JournalPage from "@/pages/JournalPage";
import DreamsPage from "@/pages/DreamsPage";
import InsightsPage from "@/pages/InsightsPage";
import ToolsPage from "@/pages/ToolsPage";
import ProgramsPage from "@/pages/ProgramsPage";
import ExpensesPage from "@/pages/ExpensesPage";

function AppContent() {
  const { isOnboarded, setOnboarded, setTheme, setHasSeenNoteTutorial } = useAppStore();
  const { loadFromStore } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);
  useTheme();
  useCloseGuard();

  useEffect(() => {
    async function init() {
      try {
        const store = await loadSettings();
        const onboarded = await store.get<boolean>("isOnboarded");
        if (onboarded) setOnboarded(true);

        const hasSeenNoteTutorial = await store.get<boolean>("hasSeenNoteTutorial");
        if (hasSeenNoteTutorial) setHasSeenNoteTutorial(true);

        const theme = await store.get<"light" | "dark" | "system">("theme");
        if (theme) setTheme(theme);

        const provider = await store.get<string>("provider");
        const apiKey = await store.get<string>("apiKey");
        const model = await store.get<string>("model");
        const customBaseUrl = await store.get<string>("customBaseUrl");
        const therapySchool = await store.get<string>("therapySchool");
        const thinkingEnabled = await store.get<boolean>("thinkingEnabled");
        const thinkingLevel = await store.get<string>("thinkingLevel");
        let providerApiKeys = await store.get<Record<string, string>>("providerApiKeys");
        const providerThinkingSettings = await store.get<Record<string, { enabled: boolean; level: string }>>("providerThinkingSettings");

        // Migrate: if providerApiKeys is empty but apiKey exists, seed it
        if ((!providerApiKeys || Object.keys(providerApiKeys).length === 0) && apiKey && provider) {
          providerApiKeys = { [provider]: apiKey };
          await store.set("providerApiKeys", providerApiKeys);
          await store.save();
        }

        loadFromStore({
          ...(provider && { provider: provider as any }),
          ...(apiKey && { apiKey }),
          ...(model && { model }),
          ...(customBaseUrl && { customBaseUrl }),
          ...(therapySchool && { therapySchool: therapySchool as any }),
          ...(thinkingEnabled != null && { thinkingEnabled }),
          ...(thinkingLevel && { thinkingLevel: thinkingLevel as any }),
          ...(providerApiKeys && { providerApiKeys }),
          ...(providerThinkingSettings && { providerThinkingSettings: providerThinkingSettings as any }),
        });
      } catch {
        // Store not available yet, use defaults
      }
      setIsLoading(false);
    }
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 animate-pulse" />
      </div>
    );
  }

  if (!isOnboarded) {
    return <OnboardingPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/dreams" element={<DreamsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const { isReady, error } = useDatabase();

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        <p>Veritabanı hatası: {error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 animate-pulse" />
      </div>
    );
  }

  return <AppContent />;
}
