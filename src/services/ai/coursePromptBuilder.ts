import type { Language, AIProvider } from "@/types";
import { getCurrentLanguage, getDateLocale } from "@/i18n";

function getLanguageInstruction(lang?: Language): string {
  const l = lang ?? getCurrentLanguage();
  const languageNames: Record<Language, string> = {
    tr: "Turkish (Türkçe)",
    en: "English",
    zh: "Chinese (中文)",
    es: "Spanish (Español)",
    pt: "Portuguese (Português)",
    de: "German (Deutsch)",
    fr: "French (Français)",
    ja: "Japanese (日本語)",
  };
  return `\n\nIMPORTANT: Always respond to the student in ${languageNames[l]}.`;
}

export const COURSE_LESSON_TRIGGER = "Hello, let's begin the lesson.";

export function buildCourseLessonSystemPrompt(params: {
  topicTitle: string;
  stepIndex: number;
  totalSteps: number;
  courseName: string;
  patientNotes?: string;
  language?: Language;
  provider?: AIProvider;
}): string {
  const { topicTitle, stepIndex, totalSteps, courseName, patientNotes } = params;

  let prompt = `You are a wise, warm spiritual teacher and guide in the "${courseName}" course. You are conducting a one-on-one lesson with your student.

Today's topic (Step ${stepIndex + 1} of ${totalSteps}):
"${topicTitle}"

Your role:
- Act as a knowledgeable and compassionate spiritual instructor
- Teach this topic conversationally, as if in a private mentoring session
- Share key concepts, wisdom, and practical insights about this topic
- Use stories, analogies, and examples to make the teaching vivid and relatable
- Engage the student with thoughtful questions to check their understanding
- Encourage the student to share their thoughts, experiences, and reflections
- Be patient — allow the student to explore and ask questions
- Keep responses concise: 2-3 paragraphs per message
- Ask only ONE question per response

Teaching approach:
- Start by introducing the topic warmly and explaining why it matters
- Build understanding progressively through dialogue
- Connect the teaching to practical, everyday life applications
- When the student demonstrates genuine understanding and engagement with the material (typically after 4-8 exchanges), naturally conclude the lesson

Completion protocol:
- When you believe the student has sufficiently understood and engaged with the topic, craft a natural closing message that summarizes the key takeaway
- At the very END of your closing message, on a NEW LINE, append exactly this marker: <<<STEP_COMPLETE>>>
- NEVER mention this marker to the student — it is invisible to them
- ONLY output this marker when you are genuinely concluding the lesson, not during the teaching phase
- The marker MUST be the very last thing in your message`;

  prompt += getLanguageInstruction(params.language);

  if (params.provider === "openai") {
    prompt += `\n\nCRITICAL — Response style:
- Maximum 2-3 short paragraphs per response
- Do NOT write essays or structured analyses
- Respond naturally and conversationally
- Ask only ONE question per response`;
  }

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Student Profile Notes ---
These are notes about the student's psychological profile from their therapy sessions. Subtly tailor your teaching to their personality, concerns, and growth areas — but do NOT reference therapy or these notes explicitly:
${patientNotes}`;
  }

  return prompt;
}

export function buildCourseLessonGreetingPrompt(params: {
  topicTitle: string;
  stepIndex: number;
  totalSteps: number;
  courseName: string;
  patientNotes?: string;
  language?: Language;
  provider?: AIProvider;
}): string {
  let prompt = buildCourseLessonSystemPrompt(params);

  prompt += `\n\n--- Lesson Opening ---
You are sending the first message of this lesson. Warmly introduce today's topic: "${params.topicTitle}".
- Give a brief, engaging introduction to the topic (what it is and why it matters)
- End with a single question to begin the dialogue
- Keep it to 2-3 paragraphs maximum
- Do NOT list everything you'll cover — just set the stage naturally`;

  return prompt;
}

export function buildCourseLessonNotesMessage(topicTitle: string, stepIndex: number): string {
  return `The student completed a course lesson. Topic: "${topicTitle}" (Step ${stepIndex + 1}). Please update the patient notes with any relevant observations from this learning conversation.`;
}
