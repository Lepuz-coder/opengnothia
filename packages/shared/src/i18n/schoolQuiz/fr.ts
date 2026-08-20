import type { SchoolQuizTexts } from "./index";

export const frSchoolQuiz: SchoolQuizTexts = {
  title: "L'approche qui te ressemble",
  intro:
    "Quelques questions pour trouver l'approche thérapeutique qui te convient le mieux. Il n'y a pas de bonne ou de mauvaise réponse — choisis ce qui te parle.",
  progress: "Question {current}/{total}",
  resultTitle: "Notre suggestion pour toi",
  resultWhyTitle: "Pourquoi cette approche ?",
  retakeButton: "Refaire le questionnaire",
  takeButton: "Faire le questionnaire",
  noSchoolLabel: "Pas encore choisie",
  questions: {
    hardDay: {
      text: "Après une journée difficile, qu'est-ce qui te vient en premier ?",
      options: {
        analyze: "M'asseoir et décortiquer ce qui s'est passé, étape par étape",
        lookBack: "Me demander ce que ce sentiment me rappelle",
        turnInward: "Faire une pause, respirer, me tourner vers l'intérieur",
        control: "Me demander : « qu'est-ce qui est vraiment entre mes mains, là ? »",
        depends: "Ça dépend — parfois l'un, parfois l'autre",
      },
    },
    rootCause: {
      text: "D'où viennent surtout tes difficultés actuelles, selon toi ?",
      options: {
        thoughts: "De mes habitudes de pensée — du sens que je donne aux événements",
        past: "De mon passé — d'anciennes relations et expériences encore en scène aujourd'hui",
        childhood: "Des schémas « je suis comme ça » appris dans l'enfance",
        howToLive: "Moins de la cause — je cherche surtout à apprendre à vivre avec",
      },
    },
    hardEmotion: {
      text: "Quand une émotion difficile arrive, qu'aimerais-tu en faire ?",
      options: {
        test: "Trouver la pensée qui l'a déclenchée et la mettre à l'épreuve",
        carry: "Apprendre à la porter avec moi plutôt que de la combattre",
        calm: "L'accueillir avec calme — tanguer sans chavirer",
        underneath: "Comprendre ce qui remue en dessous",
        refuge: "Me réfugier dans le souffle, la prière ou le silence",
      },
    },
    missing: {
      text: "Qu'est-ce qui te manque le plus dans ta vie en ce moment ?",
      options: {
        quietMind: "Un esprit calme — une pause dans les pensées qui tournent en boucle",
        meaning: "Le sentiment que ce que je fais a du sens",
        selfPeace: "Faire la paix avec moi-même — que les vieilles blessures baissent le volume",
        balance: "Un équilibre intérieur qui ne vacille pas facilement",
      },
    },
    guide: {
      text: "Quel genre de compagnon voudrais-tu à tes côtés ?",
      options: {
        structured: "Quelqu'un de structuré, avec des outils concrets et de petites expériences",
        digger: "Quelqu'un qui pose des questions profondes et creuse mon histoire avec moi",
        sage: "Quelqu'un de sage et de calme, avec une philosophie de vie posée",
        flexible: "Quelqu'un de flexible, qui utilise ce dont j'ai besoin sur le moment",
        accepting: "Quelqu'un qui m'accepte tel que je suis et m'encourage vers mes valeurs",
      },
    },
    faith: {
      text: "Quelle place la spiritualité ou la foi tient-elle dans ta vie ?",
      options: {
        central: "Une place centrale — c'est une des langues maternelles de mon monde intérieur",
        sometimes: "Une source vers laquelle je reviens de temps en temps ; elle me fait du bien",
        notReally: "Pas vraiment — un langage plus concret, plus terrestre me convient mieux",
        bigQuestions: "Foi ou pas, les grandes questions de la vie occupent beaucoup mon esprit",
      },
    },
    changeStyle: {
      text: "Quand tu veux changer quelque chose, quel chemin te semble le plus naturel ?",
      options: {
        experiment: "Faire de petites expériences et regarder les résultats",
        resistance: "D'abord comprendre ce qui résiste en moi",
        values: "Clarifier ce qui compte pour moi et avancer dans cette direction à petits pas",
        tryPaths: "Essayer plusieurs voies ; lâcher ce qui ne marche pas et passer à la suivante",
      },
    },
    familiar: {
      text: "Quelle phrase te semble la plus familière ?",
      options: {
        worstCase: "« Mon esprit court toujours au pire scénario. »",
        notEnough: "« Quoi que je fasse, une voix en moi dit que je ne suis pas à la hauteur. »",
        emptiness: "« Tout a l'air d'aller, mais il y a un vide en moi. »",
        samePlay: "« Je revis la même histoire avec des personnes différentes. »",
        uncontrollable: "« Ce qui échappe à mon contrôle m'épuise. »",
      },
    },
    bestMoments: {
      text: "Pense aux moments où tu te sens le mieux — qu'y a-t-il généralement ?",
      options: {
        clarity: "J'ai résolu un problème, mon esprit est clair",
        serving: "Je contribue à quelque chose de plus grand que moi",
        presence: "Je suis en contact avec la nature, le silence ou mon monde intérieur",
        livedValues: "J'ai donné du temps à ce qui compte pour moi, quel que soit le résultat",
        composure: "Je suis resté maître de moi, même au milieu de la tempête",
      },
    },
    innerCritic: {
      text: "Comment ta voix critique intérieure (« pas assez », « tu as échoué ») te parle-t-elle ?",
      options: {
        oldVoice: "Durement — et son ton vient d'un endroit ancien qui m'est très familier",
        reason: "Elle se fait entendre, mais s'adoucit quand je lui montre des preuves",
        defuse: "J'arrive à la voir comme « juste une pensée » et à prendre du recul",
        external: "Moins ma voix intérieure que le bruit du monde extérieur qui m'épuise",
      },
    },
  },
  reasons: {
    integrative:
      "Tes réponses ne pointent pas vers une méthode unique, mais vers des besoins qui changent selon la situation. L'approche intégrative réunit les outils de différentes écoles en un seul compagnon cohérent — faite pour celles et ceux qui tiennent à la flexibilité.",
    psychodynamic:
      "Tes réponses montrent une nette tendance à comprendre le présent en regardant le passé et ses schémas répétitifs. C'est exactement ce que fait l'approche psychodynamique : suivre avec toi la trace des anciennes relations et expériences dans ta vie d'aujourd'hui.",
    cbt: "Tes réponses montrent une affinité pour le travail avec les pensées — les comprendre, les tester, les remodeler. La TCC t'apprend à transformer les boucles pensée-émotion avec des outils concrets et de petites expériences.",
    logotherapy:
      "La quête de sens ressort de tes réponses : un sentiment de vide, de grandes questions, l'envie de servir quelque chose. La logothérapie travaille exactement dans cette veine — rendre même la douleur portable par le sens.",
    act: "Tes réponses penchent vers faire de la place aux émotions plutôt que les combattre, et marcher vers tes valeurs. L'ACT développe cette flexibilité de façon systématique : acceptation, défusion et petits pas guidés par les valeurs.",
    schema:
      "Tes réponses portent la trace de schémas « je suis comme ça » venus de l'enfance et d'un critique intérieur familier. La thérapie des schémas reconnaît ces vieux schémas et les transforme à la racine.",
    stoic:
      "Séparer ce qui dépend de toi de ce qui n'en dépend pas, et chercher un équilibre intérieur inébranlable, ressortent de tes réponses. L'accompagnement stoïcien entraîne exactement ce muscle : la distinction du contrôle, la pratique de la vertu et le calme.",
    spiritual:
      "Le retour vers l'intérieur, le silence et la spiritualité tiennent une place claire dans tes réponses. La guidance spirituelle met cette source au centre — tu avances avec des pratiques de présence et de paix intérieure issues de ta propre tradition.",
  },
};
