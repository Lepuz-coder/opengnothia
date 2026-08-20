import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, FolderPlus, X } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { COLOR_PRESETS, EMOJI_PRESETS } from "@opengnothia/shared/constants/insightPresets";
import type { InsightGroup } from "@opengnothia/shared/types";
import { getQueries } from "@/db";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button, Card, Input } from "@/ui";

const DEFAULT_EMOJI = "💡";
const DEFAULT_COLOR = "#3ABAB4";

interface GroupFormValues {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const EMPTY_FORM: GroupFormValues = { name: "", emoji: DEFAULT_EMOJI, description: "", color: DEFAULT_COLOR };

/** Emoji presets + custom field and colour swatches, shared by create & edit. */
function GroupFormFields({
  values,
  onChange,
}: {
  values: GroupFormValues;
  onChange: (patch: Partial<GroupFormValues>) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <View className="gap-4">
      <Input
        label={t.insights.groupName}
        value={values.name}
        onChangeText={(name) => onChange({ name })}
        placeholder={t.insights.groupNamePlaceholder}
      />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink-soft">{t.insights.emoji}</Text>
        <View className="flex-row flex-wrap gap-2">
          {EMOJI_PRESETS.map((emoji) => (
            <Pressable
              key={emoji}
              accessibilityRole="button"
              accessibilityState={{ selected: values.emoji === emoji }}
              onPress={() => onChange({ emoji })}
              className={cn(
                "h-10 w-10 items-center justify-center rounded-lg",
                values.emoji === emoji ? "border-2 border-tint bg-primary-100 dark:bg-primary-900/40" : "bg-raised"
              )}
            >
              <Text className="text-lg">{emoji}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-1 flex-row items-center gap-2">
          <TextInput
            value={values.emoji}
            onChangeText={(val) => {
              // Keep at most one emoji; slice(-2) preserves a surrogate pair.
              if (val) onChange({ emoji: val.slice(-2) });
            }}
            placeholderTextColor={colors.inkMute}
            className="h-10 w-14 rounded-lg border border-line bg-canvas text-center text-lg text-ink"
          />
          <Text className="text-xs text-ink-mute">{t.insights.emojiCustom}</Text>
        </View>
      </View>

      <Input
        label={t.insights.descriptionOptional}
        value={values.description}
        onChangeText={(description) => onChange({ description })}
        placeholder={t.insights.descriptionPlaceholder}
        multiline
        className="min-h-[60px]"
      />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink-soft">{t.insights.color}</Text>
        <View className="flex-row flex-wrap gap-2.5">
          {COLOR_PRESETS.map((color) => (
            <Pressable
              key={color}
              accessibilityRole="button"
              accessibilityState={{ selected: values.color === color }}
              onPress={() => onChange({ color })}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: color }}
            >
              {values.color === color && <Check size={18} color="#fff" strokeWidth={3} />}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Page-sheet chrome shared by the two modals: cancel · title · save. */
function FormSheet({
  visible,
  title,
  saveDisabled,
  saving,
  onClose,
  onSave,
  children,
}: {
  visible: boolean;
  title: string;
  saveDisabled: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
        <View className="flex-row items-center justify-between border-b border-line px-3 py-2.5">
          <Button variant="ghost" size="sm" onPress={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Text className="mx-2 flex-1 text-center text-base font-semibold text-ink" numberOfLines={1}>
            {title}
          </Text>
          <Button size="sm" onPress={onSave} disabled={saveDisabled} loading={saving}>
            {t.common.save}
          </Button>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface NewInsightModalProps {
  visible: boolean;
  groups: InsightGroup[];
  onClose: () => void;
  /** Fired after the insert lands so the parent can reload lists (or, in-session, track the id). */
  onSaved: (groupId: string, insightId: string) => void;
  /** Fired after an inline group create so the parent can refresh `groups`. */
  onGroupCreated: () => Promise<void>;
}

/**
 * Desktop's "Yeni İçgörü" modal: pick a group (or create one inline) and
 * write the note. The <select> becomes a tappable row list — group counts
 * stay small enough that a picker wheel would be overkill.
 */
export function NewInsightModal({ visible, groups, onClose, onSaved, onGroupCreated }: NewInsightModalProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [content, setContent] = useState("");
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [form, setForm] = useState<GroupFormValues>(EMPTY_FORM);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedGroupId(groups[0]?.id ?? "");
      setContent("");
      // With no groups yet there is nothing to pick — open straight onto the form.
      setShowNewGroupForm(groups.length === 0);
      setForm(EMPTY_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm only when opening
  }, [visible]);

  const handleCreateGroup = async () => {
    if (!form.name.trim()) return;
    setCreatingGroup(true);
    try {
      const queries = await getQueries();
      const id = await queries.createInsightGroup({
        name: form.name.trim(),
        emoji: form.emoji,
        description: form.description.trim() || undefined,
        color: form.color,
      });
      await onGroupCreated();
      setSelectedGroupId(id);
      setShowNewGroupForm(false);
      setForm(EMPTY_FORM);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim() || !selectedGroupId) return;
    setSaving(true);
    try {
      const queries = await getQueries();
      const insightId = await queries.createInsight({ group_id: selectedGroupId, content: content.trim() });
      onSaved(selectedGroupId, insightId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet
      visible={visible}
      title={t.insights.newInsight}
      saveDisabled={!content.trim() || !selectedGroupId}
      saving={saving}
      onClose={onClose}
      onSave={handleSave}
    >
      {!showNewGroupForm ? (
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-ink-soft">{t.insights.selectGroup}</Text>
            <Button
              variant="ghost"
              size="sm"
              icon={<FolderPlus size={16} color={colors.inkMute} />}
              onPress={() => setShowNewGroupForm(true)}
            >
              {t.insights.createNewGroup}
            </Button>
          </View>
          <Card padding="none" className="overflow-hidden">
            {groups.length === 0 && (
              <Text className="px-4 py-3.5 text-sm text-ink-mute">{t.insights.createGroupFirst}</Text>
            )}
            {groups.map((group, index) => (
              <Pressable
                key={group.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: group.id === selectedGroupId }}
                onPress={() => setSelectedGroupId(group.id)}
                className={cn(
                  "flex-row items-center justify-between px-4 py-3 active:bg-raised",
                  index > 0 && "border-t border-line"
                )}
              >
                <View className="flex-1 flex-row items-center gap-2.5 pr-2">
                  <Text className="text-lg">{group.emoji}</Text>
                  <Text className="flex-1 text-base text-ink" numberOfLines={1}>
                    {group.name}
                  </Text>
                </View>
                {group.id === selectedGroupId && <Check size={18} color={colors.tint} />}
              </Pressable>
            ))}
          </Card>
        </View>
      ) : (
        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink">{t.insights.createNewGroupTitle}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowNewGroupForm(false);
                setForm(EMPTY_FORM);
              }}
              className="rounded-lg p-1 active:bg-raised"
            >
              <X size={18} color={colors.inkMute} />
            </Pressable>
          </View>
          <GroupFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
          <Button onPress={handleCreateGroup} disabled={!form.name.trim()} loading={creatingGroup}>
            {t.insights.createGroup}
          </Button>
        </Card>
      )}

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink-soft">{t.insights.insightLabel}</Text>
        <TextInput
          multiline
          value={content}
          onChangeText={setContent}
          placeholder={t.insights.notePlaceholder}
          placeholderTextColor={colors.inkMute}
          textAlignVertical="top"
          className="min-h-[120px] rounded-xl border border-line bg-card px-4 py-3 text-base leading-relaxed text-ink"
        />
      </View>
    </FormSheet>
  );
}

interface EditGroupModalProps {
  visible: boolean;
  group: InsightGroup | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditGroupModal({ visible, group, onClose, onSaved }: EditGroupModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<GroupFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && group) {
      setForm({
        name: group.name,
        emoji: group.emoji,
        description: group.description ?? "",
        color: group.color,
      });
    }
  }, [visible, group]);

  const handleSave = async () => {
    if (!group || !form.name.trim()) return;
    setSaving(true);
    try {
      const queries = await getQueries();
      await queries.updateInsightGroup(group.id, {
        name: form.name.trim(),
        emoji: form.emoji,
        description: form.description.trim() || undefined,
        color: form.color,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet
      visible={visible}
      title={t.insights.editGroup}
      saveDisabled={!form.name.trim()}
      saving={saving}
      onClose={onClose}
      onSave={handleSave}
    >
      <GroupFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
    </FormSheet>
  );
}
