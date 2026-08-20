import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import { Check, MessageSquare, Mic, Pause, Pencil, Play, RotateCcw, Send, Volume2, X } from "lucide-react-native";
import { useTranslation } from "@opengnothia/shared/i18n";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";
import { Button } from "@/ui";
import type { VoiceLoopError, VoiceLoopStatus } from "./useVoiceConversation";

interface VoiceConversationViewProps {
  voiceStatus: VoiceLoopStatus;
  error: VoiceLoopError | null;
  currentAIText: string | null;
  lastUserTranscript: string | null;
  /** Recorder level 0..1 — drives the orb while listening. */
  audioLevel: number;
  recordingSeconds: number;
  onRecordingStop: () => void;
  onConfirmTranscript: (overrideText?: string) => void;
  onRetryRecording: () => void;
  onInterrupt: () => void;
  onPause: () => void;
  onResume: () => void;
  onSwitchToChat: () => void;
}

const PULSE_DURATION_MS: Partial<Record<VoiceLoopStatus, number>> = {
  playing: 1400,
  listening: 2600,
  waiting_for_ai: 2000,
  synthesizing: 2000,
  transcribing: 2000,
};

/**
 * Desktop's layered CSS orb, reduced to what RN animates well: a looping
 * pulse ring paced by status and a core that scales with the mic level.
 */
function VoiceOrb({ voiceStatus, audioLevel }: { voiceStatus: VoiceLoopStatus; audioLevel: number }) {
  const { colors } = useThemeColors();
  const pulse = useRef(new Animated.Value(0)).current;
  const pulseDuration = PULSE_DURATION_MS[voiceStatus];

  useEffect(() => {
    if (pulseDuration === undefined) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: pulseDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [pulse, pulseDuration]);

  const isPaused = voiceStatus === "paused";
  const isListening = voiceStatus === "listening";
  const isPlaying = voiceStatus === "playing";
  const coreScale = 1 + (isListening ? audioLevel * 0.25 : 0);

  return (
    <View className={cn("h-44 w-44 items-center justify-center", isPaused && "opacity-30")}>
      {pulseDuration !== undefined && (
        <Animated.View
          className="absolute h-32 w-32 rounded-full border-2"
          style={{
            borderColor: colors.tint,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }) }],
          }}
        />
      )}
      <View
        className="absolute h-32 w-32 rounded-full"
        style={{ backgroundColor: colors.tint, opacity: isPlaying || isListening ? 0.14 : 0.08 }}
      />
      <View
        className="h-24 w-24 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.tint,
          opacity: isPlaying ? 0.35 : 0.22,
          transform: [{ scale: coreScale }],
        }}
      />
      <View className="absolute h-4 w-4 rounded-full" style={{ backgroundColor: colors.tint }} />
    </View>
  );
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Faz 8 Step 67 — desktop VoiceConversationView's RN reinterpretation: orb +
 * status on top, transcripts in the middle, per-state controls at the bottom.
 * The orb zone doubles as the interrupt surface while the assistant speaks.
 */
export function VoiceConversationView({
  voiceStatus,
  error,
  currentAIText,
  lastUserTranscript,
  audioLevel,
  recordingSeconds,
  onRecordingStop,
  onConfirmTranscript,
  onRetryRecording,
  onInterrupt,
  onPause,
  onResume,
  onSwitchToChat,
}: VoiceConversationViewProps) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  // A hands-free conversation must not idle-lock the phone mid-turn (the
  // breathing exercise precedent) — scoped to voice mode by this mount.
  useKeepAwake();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");

  useEffect(() => {
    if (voiceStatus !== "confirming_transcript") setIsEditing(false);
  }, [voiceStatus]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [currentAIText, lastUserTranscript, voiceStatus]);

  const statusLabel = (() => {
    switch (voiceStatus) {
      case "waiting_for_ai":
        return t.chat.thinking;
      case "synthesizing":
        return t.voice.synthesizing;
      case "playing":
        return t.voice.playing;
      case "listening":
        return t.voice.listening;
      case "transcribing":
        return t.voice.transcribing;
      case "confirming_transcript":
        return t.voice.confirmTranscript;
      case "paused":
        return t.voice.voicePaused;
      default:
        return null;
    }
  })();

  const statusIcon = (() => {
    switch (voiceStatus) {
      case "playing":
        return <Volume2 size={15} color={colors.tint} />;
      case "listening":
        return <Mic size={15} color={colors.tint} />;
      case "confirming_transcript":
        return <Check size={15} color={colors.tint} />;
      case "paused":
        return <Pause size={15} color={colors.inkMute} />;
      default:
        return <ActivityIndicator size="small" color={colors.tint} />;
    }
  })();

  const errorText = (() => {
    switch (error) {
      case "mic_denied":
        return t.transcript.microphoneError;
      case "empty_transcription":
        return t.transcript.emptyTranscription;
      case "stt_failed":
        return t.transcript.transcriptionError;
      case "tts_failed":
        return t.voice.ttsError;
      default:
        return null;
    }
  })();

  const canInterrupt = voiceStatus === "playing" || voiceStatus === "synthesizing";
  const showAIText = currentAIText !== null && voiceStatus !== "idle";
  const aiTextFaded = voiceStatus !== "playing" && voiceStatus !== "synthesizing";
  const showUserTranscript =
    lastUserTranscript !== null &&
    (voiceStatus === "confirming_transcript" ||
      voiceStatus === "waiting_for_ai" ||
      voiceStatus === "synthesizing");
  const showConfirmUI = voiceStatus === "confirming_transcript" && lastUserTranscript !== null;

  const confirmEdited = () => {
    const trimmed = editedTranscript.trim();
    if (!trimmed) return;
    setIsEditing(false);
    onConfirmTranscript(trimmed);
  };

  return (
    <View className="flex-1 bg-canvas">
      {/* Mode bar: status pill + pause/resume + back to text (desktop header parity) */}
      <View className="flex-row items-center gap-2 px-4 py-2.5">
        <View className="flex-row items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5">
          {statusIcon}
          {statusLabel !== null && <Text className="text-xs font-medium text-ink-mute">{statusLabel}</Text>}
        </View>
        <View className="flex-1" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={voiceStatus === "paused" ? t.voice.resumeVoice : t.voice.pauseVoice}
          onPress={voiceStatus === "paused" ? onResume : onPause}
          className="rounded-lg p-2 active:bg-raised"
        >
          {voiceStatus === "paused" ? (
            <Play size={18} color={colors.inkMute} />
          ) : (
            <Pause size={18} color={colors.inkMute} />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.voice.switchToChat}
          onPress={onSwitchToChat}
          className="flex-row items-center gap-1.5 rounded-lg p-2 active:bg-raised"
        >
          <MessageSquare size={18} color={colors.inkMute} />
          <Text className="text-xs font-medium text-ink-mute">{t.voice.switchToChat}</Text>
        </Pressable>
      </View>

      {/* Orb — tapping it interrupts speech (Step 66) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.voice.tapToInterrupt}
        disabled={!canInterrupt}
        onPress={onInterrupt}
        className="items-center pt-2"
      >
        <VoiceOrb voiceStatus={voiceStatus} audioLevel={audioLevel} />
        {canInterrupt && <Text className="mt-1 text-xs text-ink-mute">{t.voice.tapToInterrupt}</Text>}
      </Pressable>

      {/* Transcripts */}
      <ScrollView ref={scrollRef} className="flex-1 px-5 pt-3" contentContainerClassName="gap-3 pb-4">
        {showAIText && (
          <View
            className={cn(
              "rounded-2xl border border-primary-500/25 bg-card px-4 py-3.5",
              aiTextFaded && "opacity-40",
            )}
          >
            <Text className="text-base leading-relaxed text-ink">{currentAIText}</Text>
          </View>
        )}
        {showUserTranscript && (
          <View
            className={cn(
              "self-end rounded-2xl rounded-br-md border bg-primary-500/10 px-4 py-3",
              isEditing ? "w-full border-primary-500/60" : "max-w-[85%] border-primary-500/25",
            )}
          >
            {isEditing ? (
              <TextInput
                multiline
                autoFocus
                value={editedTranscript}
                onChangeText={setEditedTranscript}
                placeholderTextColor={colors.inkMute}
                className="max-h-40 min-h-[44px] text-base leading-snug text-ink"
              />
            ) : (
              <Text className="text-base leading-relaxed text-ink">{lastUserTranscript}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Per-state bottom controls */}
      <View className="items-center gap-3 px-5 pb-4 pt-1">
        {errorText !== null && (
          <Text className="text-center text-xs text-red-500">{errorText}</Text>
        )}

        {voiceStatus === "listening" && (
          <>
            <Text className="text-sm text-ink-mute" style={{ fontVariant: ["tabular-nums"] }}>
              {formatSeconds(recordingSeconds)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.voice.sendRecording}
              onPress={onRecordingStop}
              className="h-16 w-16 items-center justify-center rounded-full bg-primary-500 active:bg-primary-600"
            >
              <Send size={24} color="#fff" />
            </Pressable>
          </>
        )}

        {showConfirmUI && (
          <View className="flex-row flex-wrap items-center justify-center gap-2.5">
            {isEditing ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<X size={15} color={colors.inkMute} />}
                onPress={() => setIsEditing(false)}
              >
                {t.common.cancel}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RotateCcw size={15} color={colors.inkMute} />}
                  onPress={onRetryRecording}
                >
                  {t.voice.retryRecording}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Pencil size={15} color={colors.inkMute} />}
                  onPress={() => {
                    setEditedTranscript(lastUserTranscript ?? "");
                    setIsEditing(true);
                  }}
                >
                  {t.common.edit}
                </Button>
              </>
            )}
            <Button
              size="sm"
              icon={<Check size={15} color="#fff" />}
              disabled={isEditing && editedTranscript.trim().length === 0}
              onPress={() => (isEditing ? confirmEdited() : onConfirmTranscript())}
            >
              {t.voice.confirmAndSend}
            </Button>
          </View>
        )}

        {voiceStatus === "paused" && (
          <Button icon={<Play size={16} color="#fff" />} onPress={onResume}>
            {t.voice.resumeVoice}
          </Button>
        )}
      </View>
    </View>
  );
}
