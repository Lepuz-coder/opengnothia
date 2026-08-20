import type { TherapySchool } from "../types";

/**
 * M2: the onboarding school quiz — rule-based, zero AI cost. The questions and
 * scores here are the single language-independent source; every user-visible
 * string lives in i18n/schoolQuiz/ keyed by the question/option ids below.
 *
 * Scoring: each picked option adds its points to one or more schools
 * (2 = primary signal, 1 = secondary). Deterministic by construction — the
 * same answers always produce the same school (verified in Faz 7).
 */

/** The eight built-in schools, in therapySchools order — also the final tie-break order. */
export const SCHOOL_QUIZ_SCHOOLS = [
  "integrative",
  "psychodynamic",
  "cbt",
  "logotherapy",
  "act",
  "schema",
  "stoic",
  "spiritual",
] as const;

export type SchoolQuizSchool = (typeof SCHOOL_QUIZ_SCHOOLS)[number];

export interface SchoolQuizOption {
  id: string;
  scores: Partial<Record<SchoolQuizSchool, number>>;
}

export interface SchoolQuizQuestion {
  id: string;
  options: SchoolQuizOption[];
}

export const SCHOOL_QUIZ_QUESTIONS: SchoolQuizQuestion[] = [
  {
    // "Zor bir gün geçirdiğinde içinden ilk ne gelir?"
    id: "hardDay",
    options: [
      { id: "analyze", scores: { cbt: 2 } },
      { id: "lookBack", scores: { psychodynamic: 2 } },
      { id: "turnInward", scores: { spiritual: 2, act: 1 } },
      { id: "control", scores: { stoic: 2 } },
      { id: "depends", scores: { integrative: 2 } },
    ],
  },
  {
    // "Bugünkü zorluklarının kaynağı sence daha çok nerede?"
    id: "rootCause",
    options: [
      { id: "thoughts", scores: { cbt: 2 } },
      { id: "past", scores: { psychodynamic: 2 } },
      { id: "childhood", scores: { schema: 2 } },
      { id: "howToLive", scores: { act: 2, stoic: 1 } },
    ],
  },
  {
    // "Zorlayıcı bir duygu geldiğinde onunla ne yapmak istersin?"
    id: "hardEmotion",
    options: [
      { id: "test", scores: { cbt: 2 } },
      { id: "carry", scores: { act: 2 } },
      { id: "calm", scores: { stoic: 2 } },
      { id: "underneath", scores: { psychodynamic: 2, schema: 1 } },
      { id: "refuge", scores: { spiritual: 2 } },
    ],
  },
  {
    // "Şu sıralar hayatında en çok neyin eksikliğini hissediyorsun?"
    id: "missing",
    options: [
      { id: "quietMind", scores: { act: 2, cbt: 1 } },
      { id: "meaning", scores: { logotherapy: 2 } },
      { id: "selfPeace", scores: { schema: 2, psychodynamic: 1 } },
      { id: "balance", scores: { stoic: 2, spiritual: 1 } },
    ],
  },
  {
    // "Sana eşlik edecek rehber nasıl biri olsun isterdin?"
    id: "guide",
    options: [
      { id: "structured", scores: { cbt: 2 } },
      { id: "digger", scores: { psychodynamic: 2 } },
      { id: "sage", scores: { stoic: 2, logotherapy: 1 } },
      { id: "flexible", scores: { integrative: 2 } },
      { id: "accepting", scores: { act: 2 } },
    ],
  },
  {
    // "Maneviyat ya da inanç hayatında nasıl bir yer tutuyor?"
    id: "faith",
    options: [
      { id: "central", scores: { spiritual: 2 } },
      { id: "sometimes", scores: { spiritual: 1, logotherapy: 1 } },
      { id: "notReally", scores: { cbt: 1, stoic: 1 } },
      { id: "bigQuestions", scores: { logotherapy: 2 } },
    ],
  },
  {
    // "Bir şeyi değiştirmek istediğinde sana en doğal gelen yol hangisi?"
    id: "changeStyle",
    options: [
      { id: "experiment", scores: { cbt: 2 } },
      { id: "resistance", scores: { psychodynamic: 2, schema: 1 } },
      { id: "values", scores: { act: 2, logotherapy: 1 } },
      { id: "tryPaths", scores: { integrative: 2 } },
    ],
  },
  {
    // "Hangi cümle sana en tanıdık geliyor?"
    id: "familiar",
    options: [
      { id: "worstCase", scores: { cbt: 2 } },
      { id: "notEnough", scores: { schema: 2 } },
      { id: "emptiness", scores: { logotherapy: 2 } },
      { id: "samePlay", scores: { psychodynamic: 2 } },
      { id: "uncontrollable", scores: { stoic: 2, act: 1 } },
    ],
  },
  {
    // "Kendini en iyi hissettiğin anlarda genellikle ne var?"
    id: "bestMoments",
    options: [
      { id: "clarity", scores: { cbt: 2 } },
      { id: "serving", scores: { logotherapy: 2, spiritual: 1 } },
      { id: "presence", scores: { spiritual: 2 } },
      { id: "livedValues", scores: { act: 2 } },
      { id: "composure", scores: { stoic: 2 } },
    ],
  },
  {
    // "İçindeki eleştirel ses seninle nasıl konuşur?"
    id: "innerCritic",
    options: [
      { id: "oldVoice", scores: { schema: 2, psychodynamic: 1 } },
      { id: "reason", scores: { cbt: 2 } },
      { id: "defuse", scores: { act: 2 } },
      { id: "external", scores: { stoic: 2 } },
    ],
  },
];

/** questionId → picked optionId. Partial answer sets score what they have. */
export type SchoolQuizAnswers = Record<string, string>;

export interface SchoolQuizResult {
  school: SchoolQuizSchool;
  totals: Record<SchoolQuizSchool, number>;
}

/**
 * Deterministic winner selection (Step 61 requirement):
 *   1. highest total score;
 *   2. among tied schools, the one backed by more primary (2-point) picks —
 *      a school the user chose head-on beats one assembled from side scores;
 *   3. still tied → SCHOOL_QUIZ_SCHOOLS order. Integrative is deliberately
 *      first: a profile so mixed that schools tie IS the eclectic profile.
 */
export function scoreSchoolQuiz(answers: SchoolQuizAnswers): SchoolQuizResult {
  const totals = Object.fromEntries(SCHOOL_QUIZ_SCHOOLS.map((s) => [s, 0])) as Record<
    SchoolQuizSchool,
    number
  >;
  const primaryHits = Object.fromEntries(SCHOOL_QUIZ_SCHOOLS.map((s) => [s, 0])) as Record<
    SchoolQuizSchool,
    number
  >;

  for (const question of SCHOOL_QUIZ_QUESTIONS) {
    const picked = question.options.find((o) => o.id === answers[question.id]);
    if (!picked) continue;
    for (const [school, points] of Object.entries(picked.scores) as [SchoolQuizSchool, number][]) {
      totals[school] += points;
      if (points >= 2) primaryHits[school] += 1;
    }
  }

  let winner: SchoolQuizSchool = SCHOOL_QUIZ_SCHOOLS[0];
  for (const school of SCHOOL_QUIZ_SCHOOLS) {
    if (
      totals[school] > totals[winner] ||
      (totals[school] === totals[winner] && primaryHits[school] > primaryHits[winner])
    ) {
      winner = school;
    }
  }

  return { school: winner, totals };
}

/** Type guard for values read back from storage/params. */
export function isSchoolQuizSchool(value: TherapySchool | null | undefined): value is SchoolQuizSchool {
  return (SCHOOL_QUIZ_SCHOOLS as readonly string[]).includes(value ?? "");
}
