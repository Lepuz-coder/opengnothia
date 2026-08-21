import { useState, type ReactNode } from "react";
import { AppState, ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Check,
  CodeXml,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";
import { getDateLocale, useTranslation } from "@opengnothia/shared/i18n";
import { getLocalizedSchoolQuiz } from "@opengnothia/shared/i18n/schoolQuiz";
import { getTherapySchool } from "@opengnothia/shared/constants/therapySchools";
import type { Theme } from "@opengnothia/shared/types";
import {
  authenticateWithDevice,
  type DeviceAuthenticationOutcome,
} from "@/features/app-lock/authenticate";
import { LANGUAGE_OPTIONS } from "@/i18n/languages";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { showToast } from "@/stores/useToastStore";
import { useThemeColors, useThemePreference } from "@/theme/useAppTheme";
import { Badge, Button, Card, SegmentedTabs, Toggle } from "@/ui";

const SOURCE_URL = "https://github.com/Lepuz-coder/opengnothia";

/** M10: one settings surface for subscription, preferences, school, lock and about. */
export default function SettingsScreen() {
  const { t, language } = useTranslation();
  const theme = useThemePreference();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentLanguage = useSettingsStore((s) => s.language);
  const schoolId = useSettingsStore((s) => s.schoolId);
  const lockEnabled = useSettingsStore((s) => s.lockEnabled);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLockEnabled = useSettingsStore((s) => s.setLockEnabled);
  const subscriptionReady = useSubscriptionStore((s) => s.isReady);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const expirationDate = useSubscriptionStore((s) => s.expirationDate);
  const managementURL = useSubscriptionStore((s) => s.managementURL);
  const restore = useSubscriptionStore((s) => s.restore);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);

  const themeTabs: { id: Theme; label: string }[] = [
    { id: "system", label: t.settings.themeSystem },
    { id: "light", label: t.settings.themeLight },
    { id: "dark", label: t.settings.themeDark },
  ];

  const quizTexts = getLocalizedSchoolQuiz(language);
  const school = schoolId !== null ? getTherapySchool(schoolId, language) : undefined;
  const version = Constants.expoConfig?.version ?? "—";
  const periodEnd = formatSubscriptionDate(expirationDate, getDateLocale(language));

  const restorePurchases = async () => {
    if (!subscriptionReady || restoreBusy) return;
    setRestoreBusy(true);
    try {
      await restore();
      showToast(
        useSubscriptionStore.getState().isPro
          ? t.paywall.restoreSuccess
          : t.paywall.restoreNone,
        useSubscriptionStore.getState().isPro ? "success" : "info"
      );
    } catch {
      showToast(t.paywall.restoreFailed, "error");
    } finally {
      setRestoreBusy(false);
    }
  };

  const openExternalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showToast(t.settings.openLinkFailed, "error");
    }
  };

  const changeAppLock = async (next: boolean) => {
    if (lockBusy) return;
    setLockBusy(true);
    try {
      if (!next) {
        await setLockEnabled(false);
        showToast(t.settings.appLockDisabled, "info");
        return;
      }

      const outcome: DeviceAuthenticationOutcome = await authenticateWithDevice(
        t.settings.appLockPrompt,
        t.common.cancel
      );

      // authenticateWithDevice holds a native success briefly until this app
      // is active again, covering Face ID and Android credential Activities.
      if (outcome === "success" && AppState.currentState === "active") {
        await setLockEnabled(true);
        showToast(t.settings.appLockEnabled, "success");
      } else if (outcome !== "cancelled") {
        showToast(
          outcome === "unavailable" ? t.settings.appLockUnavailable : t.settings.appLockFailed,
          "error"
        );
      }
    } catch (err) {
      console.error("Failed to persist app lock preference:", err);
      showToast(t.errors.generic, "error");
    } finally {
      setLockBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t.settings.title }} />
      <ScrollView
        className="flex-1 bg-canvas"
        contentContainerClassName="gap-6 px-4 py-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <SettingsSection title={t.settings.subscription}>
          <Card className="gap-4">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
                <Sparkles size={19} color={colors.tint} />
              </View>
              <View className="min-h-10 flex-1 justify-center">
                <Text className="text-xs font-medium uppercase tracking-wide text-ink-mute">
                  {t.settings.subscriptionStatus}
                </Text>
                {subscriptionReady ? (
                  <Badge
                    className="mt-1.5"
                    label={isPro ? t.settings.subscriptionActive : t.settings.subscriptionInactive}
                    variant={isPro ? "success" : "default"}
                  />
                ) : (
                  <ActivityIndicator className="mt-2 self-start" size="small" color={colors.tint} />
                )}
              </View>
            </View>

            {isPro && periodEnd !== null && (
              <View className="border-t border-line pt-3">
                <Text className="text-xs text-ink-mute">{t.settings.subscriptionPeriodEnd}</Text>
                <Text className="mt-0.5 text-sm font-medium text-ink">{periodEnd}</Text>
              </View>
            )}

            <View className="gap-2 border-t border-line pt-3">
              {!isPro && (
                <Button
                  disabled={!subscriptionReady || restoreBusy}
                  icon={<Sparkles size={16} color="#fff" />}
                  onPress={() => router.push("/paywall")}
                >
                  {t.paywall.purchaseCta}
                </Button>
              )}
              <Button
                variant="secondary"
                loading={restoreBusy}
                disabled={!subscriptionReady || restoreBusy}
                icon={<RefreshCw size={16} color={colors.ink} />}
                onPress={() => void restorePurchases()}
              >
                {t.paywall.restore}
              </Button>
              {isPro && managementURL && (
                <Button
                  variant="ghost"
                  icon={<ExternalLink size={16} color={colors.inkMute} />}
                  onPress={() => void openExternalLink(managementURL)}
                >
                  {t.settings.manageSubscription}
                </Button>
              )}
            </View>
          </Card>
        </SettingsSection>

        <SettingsSection title={t.settings.theme}>
          <SegmentedTabs tabs={themeTabs} activeTab={theme} onChange={setTheme} />
        </SettingsSection>

        <SettingsSection title={t.settings.languageLabel}>
          <Card padding="none" className="overflow-hidden">
            {LANGUAGE_OPTIONS.map((option, index) => (
              <LanguageRow
                key={option.id}
                label={option.label}
                selected={option.id === currentLanguage}
                withDivider={index > 0}
                tint={colors.tint}
                onPress={() => setLanguage(option.id)}
              />
            ))}
          </Card>
        </SettingsSection>

        <SettingsSection title={t.settings.therapySchool}>
          <Card padding="none" className="overflow-hidden">
            <View className="px-4 py-3.5">
              <Text className="text-base font-semibold text-ink">
                {school?.name ?? quizTexts.noSchoolLabel}
              </Text>
              {school && (
                <Text className="mt-1 text-xs leading-relaxed text-ink-mute">{school.description}</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/school-quiz")}
              className="flex-row items-center gap-2.5 border-t border-line px-4 py-3.5 active:bg-raised"
            >
              <RefreshCw size={16} color={colors.tint} />
              <Text className="text-[15px] font-medium text-primary-600 dark:text-primary-400">
                {schoolId !== null ? quizTexts.retakeButton : quizTexts.takeButton}
              </Text>
            </Pressable>
          </Card>
        </SettingsSection>

        <SettingsSection title={t.settings.appLock}>
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-raised">
                <LockKeyhole size={19} color={colors.tint} />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-sm leading-5 text-ink-soft">{t.settings.appLockDescription}</Text>
                <Text className="mt-1 text-xs font-medium text-ink-mute">
                  {lockEnabled ? t.settings.appLockEnabled : t.settings.appLockDisabled}
                </Text>
              </View>
              {lockBusy ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <Toggle
                  checked={lockEnabled}
                  disabled={lockBusy}
                  onChange={(next) => void changeAppLock(next)}
                />
              )}
            </View>
          </Card>
        </SettingsSection>

        <SettingsSection title={t.settings.about}>
          <Card padding="none" className="overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <Text className="text-[15px] text-ink-soft">{t.settings.version}</Text>
              <Text className="text-[15px] font-medium text-ink">{version}</Text>
            </View>
            <ActionRow
              icon={<CodeXml size={18} color={colors.tint} />}
              label={t.onboarding.openSource}
              description={t.settings.openSourceDescription}
              trailing={<ExternalLink size={16} color={colors.inkMute} />}
              onPress={() => void openExternalLink(SOURCE_URL)}
            />
          </Card>
        </SettingsSection>
      </ScrollView>
    </>
  );
}

function formatSubscriptionDate(value: string | null, locale: string): string | null {
  if (value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 text-sm font-medium text-ink-mute">{title}</Text>
      {children}
    </View>
  );
}

function ActionRow({
  icon,
  label,
  description,
  trailing,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  trailing?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      className="flex-row items-center gap-3 border-t border-line px-4 py-3.5 active:bg-raised"
    >
      {icon}
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-ink">{label}</Text>
        {description && <Text className="mt-0.5 text-xs leading-4 text-ink-mute">{description}</Text>}
      </View>
      {trailing}
    </Pressable>
  );
}

function LanguageRow({
  label,
  selected,
  withDivider,
  tint,
  onPress,
}: {
  label: string;
  selected: boolean;
  withDivider: boolean;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-3.5 active:bg-raised ${withDivider ? "border-t border-line" : ""}`}
    >
      <Text className="text-base text-ink">{label}</Text>
      {selected && <Check size={18} color={tint} />}
    </Pressable>
  );
}
