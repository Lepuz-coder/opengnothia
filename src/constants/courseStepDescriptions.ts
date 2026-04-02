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

const QUIT_SMOKING_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak sigara içmenin ardındaki yanılsamalardan birini daha görünür kılar.",
      "Buradaki odak {headline}. {subtitle} sayesinde beyni tuzağa düşüren koşullanmayı çözmeye ve sigarayı olduğu gibi görmeye başlarsın.",
      "Bu bölüm, {headline} temasını {subtitle} çerçevesinde inceler; belirsiz bir hissi, üzerine harekete geçebileceğin net bir anlayışa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Amaç korkuyu kaldırmak ve sigaranın sana gerçekte ne yaptığını açıkça görmektir.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak sigara içmenin ardındaki temel yanılsamalardan birini görünür kılar.",
      "Buradaki odak {headline}. Amaç seni korkutmak değil, gerçeği net biçimde görmeni sağlayarak içme isteğinin kendiliğinden düşmesini sağlamaktır.",
      "Bu bölüm, {headline} temasını daha somut hale getirerek belirsiz bir hissi, harekete geçebileceğin net bir anlayışa dönüştürür.",
      "{headline} burada doğrudan ele alınır; böylece korkuyu bırakabilir ve sigaranın sana gerçekte ne yaptığını görebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson examines {headline} through {subtitle}, helping you see through one of the key illusions that keeps smokers trapped.",
      "Here the focus is {headline}. By understanding {subtitle}, you begin to dismantle the brainwashing and see smoking for what it really is.",
      "This section takes a closer look at {headline} by exploring {subtitle}, turning a vague feeling into a clear understanding you can act on.",
      "{headline} is addressed here through {subtitle}. The goal is to remove the fear and replace it with the truth about what smoking actually does.",
    ],
    withoutSubtitle: [
      "This lesson examines {headline}, helping you see through one of the key illusions that keeps smokers trapped.",
      "Here the focus is {headline}. The aim is not to scare you but to help you see the reality clearly so the desire to smoke simply falls away.",
      "This section takes a closer look at {headline}, turning a vague feeling into a clear understanding you can act on.",
      "{headline} is addressed here so you can remove the fear and see the truth about what smoking actually does to you.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来审视{headline}，帮助你看穿让吸烟者深陷其中的关键幻觉之一。",
      "这里的重点是{headline}。通过理解{subtitle}，你开始拆解洗脑机制，看清吸烟的真面目。",
      "这一部分通过探索{subtitle}来深入{headline}，将模糊的感觉转化为你可以采取行动的清晰认知。",
      "这里通过{subtitle}来讨论{headline}。目标是消除恐惧，用吸烟真正带来的后果来取代它。",
    ],
    withoutSubtitle: [
      "本节课审视{headline}，帮助你看穿让吸烟者深陷其中的关键幻觉之一。",
      "这里的重点是{headline}。目的不是吓唬你，而是帮你清楚地看到现实，让吸烟的欲望自然消退。",
      "这一部分深入{headline}，将模糊的感觉转化为你可以采取行动的清晰认知。",
      "这里直接讨论{headline}，帮你消除恐惧，看清吸烟到底对你做了什么。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección examina {headline} a través de {subtitle}, ayudándote a ver una de las ilusiones clave que mantienen atrapados a los fumadores.",
      "Aquí el foco está en {headline}. Al comprender {subtitle}, empiezas a desmontar el lavado de cerebro y a ver el tabaco tal como es.",
      "Esta sección profundiza en {headline} explorando {subtitle}, convirtiendo una sensación vaga en una comprensión clara sobre la que puedes actuar.",
      "Aquí se aborda {headline} a través de {subtitle}. El objetivo es eliminar el miedo y reemplazarlo con la verdad sobre lo que fumar realmente hace.",
    ],
    withoutSubtitle: [
      "Esta lección examina {headline}, ayudándote a ver una de las ilusiones clave que mantienen atrapados a los fumadores.",
      "Aquí el foco está en {headline}. El objetivo no es asustarte, sino ayudarte a ver la realidad con claridad para que el deseo de fumar simplemente desaparezca.",
      "Esta sección profundiza en {headline}, convirtiendo una sensación vaga en una comprensión clara sobre la que puedes actuar.",
      "Aquí se aborda {headline} para que puedas eliminar el miedo y ver la verdad sobre lo que fumar realmente te hace.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula examina {headline} através de {subtitle}, ajudando você a enxergar uma das ilusões-chave que mantêm os fumantes presos.",
      "Aqui o foco é {headline}. Ao compreender {subtitle}, você começa a desmontar a lavagem cerebral e a ver o cigarro como ele realmente é.",
      "Esta seção aprofunda {headline} explorando {subtitle}, transformando um sentimento vago em uma compreensão clara sobre a qual você pode agir.",
      "Aqui, {headline} é abordado através de {subtitle}. O objetivo é remover o medo e substituí-lo pela verdade sobre o que fumar realmente faz.",
    ],
    withoutSubtitle: [
      "Esta aula examina {headline}, ajudando você a enxergar uma das ilusões-chave que mantêm os fumantes presos.",
      "Aqui o foco é {headline}. O objetivo não é assustar, mas ajudar você a ver a realidade com clareza para que o desejo de fumar simplesmente desapareça.",
      "Esta seção aprofunda {headline}, transformando um sentimento vago em uma compreensão clara sobre a qual você pode agir.",
      "Aqui, {headline} é abordado para que você possa remover o medo e ver a verdade sobre o que fumar realmente faz com você.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion untersucht {headline} durch {subtitle} und hilft dir, eine der zentralen Illusionen zu durchschauen, die Raucher gefangen hält.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} verstehst, beginnst du die Gehirnwäsche abzubauen und das Rauchen so zu sehen, wie es wirklich ist.",
      "Dieser Abschnitt vertieft {headline} durch {subtitle} und verwandelt ein vages Gefühl in ein klares Verständnis, nach dem du handeln kannst.",
      "{headline} wird hier durch {subtitle} behandelt. Das Ziel ist, die Angst zu beseitigen und sie durch die Wahrheit darüber zu ersetzen, was Rauchen tatsächlich bewirkt.",
    ],
    withoutSubtitle: [
      "Diese Lektion untersucht {headline} und hilft dir, eine der zentralen Illusionen zu durchschauen, die Raucher gefangen hält.",
      "Hier liegt der Fokus auf {headline}. Es geht nicht darum, dir Angst zu machen, sondern dir zu helfen, die Realität klar zu sehen, damit das Verlangen zu rauchen einfach nachlässt.",
      "Dieser Abschnitt vertieft {headline} und verwandelt ein vages Gefühl in ein klares Verständnis, nach dem du handeln kannst.",
      "{headline} wird hier behandelt, damit du die Angst ablegen und die Wahrheit darüber sehen kannst, was Rauchen dir wirklich antut.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon examine {headline} à travers {subtitle}, t'aidant à voir au-delà d'une des illusions clés qui piègent les fumeurs.",
      "Ici, l'accent est mis sur {headline}. En comprenant {subtitle}, tu commences à déconstruire le conditionnement et à voir le tabac tel qu'il est vraiment.",
      "Cette section approfondit {headline} en explorant {subtitle}, transformant un sentiment vague en une compréhension claire sur laquelle tu peux agir.",
      "Ici, {headline} est abordé à travers {subtitle}. L'objectif est de supprimer la peur et de la remplacer par la vérité sur ce que fumer fait réellement.",
    ],
    withoutSubtitle: [
      "Cette leçon examine {headline}, t'aidant à voir au-delà d'une des illusions clés qui piègent les fumeurs.",
      "Ici, l'accent est mis sur {headline}. Le but n'est pas de te faire peur, mais de t'aider à voir la réalité clairement pour que l'envie de fumer s'efface d'elle-même.",
      "Cette section approfondit {headline}, transformant un sentiment vague en une compréhension claire sur laquelle tu peux agir.",
      "Ici, {headline} est abordé pour que tu puisses supprimer la peur et voir la vérité sur ce que fumer te fait vraiment.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは{subtitle}を通して{headline}を検証し、喫煙者を縛る重要な錯覚の一つを見抜く手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を理解することで、洗脳を解体し、喫煙の本当の姿を見始めます。",
      "このセクションでは{subtitle}を掘り下げて{headline}をより深く理解し、漠然とした感覚を行動できる明確な認識に変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。目標は恐怖を取り除き、喫煙が実際に何をしているかという真実に置き換えることです。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を検証し、喫煙者を縛る重要な錯覚の一つを見抜く手助けをします。",
      "ここでの焦点は{headline}です。怖がらせることが目的ではなく、現実をはっきりと見ることで、喫煙への欲求が自然に消えるようにすることです。",
      "このセクションでは{headline}をより深く理解し、漠然とした感覚を行動できる明確な認識に変えます。",
      "ここでは{headline}を直接扱い、恐怖を取り除いて喫煙が本当にあなたに何をしているかを見られるようにします。",
    ],
  },
};

const COURSE_TEMPLATES: Record<string, Record<Language, StepDescriptionTemplates>> = {
  spiritual_journey: STEP_DESCRIPTION_TEMPLATES,
  quit_smoking: QUIT_SMOKING_TEMPLATES,
};

export function getCourseStepDescription(
  courseId: string,
  language: Language,
  stepIndex: number,
  localizedTitle: string,
): string {
  const { headline, subtitle } = splitStepTitle(localizedTitle);
  if (!headline) return "";

  const templates = COURSE_TEMPLATES[courseId]?.[language] ?? STEP_DESCRIPTION_TEMPLATES[language];
  if (subtitle) {
    const template = templates.withSubtitle[stepIndex % templates.withSubtitle.length];
    return formatTemplate(template, headline, subtitle);
  }

  const template = templates.withoutSubtitle[stepIndex % templates.withoutSubtitle.length];
  return formatTemplate(template, headline);
}

export function getSpiritualJourneyStepDescription(
  language: Language,
  stepIndex: number,
  localizedTitle: string,
): string {
  return getCourseStepDescription("spiritual_journey", language, stepIndex, localizedTitle);
}
