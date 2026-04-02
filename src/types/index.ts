export type Language = "tr" | "en" | "zh" | "es" | "pt" | "de" | "fr" | "ja";
export type Theme = "light" | "dark" | "system";
export type Approach = "practical" | "depth" | "balanced";
export type SessionStatus = "idle" | "pre" | "active" | "post";
export type ThinkingLevel = "low" | "medium" | "high" | "max";
export type ThinkingType = "adaptive" | "budget";
export type AIProvider = "openai" | "anthropic";
export type TherapySchool = string;
export type TTSModel = "tts-1" | "tts-1-hd";
export type TTSVoice = "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer";
export type SessionMode = "chat" | "voice";

export interface UserProfile {
  id: number;
  name: string | null;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  goals: string[];
  approach: Approach;
  preferred_session_time: string;
  session_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  thinking?: string;
  isStreaming?: boolean;
  isThinkingActive?: boolean;
  isCompactSummary?: boolean;
}

export interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  mood_before: number | null;
  mood_after: number | null;
  messages: ChatMessage[];
  summary: SessionSummary | null;
  summary_narrative: string | null;
  therapist_notes: string[] | null;
  status: "active" | "completed" | "abandoned";
  created_at: string;
}

export interface SessionSummary {
  themes: string[];
  defenses: string[];
  insights: string[];
  homework: string[];
  therapist_notes?: string[];
}

export interface CheckIn {
  id: string;
  date: string;
  mood: number;
  energy: number;
  sleep: number;
  had_dream: boolean;
  dream_note: string | null;
  tags: string[];
  created_at: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: number | null;
  tags: string[];
  ai_analysis: string | null;
  created_at: string;
}

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  baseUrl: string;
  requiresKey: boolean;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  supportsThinking?: boolean;
  supportsAdaptiveThinking?: boolean;
}

export interface Dream {
  id: string;
  date: string;
  content: string;
  analysis: string | null;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  created_at: string;
  updated_at: string;
}

export interface InsightGroup {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  color: string;
  insight_count: number;
  last_insight_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  group_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedInsight {
  id: string;
  group_id: string | null;
  new_group: { name: string; emoji: string; description: string; color: string } | null;
  content: string;
  group_name?: string;
  group_emoji?: string;
}

export interface WeeklySummary {
  id: string;
  week_start: string;
  content: string;
  session_count: number;
  created_at: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface TokenUsageRecord {
  id: string;
  session_id: string | null;
  provider: AIProvider;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  call_type: "greeting" | "chat" | "recommendation" | "summary" | "patient_notes" | "dream_analysis" | "journal_analysis" | "compaction" | "weekly_summary" | "insight_extraction" | "stt" | "tts" | "course_lesson";
  created_at: string;
}

export interface CourseStepProgress {
  id: string;
  course_id: string;
  step_index: number;
  status: "locked" | "available" | "in_progress" | "completed";
  progress: number;
  messages: ChatMessage[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsState {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl: string;
  thinkingEnabled: boolean;
  thinkingLevel: ThinkingLevel;
}
