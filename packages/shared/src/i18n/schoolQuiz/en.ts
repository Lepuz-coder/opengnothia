import type { SchoolQuizTexts } from "./index";

export const enSchoolQuiz: SchoolQuizTexts = {
  title: "Your Kind of Approach",
  intro:
    "A few questions to find the therapy approach that fits you best. There are no right or wrong answers — pick what rings true.",
  progress: "Question {current}/{total}",
  resultTitle: "Our suggestion for you",
  resultWhyTitle: "Why this approach?",
  retakeButton: "Retake the quiz",
  takeButton: "Take the quiz",
  noSchoolLabel: "Not chosen yet",
  questions: {
    hardDay: {
      text: "After a hard day, what comes to you first?",
      options: {
        analyze: "Sitting down and working out what happened, step by step",
        lookBack: "Wondering what this feeling reminds me of",
        turnInward: "Pausing to breathe and turn inward",
        control: "Asking “what is actually in my hands right now?”",
        depends: "It depends — sometimes one, sometimes another",
      },
    },
    rootCause: {
      text: "Where do you think today's struggles mostly come from?",
      options: {
        thoughts: "My thinking habits — the meanings I attach to events",
        past: "My past — old relationships and experiences still on stage today",
        childhood: "The “this is who I am” patterns I learned as a child",
        howToLive: "Less about digging for causes, more about learning to live with them",
      },
    },
    hardEmotion: {
      text: "When a difficult emotion shows up, what would you like to do with it?",
      options: {
        test: "Find the thought that triggered it and put it to the test",
        carry: "Learn to carry it with me instead of fighting it",
        calm: "Meet it with composure — sway without capsizing",
        underneath: "Understand what is stirring underneath",
        refuge: "Take refuge in breath, prayer or silence",
      },
    },
    missing: {
      text: "What do you miss most in your life these days?",
      options: {
        quietMind: "A quiet mind — a break from looping thoughts",
        meaning: "The sense that what I do carries meaning",
        selfPeace: "Making peace with myself — old wounds turning their volume down",
        balance: "An inner balance that doesn't shake easily",
      },
    },
    guide: {
      text: "What kind of companion would you want by your side?",
      options: {
        structured: "Someone structured, offering concrete tools and small experiments",
        digger: "Someone who asks deep questions and digs into my story with me",
        sage: "Someone wise and calm, with a settled philosophy of life",
        flexible: "Someone flexible who uses whatever I need in the moment",
        accepting: "Someone who accepts me as I am and encourages me toward my values",
      },
    },
    faith: {
      text: "What place does spirituality or faith hold in your life?",
      options: {
        central: "A central one — it is one of my inner world's native languages",
        sometimes: "A source I return to now and then; it does me good",
        notReally: "Not much — a more concrete, worldly language suits me better",
        bigQuestions: "Faith aside, life's big questions occupy my mind a lot",
      },
    },
    changeStyle: {
      text: "When you want to change something, which path feels most natural?",
      options: {
        experiment: "Running small experiments and looking at the results",
        resistance: "First understanding what inside me is resisting",
        values: "Clarifying what matters to me and walking that way in small steps",
        tryPaths: "Trying different roads; dropping what doesn't work, moving to the next",
      },
    },
    familiar: {
      text: "Which sentence sounds most familiar?",
      options: {
        worstCase: "“My mind always races to the worst-case scenario.”",
        notEnough: "“Whatever I do, a voice inside says I'm not enough.”",
        emptiness: "“Everything looks fine, but there's an emptiness inside.”",
        samePlay: "“I keep living the same story with different people.”",
        uncontrollable: "“Things beyond my control wear me out.”",
      },
    },
    bestMoments: {
      text: "Think of the moments you feel at your best — what is usually there?",
      options: {
        clarity: "I've solved a problem and my head is clear",
        serving: "I'm contributing to something bigger than myself",
        presence: "I'm in touch with nature, silence or my inner world",
        livedValues: "I've given time to what matters to me, whatever the outcome",
        composure: "I've kept my footing even in the middle of a storm",
      },
    },
    innerCritic: {
      text: "How does your inner critic (“not enough”, “you failed”) speak to you?",
      options: {
        oldVoice: "Harshly — and its tone comes from somewhere old and familiar",
        reason: "It speaks up, but softens when I show it evidence",
        defuse: "I can see it as “just a thought” and step back from it",
        external: "It's less my inner voice, more the noise of the outside world that wears me out",
      },
    },
  },
  reasons: {
    integrative:
      "Your answers point not to a single method but to needs that shift with the situation. The integrative approach blends the tools of different schools into one consistent companion — made for people who value flexibility.",
    psychodynamic:
      "Your answers show a clear pull toward understanding today by looking at the past and its repeating patterns. That is exactly what the psychodynamic approach does: tracing how old relationships and experiences still play out now.",
    cbt: "Your answers show an affinity for working with thoughts — examining, testing, reshaping them. CBT teaches you to shift thought–feeling loops with concrete tools and small experiments.",
    logotherapy:
      "The search for meaning stands out in your answers: a sense of emptiness, big questions, the wish to serve something. Logotherapy works exactly in that vein — it aims to make even pain bearable through meaning.",
    act: "Your answers lean toward making room for emotions rather than fighting them, and walking toward your values. ACT builds that flexibility systematically: acceptance, defusion, and small value-driven steps.",
    schema:
      "Your answers carry traces of childhood “this is who I am” patterns and a familiar inner critic. Schema therapy focuses on recognizing these old patterns and transforming them at their roots.",
    stoic:
      "Separating what is in your hands from what is not, and seeking an unshakable inner balance, stand out in your answers. Stoic counselling trains exactly that muscle: the dichotomy of control, the practice of virtue, and calm.",
    spiritual:
      "Turning inward, silence and spirituality hold a clear place in your answers. Spiritual guidance puts that source at the center — you move forward with presence and inner-peace practices from within your own tradition.",
  },
};
