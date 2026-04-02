export interface CourseStep {
  topicTitle: string;
}

export interface CourseDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  steps: CourseStep[];
}

export const SPIRITUAL_JOURNEY: CourseDefinition = {
  id: "spiritual_journey",
  nameKey: "spiritualJourney",
  descriptionKey: "spiritualJourneyDesc",
  icon: "🕊️",
  steps: [
    // Block 1: Foundations of Awareness (1-8)
    { topicTitle: "What Is Consciousness? — Introduction to Awareness Beyond Thought" },
    { topicTitle: "The Observer Within — Learning to Watch Your Own Mind" },
    { topicTitle: "The Nature of Thought — Understanding That You Are Not Your Thoughts" },
    { topicTitle: "The Present Moment — Eckhart Tolle's Gateway to Presence" },
    { topicTitle: "The Pain Body — Understanding Accumulated Emotional Pain" },
    { topicTitle: "The Ego and Its Masks — How the Ego Constructs Identity" },
    { topicTitle: "Resistance and Suffering — What You Resist Persists" },
    { topicTitle: "Acceptance as Freedom — The Power of Saying Yes to What Is" },

    // Block 2: A Course in Miracles — Core Concepts (9-18)
    { topicTitle: "Perception vs. Knowledge — The ACIM Distinction Between Seeing and Knowing" },
    { topicTitle: "The Concept of Forgiveness — ACIM's Radical Redefinition of Forgiveness" },
    { topicTitle: "The Holy Instant — Stepping Out of Time into Eternity" },
    { topicTitle: "The Ego Thought System — How the Ego Maintains Separation" },
    { topicTitle: "The Miracle — A Shift in Perception from Fear to Love" },
    { topicTitle: "Special vs. Holy Relationships — Transforming How We Relate to Others" },
    { topicTitle: "The Atonement — Undoing the Belief in Separation" },
    { topicTitle: "Guiltlessness — Releasing the Burden of Guilt" },
    { topicTitle: "The Body as a Communication Device — Beyond Physical Identification" },
    { topicTitle: "There Is No Order of Difficulty in Miracles" },

    // Block 3: The Power of Now (19-26)
    { topicTitle: "Clock Time vs. Psychological Time — Using Time Without Being Trapped by It" },
    { topicTitle: "The Inner Body — Anchoring Awareness in the Felt Sense of Aliveness" },
    { topicTitle: "Portals to the Unmanifested — Silence, Space, and the Formless" },
    { topicTitle: "The Art of Surrender — Beyond Passive Resignation to Active Acceptance" },
    { topicTitle: "Relationships as Spiritual Practice — Using Conflict for Awakening" },
    { topicTitle: "Beyond Happiness and Unhappiness — The Peace That Passeth Understanding" },
    { topicTitle: "The Cycles of Life — Death, Impermanence, and Renewal" },
    { topicTitle: "Finding Your Life's Inner Purpose — Being vs. Doing" },

    // Block 4: Buddhist Wisdom (27-36)
    { topicTitle: "The Four Noble Truths — The Foundation of the Buddha's Teaching" },
    { topicTitle: "The Eightfold Path — A Practical Guide to Liberation" },
    { topicTitle: "Impermanence (Anicca) — Nothing Lasts, and That Is Okay" },
    { topicTitle: "Non-Self (Anatta) — The Illusion of a Fixed Self" },
    { topicTitle: "Suffering (Dukkha) — Understanding Dissatisfaction at Its Root" },
    { topicTitle: "Dependent Origination — How Everything Arises in Relationship" },
    { topicTitle: "The Middle Way — Avoiding Extremes" },
    { topicTitle: "Metta: Loving-Kindness — Cultivating Unconditional Friendliness" },
    { topicTitle: "Karuna: Compassion — The Heart That Trembles Before Suffering" },
    { topicTitle: "Equanimity (Upekkha) — The Balanced Heart" },

    // Block 5: Meditation & Contemplative Practice (37-44)
    { topicTitle: "Breath Meditation — The Simplest and Most Profound Practice" },
    { topicTitle: "Body Scan and Somatic Awareness — Listening to the Wisdom of the Body" },
    { topicTitle: "Walking Meditation — Bringing Presence to Movement" },
    { topicTitle: "Mantra and Sacred Sound — Using Repetition as a Portal to Stillness" },
    { topicTitle: "Open Awareness Meditation — Resting as Awareness Itself" },
    { topicTitle: "Self-Inquiry: 'Who Am I?' — Ramana Maharshi's Direct Path" },
    { topicTitle: "Contemplative Prayer — Where Spirituality Meets Silence" },
    { topicTitle: "Integrating Practice into Daily Life — Every Moment as Meditation" },

    // Block 6: Forgiveness, Compassion & Heart Opening (45-50)
    { topicTitle: "Self-Forgiveness — The Hardest and Most Necessary Act" },
    { topicTitle: "Forgiving Others — Releasing the Chains That Bind You" },
    { topicTitle: "Tonglen: Taking and Giving — The Tibetan Practice of Compassionate Exchange" },
    { topicTitle: "Radical Compassion — Tara Brach's RAIN Method" },
    { topicTitle: "Opening the Heart — Vulnerability as Strength" },
    { topicTitle: "Gratitude as a Spiritual Practice — Seeing Through the Eyes of Appreciation" },

    // Block 7: Non-Dual Awareness & Integration (51-56)
    { topicTitle: "What Is Non-Duality? — Beyond Subject and Object" },
    { topicTitle: "The Witness and the Witnessed Are One — Collapsing the Observer-Observed Split" },
    { topicTitle: "Emptiness and Form — The Heart Sutra's Insight" },
    { topicTitle: "The Pathless Path — When Seeking Ends, Finding Begins" },
    { topicTitle: "Spiritual Bypassing — The Shadow Side of Spiritual Practice" },
    { topicTitle: "Dark Night of the Soul — When the Path Gets Hard" },

    // Block 8: Living Awakening (57-60)
    { topicTitle: "Awakened Relationships — Bringing Consciousness to Every Encounter" },
    { topicTitle: "Service and Engaged Spirituality — Compassion in Action" },
    { topicTitle: "Your Ongoing Practice — Building a Sustainable Spiritual Life" },
    { topicTitle: "The Journey Continues — Integration, Review, and Next Steps" },
  ],
};

export const COURSES: CourseDefinition[] = [SPIRITUAL_JOURNEY];

export function getCourseById(courseId: string): CourseDefinition | undefined {
  return COURSES.find((c) => c.id === courseId);
}
