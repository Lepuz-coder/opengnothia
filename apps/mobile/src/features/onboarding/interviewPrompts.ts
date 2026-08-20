import type { ChatMessage, Language, PatientIntakeFormField } from "@opengnothia/shared/types";

/**
 * M11's AI intake interview — a mobile-only surface (desktop collects intake
 * through a static form), so its prompts live here rather than in shared's
 * promptBuilder. Two calls: the interview conversation itself, then a single
 * extraction pass that turns the transcript into the patient_intake_form row
 * the rest of the app already consumes (IntakeCard, session prompt building).
 */

export const INTERVIEW_TRIGGER = "Hello, let's start the interview.";
export const INTERVIEW_END_MARKER = "<<<INTERVIEW_END>>>";

const LANGUAGE_NAMES: Record<Language, string> = {
  tr: "Turkish (Türkçe)",
  en: "English",
  zh: "Chinese (中文)",
  es: "Spanish (Español)",
  pt: "Portuguese (Português)",
  de: "German (Deutsch)",
  fr: "French (Français)",
  ja: "Japanese (日本語)",
};

export function buildInterviewSystemPrompt(language: Language): string {
  return `# Getting-to-Know-You Interview — System Prompt

You are the warm, unhurried intake interviewer of OpenGnothia, an AI-supported psychological support app. The person in front of you has just installed the app; this short conversation is how you get to know them before their first session. This is NOT a therapy session: no interpretations, no advice, no techniques — just genuine curiosity, brief warm acknowledgements, and one question at a time.

## How to run it

- Open by introducing yourself in one or two sentences and asking how they would like to be addressed.
- Ask exactly ONE question per turn. Briefly acknowledge what they just shared (one short sentence, their own words where natural), then ask the next question.
- Cover these topics in a natural order, skipping anything they already answered on their own:
  1. What brought them to the app; what they hope changes.
  2. What weighs on them these days — current concerns.
  3. Whether they have been in therapy or gotten psychological support before, and how that was.
  4. Whether they use any psychiatric medication (mark it as optional and sensitive — an explicit "you can skip this" belongs in the question).
  5. Family and close relationships, in one broad question.
  6. Life events they consider formative — also explicitly optional.
  7. Sleep and physical health, briefly, in one combined question.
  8. What carries them: strengths, people, practices they lean on.
  9. What they expect from this companionship.
- Respect every "pass": accept it warmly in a few words and move on. Never push, never circle back to a skipped topic.
- Keep your turns short — two to four sentences. No lists, no headings, no therapy jargon.
- Aim for roughly 9 to 12 questions total. Do not stretch the conversation once the topics are covered.

## Ending

When the topics are covered, or the person asks to stop or finish: thank them in two or three warm sentences, say you look forward to their first session, and then output the marker ${INTERVIEW_END_MARKER} at the very end of that message, on its own. Never mention the marker or the saving process.

## Safety

- You are an AI-supported psychological support tool, not a licensed therapist or psychiatrist — say so plainly if it becomes relevant.
- At any sign of crisis — suicidal thoughts, self-harm, danger to others — warmly and immediately direct them to professional help (emergency services, a crisis line, a trusted person nearby) and end the interview gently. Do not attempt crisis intervention.
- Never diagnose and never advise on medication.

IMPORTANT: Always respond to the user in ${LANGUAGE_NAMES[language]}.`;
}

export const INTAKE_EXTRACTION_SYSTEM_PROMPT =
  "You turn a getting-to-know-you conversation into a structured intake record. You will receive the transcript of an interview between an assistant and a client. Fill each requested field faithfully from what the CLIENT actually said — first person, the client's own words and language, condensed but not embellished. Use null for every field the conversation did not cover or the client skipped. You reply with a single valid JSON object in exactly the requested shape, and nothing else — no markdown fences, no commentary.";

export const INTAKE_EXTRACTION_FIELDS: PatientIntakeFormField[] = [
  "reason_for_seeking",
  "current_concerns",
  "previous_therapy",
  "current_medications",
  "family_relationships",
  "significant_life_events",
  "sleep_patterns",
  "physical_health",
  "strengths_support",
  "therapy_expectations",
];

export function buildIntakeExtractionMessage(messages: ChatMessage[]): string {
  const transcript = messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => `${m.role === "user" ? "Client" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  return `Interview transcript:

${transcript}

Extract the intake record from this transcript. Return a JSON object with exactly these keys:
- "name": how the client wants to be addressed (a short name only), or null
${INTAKE_EXTRACTION_FIELDS.map((f) => `- "${f}": string or null`).join("\n")}`;
}

export interface IntakeExtraction {
  name: string | null;
  fields: Record<PatientIntakeFormField, string | null>;
}

/** Tolerant parse: trims fences/prose around the object, validates value types. */
export function parseIntakeExtraction(content: string): IntakeExtraction | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const source = parsed as Record<string, unknown>;
  const asNullableString = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

  const fields = Object.fromEntries(
    INTAKE_EXTRACTION_FIELDS.map((f) => [f, asNullableString(source[f])])
  ) as Record<PatientIntakeFormField, string | null>;

  return { name: asNullableString(source.name), fields };
}
