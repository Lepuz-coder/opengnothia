export type Theme = "light" | "dark" | "system";
export type Approach = "practical" | "depth" | "balanced";
export type SessionStatus = "idle" | "pre" | "active" | "post";
export type ThinkingLevel = "low" | "medium" | "high" | "max";
export type AIProvider = "openai" | "anthropic" | "google" | "ollama" | "openrouter" | "custom";
export type TherapySchool = "general" | "cbt" | "psychodynamic" | "logotherapy" | "act" | "schema" | "stoic";

export interface UserProfile {
  id: number;
  name: string | null;
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
}

export interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  mood_before: number | null;
  mood_after: number | null;
  messages: ChatMessage[];
  summary: SessionSummary | null;
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
}

export interface SettingsState {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl: string;
  thinkingEnabled: boolean;
  thinkingLevel: ThinkingLevel;
}
