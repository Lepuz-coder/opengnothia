import type { UserProfile, CheckIn, SessionSummary, TherapySchool, Language } from "@/types";
import { getTherapySchool } from "@/constants/therapySchools";
import { getCurrentLanguage } from "@/i18n";

function getLanguageInstruction(lang?: Language): string {
  const l = lang ?? getCurrentLanguage();
  if (l === "tr") return "\n\nIMPORTANT: Always respond to the user in Turkish (Türkçe).";
  return "\n\nIMPORTANT: Always respond to the user in English.";
}

// --- Trigger messages & helpers used by pages ---

export const TEST_MESSAGE = "Hello, test message.";
export const TEST_SYSTEM_PROMPT = "Say a short hello.";
export const GREETING_TRIGGER = "Hello, let's start the session.";
export const WEEKLY_SUMMARY_TRIGGER = "Generate weekly summary.";
export const JOURNAL_ANALYSIS_TRIGGER = "Analyze my journal entry.";
export const DREAM_ANALYSIS_TRIGGER = "Analyze my dream.";
export const BACKGROUND_NOTES_SYSTEM_PROMPT = "You are an experienced clinical psychologist. Update the patient notes.";
export const SESSION_SUMMARY_SYSTEM_PROMPT = "You are an experienced clinical psychologist and you are this client's therapist. You are talking with the client at the end of the session.";

export function journalPatientNotesMessage(content: string, analysis: string): string {
  return `The client shared this journal entry: ${content}\n\nJournal analysis: ${analysis}`;
}

export function dreamPatientNotesMessage(content: string, analysis: string): string {
  return `The client shared this dream: ${content}\n\nDream analysis: ${analysis}`;
}

// --- Prompt builders ---

export function buildSystemPrompt(params: {
  profile: UserProfile | null;
  todayCheckIn: CheckIn | null;
  lastSessionSummary: SessionSummary | null;
  lastSessionNarrative?: string | null;
  therapySchool?: TherapySchool;
  patientNotes?: string;
  lastSessionDate?: string | null;
  totalSessionCount?: number;
  language?: Language;
}): string {
  const { profile, todayCheckIn, lastSessionSummary, lastSessionNarrative, therapySchool, patientNotes, lastSessionDate, totalSessionCount } = params;

  let prompt = `You are OpenGnothia's AI-powered psychological support assistant.

Core principles:
- Display an empathetic, warm, and non-judgmental approach
- Reflect and validate the client's emotions
- Ask open-ended questions
- Gently confront when necessary
- Maintain professional boundaries — you are not a therapist, you are a support agent
- Suggest seeking professional help in crisis situations
- Keep your responses short and concise, speak in paragraphs`;

  prompt += getLanguageInstruction(params.language);

  // Temporal context
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  prompt += `\n\nTemporal context:`;
  prompt += `\n- Today's date: ${todayStr}`;
  if (lastSessionDate) {
    const lastDate = new Date(lastSessionDate);
    const lastDateStr = lastDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    prompt += `\n- Last session date: ${lastDateStr} (${diffDays} days ago)`;
  }
  if (totalSessionCount !== undefined) {
    prompt += `\n- Total completed sessions: ${totalSessionCount}`;
  }

  if (therapySchool) {
    const school = getTherapySchool(therapySchool);
    if (school) {
      prompt += `\n\n--- Therapy School ---\n${school.promptInstructions}`;
    }
  }

  if (profile) {
    prompt += `\n\nClient information:`;
    if (profile.name) prompt += `\n- Name: ${profile.name}`;
    if (profile.age) prompt += `\n- Age: ${profile.age}`;
    if (profile.gender) prompt += `\n- Gender: ${profile.gender}`;
    if (profile.occupation) prompt += `\n- Occupation/School: ${profile.occupation}`;
    if (profile.goals.length > 0) prompt += `\n- Goals: ${profile.goals.join(", ")}`;
    prompt += `\n- Preferred approach: ${
      profile.approach === "practical" ? "Practical and solution-oriented" :
      profile.approach === "depth" ? "In-depth and exploration-oriented" :
      "Balanced"
    }`;
  }

  if (todayCheckIn) {
    prompt += `\n\nToday's check-in:`;
    prompt += `\n- Mood: ${todayCheckIn.mood}/10`;
    prompt += `\n- Energy: ${todayCheckIn.energy}/10`;
    prompt += `\n- Sleep: ${todayCheckIn.sleep}/5`;
    if (todayCheckIn.had_dream && todayCheckIn.dream_note) {
      prompt += `\n- Dream: ${todayCheckIn.dream_note}`;
    }
    if (todayCheckIn.tags.length > 0) {
      prompt += `\n- Tags: ${todayCheckIn.tags.join(", ")}`;
    }
  }

  const hasStructuredSummary = lastSessionSummary && (lastSessionSummary.themes.length > 0 || lastSessionSummary.insights.length > 0 || lastSessionSummary.homework.length > 0);
  if (hasStructuredSummary) {
    prompt += `\n\nLast session summary:`;
    if (lastSessionSummary.themes.length > 0) prompt += `\n- Themes: ${lastSessionSummary.themes.join(", ")}`;
    if (lastSessionSummary.insights.length > 0) prompt += `\n- Insights: ${lastSessionSummary.insights.join(", ")}`;
    if (lastSessionSummary.homework.length > 0) prompt += `\n- Homework: ${lastSessionSummary.homework.join(", ")}`;
  } else if (lastSessionNarrative && lastSessionNarrative.trim().length > 0) {
    prompt += `\n\nLast session summary:\n${lastSessionNarrative}`;
  }

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Cumulative Patient Notes (Notes You Keep for Yourself as the Therapist) ---`;
    prompt += `\nThese are clinical notes you kept from previous sessions. Take these into account to maintain continuity with the client:`;
    prompt += `\n${patientNotes}`;
  }

  return prompt;
}

export function buildGreetingPrompt(params: {
  profile: UserProfile | null;
  todayCheckIn: CheckIn | null;
  lastSessionSummary: SessionSummary | null;
  lastSessionNarrative?: string | null;
  therapySchool?: TherapySchool;
  patientNotes?: string;
  lastSessionDate?: string | null;
  totalSessionCount?: number;
  language?: Language;
}): string {
  let prompt = buildSystemPrompt(params);

  prompt += `\n\n--- Session Opening ---
You are sending the first message of this session. Greet the client warmly and briefly.
If you have patient notes, you may briefly reference topics or homework from previous sessions.
IMPORTANT: Do not tell the client check-in data (numerical values such as mood score, energy score, sleep score). Use this data only as your background information — adjust the tone and approach of the conversation accordingly but do not explicitly state the scores.
Keep it short — start with 2-3 sentences and invite the client to talk.`;

  return prompt;
}

export function buildPatientNotesUpdatePrompt(existingNotes: string, lastUpdatedAt?: string | null): string {
  let memorySection = "";
  if (existingNotes) {
    memorySection = `--- Existing Memory ---\n`;
    if (lastUpdatedAt) {
      const updatedDate = new Date(lastUpdatedAt);
      const updatedStr = updatedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
      memorySection += `(Last updated: ${updatedStr})\n`;
    }
    memorySection += `${existingNotes}\n\n`;
  }

  return `You are an experienced clinical psychologist. You maintain a long-term memory file about your client. This file contains persistent information carried from session to session, journal to journal, that allows you to truly know your client.
${memorySection}--- Your Task ---
Analyze the given content and create an updated memory file by merging it with the existing memory.
The output should be a single unified file — do not separate old and new information, merge them into a single coherent structure.

Format — short notes with bullet points, under these headings:

## Client Profile
- Personality traits, values, worldview
- Strengths and coping mechanisms
- Sensitive points, triggers, defense mechanisms

## Relationship Map
- Important people in their life (name — who they are — nature of the relationship)
- Maximum 15 people, only those who are truly significant

## Recurring Themes and Patterns
- Topics that recur in sessions/journals
- Observed behavioral and thought patterns
- Emotional patterns

## Active Topics
- Current situations on the agenda in their life
- Ongoing problems or processes

## Insights and Progress
- Awareness gained by the client
- Observed positive changes
- Resistant or stuck areas

## Follow-Up Items
- Assigned homework or suggestions
- Topics to ask about/check in the next session

## Attention (only if applicable)
- Crisis risk, suicidal/self-harm thoughts
- Situations requiring immediate intervention

CRITICAL RULES:
- Each item should be at most 2 lines
- Do NOT write explanations, commentary, or paragraphs — only short, reminder notes
- Preserve persistent information: personality traits, relationships, patterns should not be deleted
- Remove outdated temporary information (resolved issues, completed homework)
- Write in English
- Only write the memory file, do not add any other explanation`;
}

export function buildDreamAnalysisPrompt(patientNotes: string, language?: Language): string {
  let prompt = `You are an experienced clinical psychologist specializing in dream analysis. Analyze in depth the dream shared by the client.${getLanguageInstruction(language)}

Address these headings in your analysis:
- **Symbols and Metaphors**: Important symbols in the dream and their possible meanings
- **Emotional Themes**: Prominent emotional patterns in the dream
- **Connections to Waking Life**: Possible relationships between the dream and daily life experiences
- **Unconscious Material**: Unconscious processes and repressed content the dream may point to

Rules:
- Write in Markdown format
- Use empathetic and understandable language, avoid excessive clinical jargon
- Address the client directly (use "you" language)
- Avoid definitive judgments, offer possibilities and interpretations`;

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Clinical Notes About the Client ---\nThese notes will help you understand the client's psychological profile. Take this context into account in the dream analysis:\n${patientNotes}`;
  }

  return prompt;
}

export function buildJournalAnalysisPrompt(params: {
  journalContent: string;
  mood: number | null;
  tags: string[];
  patientNotes: string;
  profile: UserProfile | null;
  therapySchool?: TherapySchool;
  language?: Language;
}): string {
  const { journalContent, mood, tags, patientNotes, profile, therapySchool } = params;

  let prompt = `You are an experienced clinical psychologist. You will analyze the client's journal entry.

Core principles:
- Provide an empathetic, supportive, and insight-oriented analysis
- Address the client directly (use "you" language)
- Identify emotions, themes, and patterns in the writing
- Help develop awareness and insight
- Gently suggest new perspectives when needed
- Write in Markdown format, 2-4 paragraphs`;

  prompt += getLanguageInstruction(params.language);

  if (therapySchool) {
    const school = getTherapySchool(therapySchool);
    if (school) {
      prompt += `\n\nTherapy school: ${school.name}\n${school.promptInstructions}`;
    }
  }

  if (profile) {
    prompt += `\n\nClient information:`;
    if (profile.name) prompt += `\n- Name: ${profile.name}`;
    if (profile.age) prompt += `\n- Age: ${profile.age}`;
    if (profile.goals.length > 0) prompt += `\n- Goals: ${profile.goals.join(", ")}`;
  }

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Cumulative Patient Notes ---\n${patientNotes}`;
  }

  prompt += `\n\n--- Journal Entry ---`;
  if (mood !== null) prompt += `\nMood: ${mood}/10`;
  if (tags.length > 0) prompt += `\nTags: ${tags.join(", ")}`;
  prompt += `\n\n${journalContent}`;

  prompt += `\n\n--- Your Task ---
Analyze this journal entry. Focus on:
- Identify the core emotions and themes in the writing
- Point out patterns the client may not be aware of
- Provide supportive and insight-developing feedback
- Ask thought-provoking questions when needed

Write in Markdown format, 2-4 paragraphs. Use a warm and supportive tone.`;

  return prompt;
}

export function buildCompactionPrompt(language?: Language): string {
  return `Analyze the entire session conversation and create a comprehensive summary that ensures therapeutic continuity.

This summary will REPLACE the conversation history, so it must preserve all therapeutically important information.

It should include:
1. Topics covered and complaints presented from the beginning of the session to now
2. Emotional themes, mood shifts
3. Important people, events, and situations mentioned
4. Emerging insights, observed defense mechanisms
5. WHERE WE ARE NOW in the conversation — the most recently discussed topic and its direction
6. Natural continuation point — where the active question or topic left off

CRITICAL: The summary should enable you to naturally continue the session as if you still had the full conversation history.
Write in therapist note style, in first person singular. Be comprehensive but concise.${getLanguageInstruction(language)}`;
}

export function buildWeeklySummaryPrompt(params: {
  weekRange: string;
  sessions: {
    date: string;
    summary: SessionSummary | null;
    summaryNarrative: string | null;
  }[];
  patientNotes: string;
  profile: UserProfile | null;
  language?: Language;
}): string {
  const { weekRange, sessions, patientNotes, profile } = params;

  let prompt = `You are an experienced clinical psychologist. You will evaluate your client's weekly therapy process between the dates ${weekRange}.\n\n${sessions.length} sessions took place this week. Below is the summary of each session:`;

  prompt += getLanguageInstruction(params.language);

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    prompt += `\n\n--- Session ${i + 1} (${s.date}) ---`;
    if (s.summary) {
      if (s.summary.themes.length > 0) prompt += `\nThemes: ${s.summary.themes.join(", ")}`;
      if (s.summary.defenses.length > 0) prompt += `\nDefense mechanisms: ${s.summary.defenses.join(", ")}`;
      if (s.summary.insights.length > 0) prompt += `\nInsights: ${s.summary.insights.join(", ")}`;
      if (s.summary.homework.length > 0) prompt += `\nHomework: ${s.summary.homework.join(", ")}`;
    }
    if (s.summaryNarrative) {
      prompt += `\nSession narrative: ${s.summaryNarrative}`;
    }
  }

  if (profile) {
    prompt += `\n\nClient information:`;
    if (profile.name) prompt += `\n- Name: ${profile.name}`;
    if (profile.age) prompt += `\n- Age: ${profile.age}`;
    if (profile.goals.length > 0) prompt += `\n- Goals: ${profile.goals.join(", ")}`;
  }

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Cumulative Patient Notes ---\n${patientNotes}`;
  }

  prompt += `\n\n--- Your Task ---
Create a weekly evaluation report. It should include:

1. **Overall Assessment of the Week**: A general summary of this week's sessions and the client's overall state
2. **Prominent Themes**: Recurring or notable themes throughout the week
3. **Observed Progress**: Positive developments, insights, and noticed changes
4. **Points of Attention**: Resistant areas, risk factors, or topics that need deeper exploration
5. **Recommendations for Next Week**: Concrete suggestions for the client and areas to focus on

Rules:
- Write in Markdown format (you can use headings, bold text, lists)
- Address the client directly (use "you" language)
- Use a warm, supportive, and motivating tone
- Avoid clinical jargon, be understandable
- CRITICAL: Do NOT write clinical content such as topics to be addressed in future sessions, therapist plans, or priority lists. The client should not know in advance what will be discussed in future sessions — this negatively affects the therapeutic process. Only give recommendations the client can apply in their own life.`;

  return prompt;
}

export function buildSummaryPrompt(patientNotes?: string, language?: Language): string {
  let prompt = `Evaluate the session conversation above and write a session summary as if you were speaking one-on-one with the client.

Rules:
- Write as if chatting with the client, do NOT use clinical report format (do not write meta information such as date, client name, titles)
- Use direct "you" language, as if you are speaking face-to-face with the client at the end of the session
- Summarize what was discussed in this session, which topics stood out, and any insights gained
- If applicable, suggest a concrete recommendation or thought exercise
- Use a warm, supportive, and motivating tone
- Avoid clinical jargon, be understandable
- Write in Markdown format`;

  prompt += getLanguageInstruction(language);

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Cumulative Patient Notes (Background Information) ---\nThese are clinical notes compiled from previous sessions. Use them to maintain continuity and consider the client's overall state when writing the summary:\n${patientNotes}`;
  }

  return prompt;
}
