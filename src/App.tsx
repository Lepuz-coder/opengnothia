import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/store";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSchoolsStore } from "@/stores/useSchoolsStore";
import { useTheme } from "@/hooks/useTheme";
import { useCloseGuard } from "@/hooks/useCloseGuard";
import { useDatabase } from "@/hooks/useDatabase";
import { MainLayout } from "@/components/layout/MainLayout";
import logoImg from "@/assets/logo.png";
import OnboardingPage from "@/pages/OnboardingPage";
import { LockScreen } from "@/components/LockScreen";
import DashboardPage from "@/pages/DashboardPage";
import SessionPage from "@/pages/SessionPage";
import SettingsPage from "@/pages/SettingsPage";
import JournalPage from "@/pages/JournalPage";
import DreamsPage from "@/pages/DreamsPage";
import InsightsPage from "@/pages/InsightsPage";
import ToolsPage from "@/pages/ToolsPage";
import ProgramsPage from "@/pages/ProgramsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import SchoolsPage from "@/pages/SchoolsPage";

function AppContent() {
  const { isOnboarded, setOnboarded, setTheme, setHasSeenNoteTutorial, isLocked, setLocked, lockEnabled, setLockEnabled } = useAppStore();
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

        const language = await store.get<string>("language");
        const provider = await store.get<string>("provider");
        const apiKey = await store.get<string>("apiKey");
        const model = await store.get<string>("model");
        const customBaseUrl = await store.get<string>("customBaseUrl");
        const therapySchool = await store.get<string>("therapySchool");
        const thinkingEnabled = await store.get<boolean>("thinkingEnabled");
        const thinkingLevel = await store.get<string>("thinkingLevel");
        let providerApiKeys = await store.get<Record<string, string>>("providerApiKeys");
        const providerThinkingSettings = await store.get<Record<string, { enabled: boolean; level: string }>>("providerThinkingSettings");
        const memoryModel = await store.get<string>("memoryModel");
        const memoryThinkingEnabled = await store.get<boolean>("memoryThinkingEnabled");
        const memoryThinkingLevel = await store.get<string>("memoryThinkingLevel");
        const providerMemoryThinkingSettings = await store.get<Record<string, { enabled: boolean; level: string }>>("providerMemoryThinkingSettings");

        // Load schools data
        const customSchools = await store.get<any[]>("customSchools");
        const promptOverrides = await store.get<Record<string, string>>("promptOverrides");
        if (customSchools || promptOverrides) {
          useSchoolsStore.getState().loadFromStore({
            ...(customSchools && { customSchools }),
            ...(promptOverrides && { promptOverrides }),
          });
        }

        const lockEnabledVal = await store.get<boolean>("lockEnabled");
        if (lockEnabledVal) {
          setLockEnabled(true);
          setLocked(true);
        } else {
          setLocked(false);
        }

        // Migrate: if providerApiKeys is empty but apiKey exists, seed it
        if ((!providerApiKeys || Object.keys(providerApiKeys).length === 0) && apiKey && provider) {
          providerApiKeys = { [provider]: apiKey };
          await store.set("providerApiKeys", providerApiKeys);
          await store.save();
        }

        loadFromStore({
          ...(language && { language: language as any }),
          ...(provider && { provider: provider as any }),
          ...(apiKey && { apiKey }),
          ...(model && { model }),
          ...(customBaseUrl && { customBaseUrl }),
          ...(therapySchool && { therapySchool: therapySchool as any }),
          ...(thinkingEnabled != null && { thinkingEnabled }),
          ...(thinkingLevel && { thinkingLevel: thinkingLevel as any }),
          ...(providerApiKeys && { providerApiKeys }),
          ...(providerThinkingSettings && { providerThinkingSettings: providerThinkingSettings as any }),
          ...(memoryModel && { memoryModel }),
          ...(memoryThinkingEnabled != null && { memoryThinkingEnabled }),
          ...(memoryThinkingLevel && { memoryThinkingLevel: memoryThinkingLevel as any }),
          ...(providerMemoryThinkingSettings && { providerMemoryThinkingSettings: providerMemoryThinkingSettings as any }),
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
        <img src={logoImg} alt="OpenGnothia" className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  if (!isOnboarded) {
    return <OnboardingPage />;
  }

  if (lockEnabled && isLocked) {
    return <LockScreen />;
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
          <Route path="/schools" element={<SchoolsPage />} />
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
        <p>Database error: {error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center">
        <img src={logoImg} alt="OpenGnothia" className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return <AppContent />;
}
