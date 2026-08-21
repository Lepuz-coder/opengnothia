import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";
import { ToastContainer } from "./Toast";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  dismissible?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Bottom sheet on a plain RN Modal — deliberately the simplest thing that
 * works (Step 12). If a later phase needs drag-to-dismiss or snap points,
 * swap the inner panel for @gorhom/bottom-sheet; gesture-handler is already
 * installed for it.
 */
export function Sheet({ isOpen, onClose, title, dismissible = true, className, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* Sheets with a TextInput (insight notes, quick add) must rise with the keyboard. */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end">
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0 bg-black/50"
          onPress={dismissible ? onClose : undefined}
        />
        <View
          className={cn("rounded-t-3xl border-t border-line bg-card px-5 pt-3", className)}
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-line" />
          {title !== undefined && (
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-ink">{title}</Text>
              {dismissible && (
                <Pressable accessibilityRole="button" onPress={onClose} className="rounded-lg p-1 active:bg-raised">
                  <X size={20} color={colors.inkMute} />
                </Pressable>
              )}
            </View>
          )}
          {children}
        </View>
        {isOpen && <ToastContainer />}
      </KeyboardAvoidingView>
    </Modal>
  );
}
