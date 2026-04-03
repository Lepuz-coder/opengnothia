export interface CourseStep {
  topicTitle: string;
}

export interface CourseDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  detailDescriptionKey?: string;
  highlightsKey?: string;
  stepsKey?: string;
  rolePrompt?: string;
  icon: string;
  steps: CourseStep[];
}

export const SPIRITUAL_JOURNEY: CourseDefinition = {
  id: "spiritual_journey",
  nameKey: "spiritualJourney",
  descriptionKey: "spiritualJourneyDesc",
  detailDescriptionKey: "spiritualJourneyLongDesc",
  highlightsKey: "spiritualJourneyHighlights",
  stepsKey: "spiritualJourneySteps",
  rolePrompt: "a wise, warm spiritual teacher and guide",
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

export const QUIT_SMOKING: CourseDefinition = {
  id: "quit_smoking",
  nameKey: "quitSmoking",
  descriptionKey: "quitSmokingDesc",
  detailDescriptionKey: "quitSmokingLongDesc",
  highlightsKey: "quitSmokingHighlights",
  stepsKey: "quitSmokingSteps",
  rolePrompt: "a supportive, knowledgeable quit-smoking coach following the OpenGnothia method. IMPORTANT: Never mention or reference Allen Carr, Easyway, or any external author or brand. Present all teachings as part of the OpenGnothia program",
  icon: "🚭",
  steps: [
    // Block 1: Understanding the Trap (1-5)
    { topicTitle: "Why Do You Smoke? — Examining the Real Reasons Behind Every Cigarette" },
    { topicTitle: "The Nicotine Trap — How a Tiny Chemical Creates the Illusion of Pleasure" },
    { topicTitle: "Society and Smoking — How Advertising and Culture Built the Smoker's Identity" },
    { topicTitle: "What Smoking Actually Does — Separating Fact from the Smoker's Mythology" },
    { topicTitle: "The Addictive Personality Myth — Why Willpower Is Not the Problem" },

    // Block 2: Dismantling the Brainwashing (6-10)
    { topicTitle: "The Big Monster and the Little Monster — Understanding Physical vs. Psychological Addiction" },
    { topicTitle: "The Illusion of Pleasure — Why Smoking Never Truly Satisfies" },
    { topicTitle: "The Illusion of the Crutch — Why Smoking Increases Stress Instead of Relieving It" },
    { topicTitle: "The Fear of Giving Up — Recognizing That There Is Nothing to Give Up" },
    { topicTitle: "The Willpower Method — Why Fighting Desire Makes Quitting Harder" },

    // Block 3: Removing the Fears (11-15)
    { topicTitle: "Fear of Withdrawal — What Withdrawal Actually Feels Like" },
    { topicTitle: "Fear of Weight Gain — Separating the Myths from Reality" },
    { topicTitle: "Fear of Losing Concentration — How Nicotine Actually Impairs Focus" },
    { topicTitle: "Fear of Social Situations — Rediscovering Social Confidence Without Smoke" },
    { topicTitle: "The 'Just One Cigarette' Trap — Why One Is Never Just One" },

    // Block 4: Preparing for Freedom (16-19)
    { topicTitle: "The Moment of Revelation — Seeing Smoking as It Really Is" },
    { topicTitle: "The Final Instructions — Preparing Your Mind for the Last Cigarette" },
    { topicTitle: "The Ritual of the Last Cigarette — A Conscious Farewell, Not a Sacrifice" },
    { topicTitle: "The Immediate Benefits — What Happens to Your Body from the First Hour" },

    // Block 5: Living Free (20-22)
    { topicTitle: "The First Days of Freedom — Navigating the Adjustment Period with Joy" },
    { topicTitle: "Social Triggers and Old Habits — Building a Smoke-Free Life" },
    { topicTitle: "You Are a Non-Smoker — Embracing Your New Identity Permanently" },
  ],
};

export const MAKING_PEACE_WITH_ANXIETY: CourseDefinition = {
  id: "making_peace_with_anxiety",
  nameKey: "makingPeaceWithAnxiety",
  descriptionKey: "makingPeaceWithAnxietyDesc",
  detailDescriptionKey: "makingPeaceWithAnxietyLongDesc",
  highlightsKey: "makingPeaceWithAnxietyHighlights",
  stepsKey: "makingPeaceWithAnxietySteps",
  rolePrompt: "a calm, empathetic anxiety management coach who combines cognitive-behavioral science with practical relaxation techniques. You normalize the student's experience, avoid clinical jargon unless explaining it, and always provide actionable exercises. You validate emotions before offering tools",
  icon: "🧘",
  steps: [
    // Block 1: Understanding Anxiety (1-4)
    { topicTitle: "What Is Anxiety? — Understanding the Difference Between Fear and Anxiety" },
    { topicTitle: "The Evolutionary Purpose of Anxiety — Why Your Brain Is Wired to Worry" },
    { topicTitle: "Normal vs. Problematic Anxiety — When a Natural Response Becomes a Burden" },
    { topicTitle: "Your Anxiety Profile — Mapping Your Personal Triggers and Patterns" },

    // Block 2: The Body Under Anxiety (5-8)
    { topicTitle: "The Fight-or-Flight Response — What Happens Inside Your Body When Anxiety Strikes" },
    { topicTitle: "Physical Symptoms of Anxiety — Heart Racing, Tension, Dizziness, and More" },
    { topicTitle: "The Anxiety-Body Loop — How Physical Sensations Feed Anxious Thoughts" },
    { topicTitle: "Body Awareness Practice — Learning to Listen Without Reacting" },

    // Block 3: Anxious Thought Patterns (9-12)
    { topicTitle: "The Thought-Emotion Connection — How a Single Thought Can Change How You Feel" },
    { topicTitle: "Catastrophizing — When Your Mind Jumps to the Worst-Case Scenario" },
    { topicTitle: "Common Cognitive Distortions — All-or-Nothing Thinking, Mind Reading, and Other Traps" },
    { topicTitle: "The Worry Spiral — Understanding How Anxiety Feeds on Itself" },

    // Block 4: Cognitive Restructuring (13-16)
    { topicTitle: "Catching Your Thoughts — The First Step to Changing Them" },
    { topicTitle: "Challenging Anxious Thoughts — Asking the Right Questions" },
    { topicTitle: "Evidence-Based Thinking — Building a Realistic Perspective" },
    { topicTitle: "Reframing — Turning Threats into Challenges" },

    // Block 5: Breathing and Relaxation (17-20)
    { topicTitle: "Diaphragmatic Breathing — The Foundation of Physical Calm" },
    { topicTitle: "The 4-7-8 Technique — A Portable Tool for Acute Anxiety" },
    { topicTitle: "Progressive Muscle Relaxation — Releasing Tension You Didn't Know You Held" },
    { topicTitle: "Grounding Techniques — Anchoring Yourself in the Present Moment" },

    // Block 6: Behavioral Strategies (21-23)
    { topicTitle: "The Avoidance Trap — Why Running Away Makes Anxiety Stronger" },
    { topicTitle: "Gradual Exposure — Building Tolerance Step by Step" },
    { topicTitle: "Behavioral Experiments — Testing Your Fears Against Reality" },

    // Block 7: Integration (24)
    { topicTitle: "Your Anxiety Toolkit — Building a Sustainable Practice for Everyday Life" },
  ],
};

export const ANGER_MANAGEMENT: CourseDefinition = {
  id: "anger_management",
  nameKey: "angerManagement",
  descriptionKey: "angerManagementDesc",
  detailDescriptionKey: "angerManagementLongDesc",
  highlightsKey: "angerManagementHighlights",
  stepsKey: "angerManagementSteps",
  rolePrompt: "a patient, grounded anger management coach who blends cognitive-behavioral techniques with somatic awareness and assertive communication training. You treat anger as a natural, informative emotion rather than something to suppress. You validate the student's experience, distinguish between the emotion itself and harmful behaviors, and always offer concrete, rehearsable skills. You use plain language, explain any technical term the first time it appears, and encourage self-compassion alongside accountability",
  icon: "🔥",
  steps: [
    // Block 1: Understanding Anger (1-4)
    { topicTitle: "What Is Anger? — Understanding a Natural Emotion That Gets a Bad Name" },
    { topicTitle: "The Evolutionary Purpose of Anger — Why Your Brain Learned to Fight" },
    { topicTitle: "Healthy vs. Destructive Anger — When a Protective Response Becomes Harmful" },
    { topicTitle: "Your Anger Profile — Mapping Your Personal Triggers and Patterns" },

    // Block 2: The Body Under Anger (5-8)
    { topicTitle: "The Fight Response — What Happens Inside Your Body When Anger Ignites" },
    { topicTitle: "Physical Warning Signs — Racing Heart, Clenched Jaw, Heat, and More" },
    { topicTitle: "The Anger-Body Loop — How Physical Arousal Fuels Aggressive Impulses" },
    { topicTitle: "Body Awareness Practice — Learning to Catch Anger Before It Catches You" },

    // Block 3: Angry Thought Patterns (9-12)
    { topicTitle: "The Thought-Anger Connection — How a Single Interpretation Can Ignite Rage" },
    { topicTitle: "Hot Thoughts — When Your Mind Demands That Things Should Be Different" },
    { topicTitle: "Common Cognitive Distortions — Blame, Personalizing, and All-or-Nothing Thinking" },
    { topicTitle: "The Anger Spiral — Understanding How Rumination Keeps the Fire Burning" },

    // Block 4: Cognitive Restructuring (13-16)
    { topicTitle: "Catching Your Hot Thoughts — The First Step to Responding Instead of Reacting" },
    { topicTitle: "Challenging Angry Interpretations — Asking the Questions That Cool You Down" },
    { topicTitle: "Perspective-Taking — Seeing the Situation Through Other Eyes" },
    { topicTitle: "Reframing — Turning Offenses into Opportunities for Growth" },

    // Block 5: Cooling Down and Regulation (17-20)
    { topicTitle: "The Strategic Timeout — Creating Space Between Trigger and Response" },
    { topicTitle: "Breathing for Anger — Slow Exhales and the Physiology of Calming Down" },
    { topicTitle: "Progressive Muscle Relaxation — Releasing the Tension Anger Leaves Behind" },
    { topicTitle: "Grounding and Redirection — Anchoring Yourself When Emotions Run High" },

    // Block 6: Healthy Expression and Communication (21-23)
    { topicTitle: "I-Statements — Expressing What You Feel Without Attacking" },
    { topicTitle: "Assertiveness vs. Aggression — Standing Your Ground Without Crossing the Line" },
    { topicTitle: "Nonviolent Communication — Needs, Feelings, and Requests That Actually Work" },

    // Block 7: Integration (24)
    { topicTitle: "Your Anger Toolkit — Building a Sustainable Practice for Everyday Life" },
  ],
};

export const COURSES: CourseDefinition[] = [SPIRITUAL_JOURNEY, QUIT_SMOKING, MAKING_PEACE_WITH_ANXIETY, ANGER_MANAGEMENT];

export function getCourseById(courseId: string): CourseDefinition | undefined {
  return COURSES.find((c) => c.id === courseId);
}
