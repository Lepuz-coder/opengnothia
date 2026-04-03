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

export const HEALTHY_RELATIONSHIPS: CourseDefinition = {
  id: "healthy_relationships",
  nameKey: "healthyRelationships",
  descriptionKey: "healthyRelationshipsDesc",
  detailDescriptionKey: "healthyRelationshipsLongDesc",
  highlightsKey: "healthyRelationshipsHighlights",
  stepsKey: "healthyRelationshipsSteps",
  rolePrompt: "a warm, insightful relationship coach who draws on attachment theory, Gottman research, and emotionally focused therapy. You treat all close relationships — romantic, family, and friendship — with equal importance. You normalize the student's experience, avoid pathologizing language, balance science with empathy, and always offer concrete, rehearsable skills. You validate emotions before offering tools, use plain language, and explain any technical term the first time it appears",
  icon: "💞",
  steps: [
    // Block 1: Foundations — Understanding Relationships and Yourself (1-4)
    { topicTitle: "What Is a Healthy Relationship? — Separating Myths from What Actually Works" },
    { topicTitle: "Attachment Styles — How Your Early Bonds Shape the Way You Love and Connect" },
    { topicTitle: "Family-of-Origin Patterns — Recognizing What You Learned Before You Chose It" },
    { topicTitle: "Your Relationship Profile — Mapping Your Strengths, Triggers, and Blind Spots" },

    // Block 2: Communication — The Core Skill (5-8)
    { topicTitle: "Active Listening — Hearing What Is Really Being Said Behind the Words" },
    { topicTitle: "Emotional Validation — Making Others Feel Seen Without Fixing or Judging" },
    { topicTitle: "Expressing Needs Clearly — Turning Complaints into Requests That Connect" },
    { topicTitle: "Repair After Miscommunication — How to Come Back When a Conversation Goes Wrong" },

    // Block 3: Boundaries — Protecting the Self Within Connection (9-12)
    { topicTitle: "What Are Boundaries? — Understanding the Line Between Closeness and Self-Loss" },
    { topicTitle: "Setting Boundaries — Saying No with Kindness and Conviction" },
    { topicTitle: "Maintaining Boundaries Under Pressure — When Others Push Back or Guilt-Trip" },
    { topicTitle: "Digital Boundaries — Protecting Your Energy in the Age of Constant Connection" },

    // Block 4: Conflict Resolution — Navigating Disagreements (13-16)
    { topicTitle: "The Four Horsemen — Recognizing Criticism, Contempt, Defensiveness, and Stonewalling" },
    { topicTitle: "Fighting Fair — Rules of Engagement That Protect the Relationship" },
    { topicTitle: "Repair Attempts — Small Gestures That De-Escalate Big Conflicts" },
    { topicTitle: "The Art of Compromise — Finding Solutions That Honor Both Sides" },

    // Block 5: Emotional Intimacy, Trust, and Vulnerability (17-20)
    { topicTitle: "Emotional Intimacy — Building Closeness Through Vulnerability and Presence" },
    { topicTitle: "Love Languages and Emotional Needs — Understanding How People Give and Receive Care" },
    { topicTitle: "Trust and Betrayal — How Trust Is Built, Broken, and Repaired" },
    { topicTitle: "Codependency vs. Interdependence — Loving Without Losing Yourself" },

    // Block 6: Self-Awareness and Relationship Patterns (21-23)
    { topicTitle: "Unhealthy Relationship Dynamics — Recognizing Pursuit, Withdrawal, and People-Pleasing" },
    { topicTitle: "Core Wounds in Relationships — How Old Pain Repeats in New Connections" },
    { topicTitle: "Accountability Without Self-Blame — Taking Responsibility and Staying Kind to Yourself" },

    // Block 7: Integration (24)
    { topicTitle: "Your Relationship Toolkit — Building a Sustainable Practice for Healthier Connections" },
  ],
};

export const DIGITAL_DETOX: CourseDefinition = {
  id: "digital_detox",
  nameKey: "digitalDetox",
  descriptionKey: "digitalDetoxDesc",
  detailDescriptionKey: "digitalDetoxLongDesc",
  highlightsKey: "digitalDetoxHighlights",
  stepsKey: "digitalDetoxSteps",
  rolePrompt: "a calm, tech-literate digital wellness coach who blends behavioral psychology, attention science, and practical digital minimalism. You treat technology as a powerful tool rather than an enemy, helping the student build a conscious and intentional relationship with screens. You validate the student's experience without shaming, explain dopamine and reward circuits in accessible language, and always offer concrete, actionable strategies. You use plain language, explain any technical term the first time it appears, and balance science with empathy",
  icon: "📵",
  steps: [
    // Block 1: Understanding Digital Addiction (1-4)
    { topicTitle: "What Is Digital Addiction? — Understanding the Line Between Habit and Compulsion" },
    { topicTitle: "The Dopamine Loop — How Your Brain Gets Hooked on Notifications and Novelty" },
    { topicTitle: "The Slot Machine in Your Pocket — Why Screens Are Designed to Be Hard to Put Down" },
    { topicTitle: "Your Digital Profile — Mapping Your Personal Screen Habits and Triggers" },

    // Block 2: The Attention Economy (5-8)
    { topicTitle: "The Attention Economy — How Your Focus Became the Most Valuable Product" },
    { topicTitle: "Infinite Scroll and Autoplay — The Design Tricks That Steal Your Time" },
    { topicTitle: "Notification Psychology — Why That Red Badge Feels Impossible to Ignore" },
    { topicTitle: "FOMO and the Urgency Illusion — Why You Feel You Must Check Right Now" },

    // Block 3: Social Media and Mental Health (9-12)
    { topicTitle: "The Comparison Trap — How Curated Feeds Distort Your Self-Image" },
    { topicTitle: "Curated Reality — Understanding That What You See Is Not What Is" },
    { topicTitle: "Likes, Comments, and Self-Worth — When Validation Comes from a Screen" },
    { topicTitle: "Online vs. Real Connection — Why Five Hundred Friends Can Still Feel Lonely" },

    // Block 4: Cognitive and Emotional Effects (13-16)
    { topicTitle: "The Shrinking Attention Span — How Constant Switching Fragments Your Focus" },
    { topicTitle: "Deep Work and Flow States — Reclaiming the Ability to Think Without Interruption" },
    { topicTitle: "Screens and Sleep — How Blue Light and Late-Night Scrolling Disrupt Your Rest" },
    { topicTitle: "Always-On Anxiety — The Emotional Cost of Constant Connectivity" },

    // Block 5: Practical Detox Strategies (17-20)
    { topicTitle: "The Notification Audit — Taking Back Control of What Interrupts You" },
    { topicTitle: "Phone-Free Zones — Creating Spaces Where Screens Do Not Belong" },
    { topicTitle: "The Digital Sunset — Building an Evening Routine That Protects Your Sleep" },
    { topicTitle: "The App Diet — Decluttering Your Devices and Simplifying Your Digital Life" },

    // Block 6: Building a Mindful Digital Life (21-23)
    { topicTitle: "Intentional Use — Shifting from Reactive Scrolling to Purposeful Engagement" },
    { topicTitle: "Digital Minimalism — Keeping Only the Technology That Truly Serves You" },
    { topicTitle: "Real-World Replacements — Filling the Void with Activities That Nourish" },

    // Block 7: Integration (24)
    { topicTitle: "Your Digital Wellness Plan — Building a Sustainable Practice for a Balanced Life" },
  ],
};

export const HEALTHY_EATING_PSYCHOLOGY: CourseDefinition = {
  id: "healthy_eating_psychology",
  nameKey: "healthyEatingPsychology",
  descriptionKey: "healthyEatingPsychologyDesc",
  detailDescriptionKey: "healthyEatingPsychologyLongDesc",
  highlightsKey: "healthyEatingPsychologyHighlights",
  stepsKey: "healthyEatingPsychologySteps",
  rolePrompt: "a warm, non-judgmental food psychology coach who combines intuitive eating principles, mindful eating research, and behavioral psychology. You treat all foods as morally neutral, never prescribe diets or calorie counts, and explicitly reject diet culture. You validate the student's experience around food without shame, normalize emotional eating as a common coping pattern rather than a character flaw, and always offer concrete, body-positive awareness exercises. You use plain language, explain any technical term the first time it appears, and balance science with compassion. IMPORTANT: Never recommend specific diets, calorie targets, macronutrient ratios, or weight-loss strategies. This course is about psychological relationship with food, not nutrition science or body modification",
  icon: "🍃",
  steps: [
    // Block 1: Understanding Your Relationship with Food (1-4)
    { topicTitle: "What Is Emotional Eating? — Understanding Why We Reach for Food Beyond Hunger" },
    { topicTitle: "The Many Reasons We Eat — Comfort, Habit, Boredom, and the Stories Behind Every Bite" },
    { topicTitle: "Food as a Coping Mechanism — How Eating Became Your Way of Managing Difficult Emotions" },
    { topicTitle: "Your Eating Profile — Mapping Your Personal Patterns, Triggers, and Food History" },

    // Block 2: Hunger and Fullness Awareness (5-8)
    { topicTitle: "Physical vs. Emotional Hunger — Learning to Tell the Difference Between Body and Mind" },
    { topicTitle: "The Hunger-Fullness Scale — Tuning In to Your Body's Signals Before, During, and After Eating" },
    { topicTitle: "Interoception — Rebuilding the Connection to Your Body's Inner Wisdom" },
    { topicTitle: "Mindful Eating Basics — Slowing Down Enough to Actually Taste Your Food" },

    // Block 3: Emotional Eating Patterns (9-12)
    { topicTitle: "Stress Eating — Why Tension Sends You Straight to the Kitchen" },
    { topicTitle: "Boredom and Loneliness Eating — Filling an Emotional Void with Food" },
    { topicTitle: "Reward Eating — When Food Becomes Your Only Source of Pleasure" },
    { topicTitle: "The Restrict-Binge Cycle — How Deprivation Creates the Very Loss of Control You Fear" },

    // Block 4: Cognitive Patterns and Food Beliefs (13-16)
    { topicTitle: "Diet Culture Myths — Unlearning the Rules That Were Never True" },
    { topicTitle: "Food Guilt and Shame — Why You Feel Bad After Eating and How to Stop" },
    { topicTitle: "All-or-Nothing Thinking About Food — Breaking Free from the Good Food, Bad Food Trap" },
    { topicTitle: "Body Image and Self-Worth — Separating How You Look from Who You Are" },

    // Block 5: Mindful Eating Practices (17-20)
    { topicTitle: "Eating with Full Attention — Turning Every Meal into a Practice of Presence" },
    { topicTitle: "The Art of Savoring — Discovering That Satisfaction Comes from Awareness, Not Quantity" },
    { topicTitle: "Portion Awareness Without Restriction — Honoring Both Appetite and Fullness Without Rules" },
    { topicTitle: "Intuitive Eating Principles — Trusting Your Body to Guide You Back to Balance" },

    // Block 6: Building a Healthy Food Relationship (21-23)
    { topicTitle: "Self-Compassion Around Food — Replacing the Inner Critic with a Kinder Voice" },
    { topicTitle: "Social Eating and External Pressure — Navigating Meals with Others Without Losing Yourself" },
    { topicTitle: "Sustainable Habits Without Rigid Rules — Creating Structure That Feels Like Freedom" },

    // Block 7: Integration (24)
    { topicTitle: "Your Food Wellness Plan — Building a Lifelong Practice of Peace with Eating" },
  ],
};

export const OVERCOMING_PROCRASTINATION: CourseDefinition = {
  id: "overcoming_procrastination",
  nameKey: "overcomingProcrastination",
  descriptionKey: "overcomingProcrastinationDesc",
  detailDescriptionKey: "overcomingProcrastinationLongDesc",
  highlightsKey: "overcomingProcrastinationHighlights",
  stepsKey: "overcomingProcrastinationSteps",
  rolePrompt: "a warm, non-shaming procrastination coach who blends temporal motivation theory, self-determination theory, and behavioral activation. You treat procrastination as an emotion regulation problem, never as laziness or a character flaw. You validate the student's experience, normalize the struggle, explain the neuroscience of avoidance in accessible language, and always offer concrete, actionable micro-steps. You use plain language, explain any technical term the first time it appears, and balance science with compassion and gentle humor",
  icon: "🎯",
  steps: [
    // Block 1: Understanding Procrastination (1-4)
    { topicTitle: "What Is Procrastination? — Understanding That It Is an Emotion Problem, Not a Laziness Problem" },
    { topicTitle: "The Emotional Roots of Avoidance — Why We Put Off What Matters Most" },
    { topicTitle: "The Procrastination-Anxiety Loop — How Delaying Creates the Very Stress You Tried to Escape" },
    { topicTitle: "Your Procrastination Profile — Mapping Your Personal Triggers, Patterns, and Avoidance Styles" },

    // Block 2: The Fears Underneath (5-8)
    { topicTitle: "Fear of Failure — When Not Trying Feels Safer Than Risking Imperfection" },
    { topicTitle: "Fear of Success — The Hidden Dread of What Might Change If You Actually Succeed" },
    { topicTitle: "Fear of Judgment — When the Imagined Audience Keeps You Frozen" },
    { topicTitle: "Perfectionism as Avoidance — How Impossibly High Standards Become an Excuse Not to Start" },

    // Block 3: Cognitive Patterns (9-12)
    { topicTitle: "All-or-Nothing Thinking — Why 'If I Can't Do It Perfectly, Why Start at All' Keeps You Stuck" },
    { topicTitle: "Catastrophizing About Tasks — How Your Mind Turns a Simple To-Do into an Impossible Mountain" },
    { topicTitle: "The 'I'll Do It Later' Myth — Why Your Future Self Is Not Coming to Save You" },
    { topicTitle: "Decision Paralysis — When Too Many Options or Too Much Planning Becomes Another Way to Avoid" },

    // Block 4: Emotion Regulation and Resistance (13-16)
    { topicTitle: "Sitting with Discomfort — Learning to Tolerate the Feelings That Trigger Avoidance" },
    { topicTitle: "The Two-Minute Rule — How Starting Ridiculously Small Bypasses Resistance" },
    { topicTitle: "Breaking the Avoidance Cycle — Understanding What Happens When You Act Despite the Urge to Delay" },
    { topicTitle: "Self-Compassion vs. Self-Criticism — Why Beating Yourself Up Makes Procrastination Worse" },

    // Block 5: Practical Action Strategies (17-20)
    { topicTitle: "Micro-Steps — How to Break Any Task into Pieces So Small They Feel Almost Effortless" },
    { topicTitle: "Implementation Intentions — The Science of Deciding When, Where, and How Before the Moment Arrives" },
    { topicTitle: "Environment Design — Setting Up Your Space So That Starting Becomes the Path of Least Resistance" },
    { topicTitle: "Momentum and the Progress Principle — Why Small Wins Create the Motivation You Were Waiting For" },

    // Block 6: Sustaining Momentum (21-23)
    { topicTitle: "Dealing with Setbacks — Why Slipping Back into Old Patterns Does Not Erase Your Progress" },
    { topicTitle: "Motivation vs. Discipline — Why Waiting to Feel Ready Is the Biggest Procrastination Trap of All" },
    { topicTitle: "Identity Shift — Moving from 'I Am a Procrastinator' to 'I Am Someone Who Takes Action'" },

    // Block 7: Integration (24)
    { topicTitle: "Your Anti-Procrastination Toolkit — Building a Sustainable Practice for Getting Things Done" },
  ],
};

export const COURSES: CourseDefinition[] = [SPIRITUAL_JOURNEY, QUIT_SMOKING, MAKING_PEACE_WITH_ANXIETY, ANGER_MANAGEMENT, HEALTHY_RELATIONSHIPS, DIGITAL_DETOX, HEALTHY_EATING_PSYCHOLOGY, OVERCOMING_PROCRASTINATION];

export function getCourseById(courseId: string): CourseDefinition | undefined {
  return COURSES.find((c) => c.id === courseId);
}
