import type { Language } from "@/types";

type StepDescriptionTemplates = {
  withSubtitle: readonly string[];
  withoutSubtitle: readonly string[];
};

const STEP_DESCRIPTION_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu bölüm, {headline} temasını {subtitle} merceğinden açar; konunun yaşantında nasıl belirdiğini ve onu daha bilinçli nasıl çalışabileceğini gösterir.",
      "Buradaki odak {headline}. {subtitle} üzerinden bu başlığın iç dünyandaki kalıplar, duygusal tepkiler ve günlük seçimlerle nasıl ilişkili olduğunu görürsün.",
      "Bu ders, {headline} konusunu {subtitle} çerçevesinde derinleştirir; böylece kavram yalnızca fikir olarak kalmaz, gözlemleyebileceğin canlı bir pratiğe dönüşür.",
      "{headline} burada pratik bir tema olarak ele alınır. {subtitle} üzerinden neyi fark etmen ve bu içgörüyü yaşamına nasıl taşıman gerektiği açıklanır.",
    ],
    withoutSubtitle: [
      "Bu bölüm, {headline} temasını daha yakından inceleyerek bunun iç dünyanda ve günlük yaşamında nasıl karşılık bulduğunu fark etmene yardımcı olur.",
      "Buradaki odak {headline}. Ders, bu başlığı yalnızca anlamanı değil, onu deneyimleyip kendi pratiğine taşımanı amaçlar.",
      "Bu ders, {headline} kavramını daha somut hale getirir; konuyu gözlemleyebileceğin, sorgulayabileceğin ve uygulayabileceğin bir alana çevirir.",
      "{headline} burada yaşanan bir deneyim olarak ele alınır ve bu anlayışın davranışlarına, ilişkilerine ve farkındalığına nasıl yansıdığı gösterilir.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through the lens of {subtitle}, helping you notice how the theme appears in lived experience and how to practice it with more awareness.",
      "Here the focus is {headline}. By looking closely at {subtitle}, you connect the idea to inner patterns, emotional responses, and daily choices.",
      "This section deepens {headline} by examining {subtitle}, so the concept becomes something you can observe, question, and apply in your own practice.",
      "{headline} is approached here as a lived practice. Through {subtitle}, the lesson shows what to notice within yourself and how to embody the insight more consciously.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you notice how the theme appears in lived experience and how to practice it with more awareness.",
      "Here the focus is {headline}. The goal is not only to understand the idea, but also to connect it to inner patterns, emotional responses, and daily choices.",
      "This section deepens {headline} so the concept becomes something you can observe, question, and apply in your own practice.",
      "{headline} is approached here as a lived practice, showing what to notice within yourself and how to embody the insight more consciously.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课从{subtitle}的角度展开{headline}，帮助你看见这一主题如何出现在真实经验中，以及如何更有觉知地练习它。",
      "这里的重点是{headline}。通过细看{subtitle}，你会把这个观念和内在模式、情绪反应以及日常选择联系起来。",
      "这一部分借由{subtitle}深化{headline}，让它不只是一个概念，而是你可以观察、提问并落实到实践中的体验。",
      "这里把{headline}当作可实践的主题来学习。通过{subtitle}，课程会指出你可以在自己身上留意什么，以及如何更有意识地活出这份洞见。",
    ],
    withoutSubtitle: [
      "本节课聚焦{headline}，帮助你看见这一主题如何出现在真实经验中，以及如何更有觉知地练习它。",
      "这里的重点是{headline}。课程不仅希望你理解这个观念，也希望你把它和内在模式、情绪反应以及日常选择联系起来。",
      "这一部分会进一步深化{headline}，让它不只是一个概念，而是你可以观察、提问并落实到实践中的体验。",
      "这里把{headline}当作可实践的主题来学习，课程会指出你可以在自己身上留意什么，以及如何更有意识地活出这份洞见。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, para ayudarte a ver cómo este tema aparece en la experiencia vivida y cómo practicarlo con más consciencia.",
      "Aquí el foco está en {headline}. Al observar de cerca {subtitle}, conectas la idea con patrones internos, respuestas emocionales y decisiones cotidianas.",
      "Esta sección profundiza en {headline} al examinar {subtitle}, de modo que el concepto deje de ser solo una idea y se vuelva algo que puedas observar, cuestionar y aplicar.",
      "Aquí {headline} se aborda como una práctica viva. A través de {subtitle}, la lección muestra qué notar en ti mismo y cómo encarnar esta comprensión con mayor consciencia.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, para ayudarte a ver cómo este tema aparece en la experiencia vivida y cómo practicarlo con más consciencia.",
      "Aquí el foco está en {headline}. El objetivo no es solo entender la idea, sino conectarla con patrones internos, respuestas emocionales y decisiones cotidianas.",
      "Esta sección profundiza en {headline}, de modo que el concepto deje de ser solo una idea y se vuelva algo que puedas observar, cuestionar y aplicar.",
      "Aquí {headline} se aborda como una práctica viva, mostrando qué notar en ti mismo y cómo encarnar esta comprensión con mayor consciencia.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} pela lente de {subtitle}, ajudando você a perceber como esse tema aparece na experiência vivida e como praticá-lo com mais consciência.",
      "Aqui o foco é {headline}. Ao olhar de perto para {subtitle}, você conecta a ideia a padrões internos, respostas emocionais e escolhas do dia a dia.",
      "Esta seção aprofunda {headline} ao examinar {subtitle}, para que o conceito deixe de ser apenas uma ideia e se torne algo que você pode observar, questionar e aplicar.",
      "Aqui, {headline} é tratado como uma prática viva. Por meio de {subtitle}, a aula mostra o que observar em si mesmo e como incorporar essa compreensão com mais consciência.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a perceber como esse tema aparece na experiência vivida e como praticá-lo com mais consciência.",
      "Aqui o foco é {headline}. O objetivo não é apenas entender a ideia, mas conectá-la a padrões internos, respostas emocionais e escolhas do dia a dia.",
      "Esta seção aprofunda {headline}, para que o conceito deixe de ser apenas uma ideia e se torne algo que você pode observar, questionar e aplicar.",
      "Aqui, {headline} é tratado como uma prática viva, mostrando o que observar em si mesmo e como incorporar essa compreensão com mais consciência.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erschließt {headline} durch {subtitle} und hilft dir zu erkennen, wie dieses Thema in deiner gelebten Erfahrung auftaucht und bewusster geübt werden kann.",
      "Hier liegt der Fokus auf {headline}. Wenn du {subtitle} genauer betrachtest, verbindest du die Idee mit inneren Mustern, emotionalen Reaktionen und alltäglichen Entscheidungen.",
      "Dieser Abschnitt vertieft {headline}, indem er {subtitle} näher untersucht, sodass das Konzept nicht nur Theorie bleibt, sondern zu etwas wird, das du beobachten, hinterfragen und anwenden kannst.",
      "{headline} wird hier als gelebte Praxis verstanden. Durch {subtitle} zeigt die Lektion, worauf du in dir selbst achten kannst und wie du die Einsicht bewusster verkörperst.",
    ],
    withoutSubtitle: [
      "Diese Lektion erschließt {headline} und hilft dir zu erkennen, wie dieses Thema in deiner gelebten Erfahrung auftaucht und bewusster geübt werden kann.",
      "Hier liegt der Fokus auf {headline}. Es geht nicht nur darum, die Idee zu verstehen, sondern sie mit inneren Mustern, emotionalen Reaktionen und alltäglichen Entscheidungen zu verbinden.",
      "Dieser Abschnitt vertieft {headline}, sodass das Konzept nicht nur Theorie bleibt, sondern zu etwas wird, das du beobachten, hinterfragen und anwenden kannst.",
      "{headline} wird hier als gelebte Praxis verstanden und zeigt, worauf du in dir selbst achten kannst und wie du die Einsicht bewusster verkörperst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, afin de t'aider à voir comment ce thème apparaît dans l'expérience vécue et comment le pratiquer avec plus de conscience.",
      "Ici, l'accent est mis sur {headline}. En observant de près {subtitle}, tu relies cette idée à tes schémas intérieurs, à tes réactions émotionnelles et à tes choix quotidiens.",
      "Cette section approfondit {headline} en examinant {subtitle}, pour que le concept ne reste pas seulement théorique mais devienne quelque chose que tu peux observer, questionner et appliquer.",
      "Ici, {headline} est abordé comme une pratique vivante. À travers {subtitle}, la leçon montre ce qu'il faut remarquer en toi et comment incarner cette compréhension avec plus de conscience.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, afin de t'aider à voir comment ce thème apparaît dans l'expérience vécue et comment le pratiquer avec plus de conscience.",
      "Ici, l'accent est mis sur {headline}. Il ne s'agit pas seulement de comprendre l'idée, mais aussi de la relier à tes schémas intérieurs, à tes réactions émotionnelles et à tes choix quotidiens.",
      "Cette section approfondit {headline}, pour que le concept ne reste pas seulement théorique mais devienne quelque chose que tu peux observer, questionner et appliquer.",
      "Ici, {headline} est abordé comme une pratique vivante, montrant ce qu'il faut remarquer en toi et comment incarner cette compréhension avec plus de conscience.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}という視点から{headline}を掘り下げ、このテーマが実際の体験にどう現れるのか、そしてより意識的に実践するには何を見ればよいのかを学びます。",
      "ここでの焦点は{headline}です。{subtitle}を丁寧に見ていくことで、この考えを内面のパターン、感情の反応、日々の選択と結びつけて理解していきます。",
      "このセクションでは、{subtitle}を手がかりに{headline}をさらに深め、単なる概念ではなく、自分で観察し、問いかけ、実践できるものへと変えていきます。",
      "ここでは{headline}を生きた実践として扱います。{subtitle}を通して、自分の中で何に気づけばよいか、そしてこの洞察をどう体現するかが示されます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を掘り下げ、このテーマが実際の体験にどう現れるのか、そしてより意識的に実践するには何を見ればよいのかを学びます。",
      "ここでの焦点は{headline}です。単に概念として理解するだけでなく、それを内面のパターン、感情の反応、日々の選択と結びつけていきます。",
      "このセクションでは{headline}をさらに深め、単なる概念ではなく、自分で観察し、問いかけ、実践できるものへと変えていきます。",
      "ここでは{headline}を生きた実践として扱い、自分の中で何に気づけばよいか、そしてこの洞察をどう体現するかが示されます。",
    ],
  },
};

function splitStepTitle(title: string): { headline: string; subtitle: string | null } {
  const match = title.match(/^(.*?)\s+[—-]\s+(.*)$/);
  if (!match) {
    return {
      headline: title.trim(),
      subtitle: null,
    };
  }

  return {
    headline: match[1].trim(),
    subtitle: match[2].trim(),
  };
}

function formatTemplate(template: string, headline: string, subtitle?: string | null): string {
  return template
    .split("{headline}").join(headline)
    .split("{subtitle}").join(subtitle ?? "");
}

export function getSpiritualJourneyStepDescription(
  language: Language,
  stepIndex: number,
  localizedTitle: string,
): string {
  const { headline, subtitle } = splitStepTitle(localizedTitle);
  if (!headline) return "";

  const templates = STEP_DESCRIPTION_TEMPLATES[language];
  if (subtitle) {
    const template = templates.withSubtitle[stepIndex % templates.withSubtitle.length];
    return formatTemplate(template, headline, subtitle);
  }

  const template = templates.withoutSubtitle[stepIndex % templates.withoutSubtitle.length];
  return formatTemplate(template, headline);
}
