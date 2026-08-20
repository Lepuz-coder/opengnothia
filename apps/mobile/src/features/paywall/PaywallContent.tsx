import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Purchases, {
  PURCHASES_ERROR_CODE,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { Brain, Check, Flag, MessageSquare, Moon, Sparkles, X } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { showToast } from "@/stores/useToastStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useThemeColors } from "@/theme/useAppTheme";
import { Badge, Button } from "@/ui";

interface PaywallContentProps {
  /**
   * modal: the M3 gate surface — X to close, done = dismiss.
   * onboarding: M11's skippable step — "skip for now" instead of X.
   */
  variant: "modal" | "onboarding";
  /** proceedAsPro is true when the viewer leaves with an active entitlement. */
  onDone: (proceedAsPro: boolean) => void;
}

/**
 * M6: fully custom paywall — no react-native-purchases-ui. Prices are never
 * hardcoded (M5): both cards render whatever StoreKit/offerings return, and the
 * yearly savings badge is computed from those numbers at render time. Faz 7
 * extracted this from app/paywall.tsx unchanged so the onboarding step (M11)
 * and the gate modal stay one implementation.
 */
export function PaywallContent({ variant, onDone }: PaywallContentProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const restore = useSubscriptionStore((s) => s.restore);

  // undefined = loading, null = failed or empty — distinct states for the UI.
  const [offering, setOffering] = useState<PurchasesOffering | null | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);

  const loadOfferings = useCallback(async () => {
    setOffering(undefined);
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (current && (current.monthly !== null || current.annual !== null)) {
        setOffering(current);
      } else {
        setOffering(null);
      }
    } catch {
      setOffering(null);
    }
  }, []);

  useEffect(() => {
    void loadOfferings();
  }, [loadOfferings]);

  const monthlyPkg = offering?.monthly ?? null;
  const yearlyPkg = offering?.annual ?? null;

  // Default selection: yearly when present — the plan's preferred package (M5).
  useEffect(() => {
    if (selectedId === null && offering) {
      setSelectedId((yearlyPkg ?? monthlyPkg)?.identifier ?? null);
    }
  }, [offering, yearlyPkg, monthlyPkg, selectedId]);

  const selectedPkg =
    [monthlyPkg, yearlyPkg].find((p) => p !== null && p.identifier === selectedId) ?? null;

  // "%X tasarruf" on the yearly card, derived from the two store prices.
  const savingsPercent =
    monthlyPkg && yearlyPkg && monthlyPkg.product.price > 0
      ? Math.round((1 - yearlyPkg.product.price / (monthlyPkg.product.price * 12)) * 100)
      : 0;

  const purchase = async () => {
    if (!selectedPkg || busy !== null) return;
    setBusy("purchase");
    try {
      await Purchases.purchasePackage(selectedPkg);
      showToast(t.paywall.purchaseSuccess, "success");
      onDone(true);
    } catch (err) {
      // User backing out of the store sheet is not an error state.
      if ((err as PurchasesError).code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        showToast(t.paywall.purchaseFailed, "error");
      }
    } finally {
      setBusy(null);
    }
  };

  const restorePurchases = async () => {
    if (busy !== null) return;
    setBusy("restore");
    try {
      await restore();
      if (useSubscriptionStore.getState().isPro) {
        showToast(t.paywall.restoreSuccess, "success");
        onDone(true);
      } else {
        showToast(t.paywall.restoreNone, "info");
      }
    } catch {
      showToast(t.paywall.restoreFailed, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="mb-2 flex-row justify-end">
          {variant === "modal" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
              onPress={() => onDone(isPro)}
              className="rounded-full bg-raised p-2 active:bg-line"
            >
              <X size={20} color={colors.inkMute} />
            </Pressable>
          ) : (
            <Button variant="ghost" size="sm" onPress={() => onDone(isPro)}>
              {t.onboarding.skipForNow}
            </Button>
          )}
        </View>

        <View className="items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-primary-100 dark:bg-primary-900/40">
            <Sparkles size={30} color={colors.tint} />
          </View>
          <Text className="text-center text-3xl font-bold text-ink">{t.paywall.title}</Text>
          <Text className="mt-2 text-center text-base text-ink-soft">{t.paywall.subtitle}</Text>
        </View>

        {isPro ? (
          <View className="mt-10 items-center gap-6">
            <View className="flex-row items-center gap-2">
              <Check size={20} color={colors.tint} />
              <Text className="text-base font-medium text-ink">{t.paywall.alreadyPro}</Text>
            </View>
            <Button variant="secondary" onPress={() => onDone(true)}>
              {variant === "modal" ? t.common.close : t.common.continue}
            </Button>
          </View>
        ) : (
          <>
            <View className="mt-7 gap-3.5">
              <FeatureRow icon={<MessageSquare size={18} color={colors.tint} />} label={t.paywall.featureSessions} />
              <FeatureRow icon={<Moon size={18} color={colors.tint} />} label={t.paywall.featureAnalyses} />
              <FeatureRow icon={<Flag size={18} color={colors.tint} />} label={t.paywall.featureMilestones} />
              <FeatureRow icon={<Brain size={18} color={colors.tint} />} label={t.paywall.featureMemory} />
            </View>

            <View className="mt-8 gap-3">
              {offering === undefined ? (
                <View className="items-center py-10">
                  <ActivityIndicator color={colors.tint} />
                </View>
              ) : offering === null ? (
                <View className="items-center gap-4 py-6">
                  <Text className="text-center text-sm text-ink-soft">{t.paywall.offeringsError}</Text>
                  <Button variant="secondary" size="sm" onPress={() => void loadOfferings()}>
                    {t.errors.retryButton}
                  </Button>
                </View>
              ) : (
                <>
                  {yearlyPkg && (
                    <PackageCard
                      name={t.paywall.yearly}
                      price={`${yearlyPkg.product.priceString}${t.paywall.perYear}`}
                      sub={
                        yearlyPkg.product.pricePerMonthString
                          ? t.paywall.yearlyEquivalent.replace("{price}", yearlyPkg.product.pricePerMonthString)
                          : undefined
                      }
                      badge={
                        savingsPercent >= 1
                          ? t.paywall.savings.replace("{percent}", String(savingsPercent))
                          : undefined
                      }
                      selected={selectedId === yearlyPkg.identifier}
                      onPress={() => setSelectedId(yearlyPkg.identifier)}
                    />
                  )}
                  {monthlyPkg && (
                    <PackageCard
                      name={t.paywall.monthly}
                      price={`${monthlyPkg.product.priceString}${t.paywall.perMonth}`}
                      selected={selectedId === monthlyPkg.identifier}
                      onPress={() => setSelectedId(monthlyPkg.identifier)}
                    />
                  )}
                </>
              )}
            </View>

            {offering != null && (
              <View className="mt-6 gap-2">
                <Button
                  size="lg"
                  loading={busy === "purchase"}
                  disabled={selectedPkg === null || busy !== null}
                  onPress={() => void purchase()}
                >
                  {t.paywall.purchaseCta}
                </Button>
                <Button variant="ghost" loading={busy === "restore"} disabled={busy !== null} onPress={() => void restorePurchases()}>
                  {t.paywall.restore}
                </Button>
                <Text className="mt-1 text-center text-xs leading-4 text-ink-mute">{t.paywall.renewalNote}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
        {icon}
      </View>
      <Text className="flex-1 text-[15px] text-ink">{label}</Text>
    </View>
  );
}

function PackageCard({
  name,
  price,
  sub,
  badge,
  selected,
  onPress,
}: {
  name: string;
  price: string;
  sub?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "rounded-2xl border-2 bg-card p-4 active:opacity-90",
        selected ? "border-tint" : "border-line"
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <Text className="text-base font-semibold text-ink">{name}</Text>
          {badge && <Badge label={badge} variant="primary" />}
        </View>
        <RadioDot selected={selected} />
      </View>
      <Text className="mt-2 text-xl font-bold text-ink">{price}</Text>
      {sub && <Text className="mt-0.5 text-xs text-ink-mute">{sub}</Text>}
    </Pressable>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <View
      className={cn(
        "h-5 w-5 items-center justify-center rounded-full border-2",
        selected ? "border-tint bg-tint" : "border-line bg-transparent"
      )}
    >
      {selected && <View className="h-1.5 w-1.5 rounded-full bg-white" />}
    </View>
  );
}
