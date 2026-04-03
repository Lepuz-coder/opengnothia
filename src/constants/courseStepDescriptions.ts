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

const MAKING_PEACE_WITH_ANXIETY_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak kaygının nasıl işlediğini ve ne yapabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde kaygı örüntülerini daha net görür ve pratik bir yanıt yolu öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; belirsiz kaygıyı üzerine hareket edebileceğin bir anlayışa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, içinde neler olduğunu fark etmeni ve daha sakin bir yanıt pratiği geliştirmeni sağlar.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak kaygının nasıl işlediğini ve ne yapabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, belirsiz kaygıyı net bir anlayışa ve pratik becerilere dönüştürmektir.",
      "Bu bölüm, {headline} konusunu derinleştirerek örüntüleri tanıma ve daha güvenli yanıt verme araçları sunar.",
      "{headline} burada ele alınır; böylece içinde gerçekte neler olduğunu görebilir ve daha sakin, daha köklü bir yanıt pratiği geliştirebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how anxiety works and what you can do about it.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your anxiety patterns and learn a practical way to respond.",
      "This section deepens your understanding of {headline} through {subtitle}, turning anxious uncertainty into knowledge you can act on.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what happens inside you and practicing a calmer response.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how anxiety works and what you can do about it.",
      "Here the focus is {headline}. The goal is to turn anxious uncertainty into clear understanding and practical skills.",
      "This section deepens your understanding of {headline}, giving you tools to recognize patterns and respond with more confidence.",
      "{headline} is addressed here so you can see what is actually happening inside you and practice a calmer, more grounded response.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解焦虑是如何运作的以及你可以做什么。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的焦虑模式并学到实用的应对方法。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将焦虑的不确定感转化为可以付诸行动的认知。",
      "这里通过{subtitle}来讨论{headline}。课程引导你识别内在发生了什么，并练习更平静的回应方式。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解焦虑是如何运作的以及你可以做什么。",
      "这里的重点是{headline}。目标是将焦虑的不确定感转化为清晰的理解和实用的技能。",
      "这一部分加深你对{headline}的理解，给你识别模式和更自信地回应的工具。",
      "这里讨论{headline}，帮你看清内在实际发生了什么，并练习更平静、更踏实的回应方式。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo funciona la ansiedad y qué puedes hacer al respecto.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tus patrones de ansiedad y aprendes una forma práctica de responder.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo la incertidumbre ansiosa en conocimiento sobre el que puedes actuar.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer lo que ocurre dentro de ti y practicar una respuesta más tranquila.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo funciona la ansiedad y qué puedes hacer al respecto.",
      "Aquí el foco está en {headline}. El objetivo es convertir la incertidumbre ansiosa en comprensión clara y habilidades prácticas.",
      "Esta sección profundiza en {headline}, dándote herramientas para reconocer patrones y responder con más confianza.",
      "Aquí se aborda {headline} para que puedas ver lo que realmente está pasando dentro de ti y practicar una respuesta más tranquila y arraigada.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como a ansiedade funciona e o que pode fazer a respeito.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara dos seus padrões de ansiedade e aprende uma forma prática de responder.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando a incerteza ansiosa em conhecimento sobre o qual você pode agir.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que acontece dentro de si e a praticar uma resposta mais calma.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como a ansiedade funciona e o que pode fazer a respeito.",
      "Aqui o foco é {headline}. O objetivo é transformar a incerteza ansiosa em compreensão clara e habilidades práticas.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo ferramentas para reconhecer padrões e responder com mais confiança.",
      "Aqui, {headline} é abordado para que você possa ver o que realmente está acontecendo dentro de si e praticar uma resposta mais calma e centrada.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie Angst funktioniert und was du dagegen tun kannst.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Angstmuster und lernst einen praktischen Umgang damit.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt ängstliche Unsicherheit in Wissen, nach dem du handeln kannst.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was in dir passiert, und eine ruhigere Reaktion zu üben.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie Angst funktioniert und was du dagegen tun kannst.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, ängstliche Unsicherheit in klares Verständnis und praktische Fähigkeiten zu verwandeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Werkzeuge, um Muster zu erkennen und selbstbewusster zu reagieren.",
      "{headline} wird hier behandelt, damit du sehen kannst, was tatsächlich in dir passiert, und eine ruhigere, geerdete Reaktion üben kannst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment l'anxiété fonctionne et ce que tu peux faire.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de tes schémas d'anxiété et apprends une façon pratique d'y répondre.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant l'incertitude anxieuse en connaissance sur laquelle tu peux agir.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce qui se passe en toi et pratiquer une réponse plus calme.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment l'anxiété fonctionne et ce que tu peux faire.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de transformer l'incertitude anxieuse en compréhension claire et en compétences pratiques.",
      "Cette section approfondit ta compréhension de {headline}, te donnant des outils pour reconnaître les schémas et répondre avec plus de confiance.",
      "Ici, {headline} est abordé pour que tu puisses voir ce qui se passe réellement en toi et pratiquer une réponse plus calme et ancrée.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、不安がどう働くのか、そして何ができるのかを理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分の不安パターンをより明確に把握し、実践的な対処法を学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、漠然とした不安を行動できる知識に変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、自分の内側で何が起きているかを認識し、より穏やかな反応を練習するよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、不安がどう働くのか、そして何ができるのかを理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、漠然とした不安を明確な理解と実践的なスキルに変えることです。",
      "このセクションでは{headline}の理解を深め、パターンを認識してより自信を持って対応するためのツールを提供します。",
      "ここでは{headline}を扱い、自分の内側で実際に何が起きているかを見て、より穏やかで地に足のついた反応を練習できるようにします。",
    ],
  },
};

const ANGER_MANAGEMENT_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak öfkenin nasıl işlediğini ve onunla nasıl daha sağlıklı başa çıkabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde öfke örüntülerini daha net görür ve pratik bir yanıt yolu öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; kontrolsüz öfkeyi fark edebileceğin ve yönetebileceğin bir anlayışa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, içinde neler olduğunu fark etmeni ve tepki yerine bilinçli bir yanıt geliştirmeni sağlar.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak öfkenin nasıl işlediğini ve onunla nasıl daha sağlıklı başa çıkabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, kontrolsüz öfkeyi net bir anlayışa ve pratik becerilere dönüştürmektir.",
      "Bu bölüm, {headline} konusunu derinleştirerek örüntüleri tanıma ve daha sakin yanıt verme araçları sunar.",
      "{headline} burada ele alınır; böylece içinde gerçekte neler olduğunu görebilir ve tepki yerine bilinçli bir yanıt geliştirebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how anger works and how to respond to it more skillfully.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your anger patterns and learn a practical way to respond.",
      "This section deepens your understanding of {headline} through {subtitle}, turning reactive impulses into awareness you can act on.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what happens inside you and choosing a calmer response.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how anger works and how to respond to it more skillfully.",
      "Here the focus is {headline}. The goal is to turn reactive impulses into clear understanding and practical skills.",
      "This section deepens your understanding of {headline}, giving you tools to recognize patterns and respond with more control.",
      "{headline} is addressed here so you can see what is actually happening inside you and choose a calmer, more intentional response.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解愤怒是如何运作的以及如何更有技巧地回应它。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的愤怒模式并学到实用的应对方法。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将冲动反应转化为可以付诸行动的觉察。",
      "这里通过{subtitle}来讨论{headline}。课程引导你识别内在发生了什么，并选择更平静的回应方式。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解愤怒是如何运作的以及如何更有技巧地回应它。",
      "这里的重点是{headline}。目标是将冲动反应转化为清晰的理解和实用的技能。",
      "这一部分加深你对{headline}的理解，给你识别模式和更有控制力地回应的工具。",
      "这里讨论{headline}，帮你看清内在实际发生了什么，并选择更平静、更有意识的回应方式。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo funciona la ira y cómo responder a ella con más habilidad.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tus patrones de ira y aprendes una forma práctica de responder.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo impulsos reactivos en conciencia sobre la que puedes actuar.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer lo que ocurre dentro de ti y elegir una respuesta más tranquila.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo funciona la ira y cómo responder a ella con más habilidad.",
      "Aquí el foco está en {headline}. El objetivo es convertir impulsos reactivos en comprensión clara y habilidades prácticas.",
      "Esta sección profundiza en {headline}, dándote herramientas para reconocer patrones y responder con más control.",
      "Aquí se aborda {headline} para que puedas ver lo que realmente está pasando dentro de ti y elegir una respuesta más tranquila e intencional.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como a raiva funciona e como responder a ela com mais habilidade.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara dos seus padrões de raiva e aprende uma forma prática de responder.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando impulsos reativos em consciência sobre a qual você pode agir.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que acontece dentro de si e a escolher uma resposta mais calma.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como a raiva funciona e como responder a ela com mais habilidade.",
      "Aqui o foco é {headline}. O objetivo é transformar impulsos reativos em compreensão clara e habilidades práticas.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo ferramentas para reconhecer padrões e responder com mais controle.",
      "Aqui, {headline} é abordado para que você possa ver o que realmente está acontecendo dentro de si e escolher uma resposta mais calma e intencional.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie Wut funktioniert und wie du geschickter darauf reagieren kannst.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Wutmuster und lernst einen praktischen Umgang damit.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt reaktive Impulse in Bewusstheit, nach der du handeln kannst.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was in dir passiert, und eine ruhigere Reaktion zu wählen.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie Wut funktioniert und wie du geschickter darauf reagieren kannst.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, reaktive Impulse in klares Verständnis und praktische Fähigkeiten zu verwandeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Werkzeuge, um Muster zu erkennen und kontrollierter zu reagieren.",
      "{headline} wird hier behandelt, damit du sehen kannst, was tatsächlich in dir passiert, und eine ruhigere, bewusstere Reaktion wählen kannst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment la colère fonctionne et comment y répondre plus habilement.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de tes schémas de colère et apprends une façon pratique d'y répondre.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant les impulsions réactives en conscience sur laquelle tu peux agir.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce qui se passe en toi et choisir une réponse plus calme.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment la colère fonctionne et comment y répondre plus habilement.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de transformer les impulsions réactives en compréhension claire et en compétences pratiques.",
      "Cette section approfondit ta compréhension de {headline}, te donnant des outils pour reconnaître les schémas et répondre avec plus de contrôle.",
      "Ici, {headline} est abordé pour que tu puisses voir ce qui se passe réellement en toi et choisir une réponse plus calme et intentionnelle.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、怒りがどう働くのか、そしてより巧みに対応するにはどうすればよいかを理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分の怒りパターンをより明確に把握し、実践的な対処法を学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、反射的な衝動を行動できる気づきに変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、自分の内側で何が起きているかを認識し、より穏やかな反応を選ぶよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、怒りがどう働くのか、そしてより巧みに対応するにはどうすればよいかを理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、反射的な衝動を明確な理解と実践的なスキルに変えることです。",
      "このセクションでは{headline}の理解を深め、パターンを認識してより制御された対応をするためのツールを提供します。",
      "ここでは{headline}を扱い、自分の内側で実際に何が起きているかを見て、より穏やかで意図的な反応を選べるようにします。",
    ],
  },
};

const HEALTHY_RELATIONSHIPS_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak ilişkilerinin nasıl işlediğini ve onları nasıl daha sağlıklı hale getirebileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde ilişki örüntülerini daha net görür ve pratik bir beceri öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; alışkanlık haline gelmiş kalıpları fark edebileceğin bir anlayışa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, ilişkilerinde neler olduğunu fark etmeni ve daha bilinçli bir bağ kurmanı sağlar.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak ilişkilerinin nasıl işlediğini ve onları nasıl daha sağlıklı hale getirebileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, otomatik tepkileri bilinçli seçimlere ve pratik becerilere dönüştürmektir.",
      "Bu bölüm, {headline} konusunu derinleştirerek ilişki örüntülerini tanıma ve daha sağlıklı bağlar kurma araçları sunar.",
      "{headline} burada ele alınır; böylece ilişkilerinde gerçekte neler olduğunu görebilir ve daha bilinçli, daha bağlayıcı bir yaklaşım geliştirebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how your relationships work and how to make them healthier.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your relational patterns and learn a practical skill to use right away.",
      "This section deepens your understanding of {headline} through {subtitle}, turning habitual reactions into conscious choices.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what happens in your relationships and building stronger connections.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how your relationships work and how to make them healthier.",
      "Here the focus is {headline}. The goal is to turn automatic reactions into conscious choices and practical skills.",
      "This section deepens your understanding of {headline}, giving you tools to recognize patterns and build stronger connections.",
      "{headline} is addressed here so you can see what is actually happening in your relationships and respond with more awareness and care.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解你的关系是如何运作的以及如何使其更健康。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的关系模式并学到可以立即使用的实用技能。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将习惯性反应转化为有意识的选择。",
      "这里通过{subtitle}来讨论{headline}。课程引导你识别关系中发生了什么并建立更强的连接。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解你的关系是如何运作的以及如何使其更健康。",
      "这里的重点是{headline}。目标是将自动反应转化为有意识的选择和实用技能。",
      "这一部分加深你对{headline}的理解，给你识别模式和建立更强连接的工具。",
      "这里讨论{headline}，帮你看清关系中实际发生了什么，并以更多觉察和关怀来回应。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo funcionan tus relaciones y cómo hacerlas más saludables.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tus patrones relacionales y aprendes una habilidad práctica.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo reacciones habituales en elecciones conscientes.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer lo que ocurre en tus relaciones y construir conexiones más fuertes.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo funcionan tus relaciones y cómo hacerlas más saludables.",
      "Aquí el foco está en {headline}. El objetivo es convertir reacciones automáticas en elecciones conscientes y habilidades prácticas.",
      "Esta sección profundiza en {headline}, dándote herramientas para reconocer patrones y construir conexiones más fuertes.",
      "Aquí se aborda {headline} para que puedas ver lo que realmente está pasando en tus relaciones y responder con más consciencia y cuidado.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como seus relacionamentos funcionam e como torná-los mais saudáveis.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara dos seus padrões relacionais e aprende uma habilidade prática.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando reações habituais em escolhas conscientes.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que acontece nos seus relacionamentos e a construir conexões mais fortes.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como seus relacionamentos funcionam e como torná-los mais saudáveis.",
      "Aqui o foco é {headline}. O objetivo é transformar reações automáticas em escolhas conscientes e habilidades práticas.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo ferramentas para reconhecer padrões e construir conexões mais fortes.",
      "Aqui, {headline} é abordado para que você possa ver o que realmente está acontecendo nos seus relacionamentos e responder com mais consciência e cuidado.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie deine Beziehungen funktionieren und wie du sie gesünder gestalten kannst.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Beziehungsmuster und lernst eine praktische Fähigkeit.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt gewohnheitsmäßige Reaktionen in bewusste Entscheidungen.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was in deinen Beziehungen passiert, und stärkere Verbindungen aufzubauen.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie deine Beziehungen funktionieren und wie du sie gesünder gestalten kannst.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, automatische Reaktionen in bewusste Entscheidungen und praktische Fähigkeiten zu verwandeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Werkzeuge, um Muster zu erkennen und stärkere Verbindungen aufzubauen.",
      "{headline} wird hier behandelt, damit du sehen kannst, was tatsächlich in deinen Beziehungen passiert, und mit mehr Bewusstsein und Fürsorge reagieren kannst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment tes relations fonctionnent et comment les rendre plus saines.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de tes schémas relationnels et apprends une compétence pratique.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant les réactions habituelles en choix conscients.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce qui se passe dans tes relations et construire des connexions plus fortes.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment tes relations fonctionnent et comment les rendre plus saines.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de transformer les réactions automatiques en choix conscients et en compétences pratiques.",
      "Cette section approfondit ta compréhension de {headline}, te donnant des outils pour reconnaître les schémas et construire des connexions plus fortes.",
      "Ici, {headline} est abordé pour que tu puisses voir ce qui se passe réellement dans tes relations et répondre avec plus de conscience et de soin.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、あなたの関係がどう機能しているか、そしてより健全にするにはどうすればよいかを理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分の関係パターンをより明確に把握し、すぐに使える実践的なスキルを学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、習慣的な反応を意識的な選択に変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、関係の中で何が起きているかを認識し、より強いつながりを築くよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、あなたの関係がどう機能しているか、そしてより健全にするにはどうすればよいかを理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、自動的な反応を意識的な選択と実践的なスキルに変えることです。",
      "このセクションでは{headline}の理解を深め、パターンを認識してより強いつながりを築くためのツールを提供します。",
      "ここでは{headline}を扱い、関係の中で実際に何が起きているかを見て、より多くの気づきと思いやりを持って対応できるようにします。",
    ],
  },
};

const DIGITAL_DETOX_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak dijital alışkanlıklarının nasıl çalıştığını ve onları nasıl bilinçli hale getirebileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde ekran kullanım örüntülerini daha net görür ve pratik bir strateji öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; otomatik dijital davranışları fark edebileceğin bir anlayışa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, teknolojiyle ilişkinde neler olduğunu fark etmeni ve daha bilinçli seçimler yapmana yardımcı olur.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak dijital alışkanlıklarının nasıl çalıştığını ve onları nasıl bilinçli hale getirebileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, otomatik dijital davranışları fark edip bilinçli seçimlere dönüştürmektir.",
      "Bu bölüm, {headline} konusunu derinleştirerek ekran alışkanlıklarını tanıma ve daha sağlıklı bir dijital yaşam kurma araçları sunar.",
      "{headline} burada ele alınır; böylece teknolojiyle ilişkinde gerçekte neler olduğunu görebilir ve kendi koşullarında kullanmayı öğrenebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how your digital habits work and how to make them more intentional.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your screen patterns and learn a practical strategy to reclaim your attention.",
      "This section deepens your understanding of {headline} through {subtitle}, turning automatic digital behaviors into conscious choices.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what technology does to your attention and building healthier habits.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how your digital habits work and how to make them more intentional.",
      "Here the focus is {headline}. The goal is to turn automatic digital behaviors into conscious choices and practical skills.",
      "This section deepens your understanding of {headline}, giving you tools to recognize screen patterns and build a healthier digital life.",
      "{headline} is addressed here so you can see what technology is actually doing to your attention and learn to use it on your own terms.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解你的数字习惯是如何运作的以及如何使其更有意识。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的屏幕模式并学到夺回注意力的实用策略。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将自动化的数字行为转化为有意识的选择。",
      "这里通过{subtitle}来讨论{headline}。课程引导你认识技术对注意力的影响并建立更健康的习惯。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解你的数字习惯是如何运作的以及如何使其更有意识。",
      "这里的重点是{headline}。目标是将自动化的数字行为转化为有意识的选择和实用技能。",
      "这一部分加深你对{headline}的理解，给你识别屏幕模式和建立更健康数字生活的工具。",
      "这里讨论{headline}，帮你看清技术实际上对你的注意力做了什么，并学会按自己的方式使用它。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo funcionan tus hábitos digitales y cómo hacerlos más intencionales.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tus patrones de pantalla y aprendes una estrategia práctica para recuperar tu atención.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo comportamientos digitales automáticos en elecciones conscientes.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer lo que la tecnología hace con tu atención y construir hábitos más saludables.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo funcionan tus hábitos digitales y cómo hacerlos más intencionales.",
      "Aquí el foco está en {headline}. El objetivo es convertir comportamientos digitales automáticos en elecciones conscientes y habilidades prácticas.",
      "Esta sección profundiza en {headline}, dándote herramientas para reconocer patrones de pantalla y construir una vida digital más saludable.",
      "Aquí se aborda {headline} para que puedas ver lo que la tecnología realmente hace con tu atención y aprender a usarla en tus propios términos.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como seus hábitos digitais funcionam e como torná-los mais intencionais.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara dos seus padrões de tela e aprende uma estratégia prática para retomar sua atenção.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando comportamentos digitais automáticos em escolhas conscientes.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que a tecnologia faz com sua atenção e a construir hábitos mais saudáveis.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como seus hábitos digitais funcionam e como torná-los mais intencionais.",
      "Aqui o foco é {headline}. O objetivo é transformar comportamentos digitais automáticos em escolhas conscientes e habilidades práticas.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo ferramentas para reconhecer padrões de tela e construir uma vida digital mais saudável.",
      "Aqui, {headline} é abordado para que você possa ver o que a tecnologia realmente faz com sua atenção e aprender a usá-la nos seus próprios termos.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie deine digitalen Gewohnheiten funktionieren und wie du sie bewusster gestalten kannst.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Bildschirmmuster und lernst eine praktische Strategie, um deine Aufmerksamkeit zurückzugewinnen.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt automatische digitale Verhaltensweisen in bewusste Entscheidungen.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was Technologie mit deiner Aufmerksamkeit macht, und gesündere Gewohnheiten aufzubauen.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie deine digitalen Gewohnheiten funktionieren und wie du sie bewusster gestalten kannst.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, automatische digitale Verhaltensweisen in bewusste Entscheidungen und praktische Fähigkeiten zu verwandeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Werkzeuge, um Bildschirmmuster zu erkennen und ein gesünderes digitales Leben aufzubauen.",
      "{headline} wird hier behandelt, damit du sehen kannst, was Technologie tatsächlich mit deiner Aufmerksamkeit macht, und lernst, sie nach deinen eigenen Bedingungen zu nutzen.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment tes habitudes numériques fonctionnent et comment les rendre plus intentionnelles.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de tes schémas d'écran et apprends une stratégie pratique pour reprendre ton attention.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant les comportements numériques automatiques en choix conscients.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce que la technologie fait à ton attention et construire des habitudes plus saines.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment tes habitudes numériques fonctionnent et comment les rendre plus intentionnelles.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de transformer les comportements numériques automatiques en choix conscients et en compétences pratiques.",
      "Cette section approfondit ta compréhension de {headline}, te donnant des outils pour reconnaître les schémas d'écran et construire une vie numérique plus saine.",
      "Ici, {headline} est abordé pour que tu puisses voir ce que la technologie fait réellement à ton attention et apprendre à l'utiliser à tes propres conditions.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、あなたのデジタル習慣がどう機能しているか、そしてより意図的にするにはどうすればよいかを理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分のスクリーンパターンをより明確に把握し、注意力を取り戻す実践的な戦略を学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、自動的なデジタル行動を意識的な選択に変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、テクノロジーが注意力に何をしているかを認識し、より健全な習慣を築くよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、あなたのデジタル習慣がどう機能しているか、そしてより意図的にするにはどうすればよいかを理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、自動的なデジタル行動を意識的な選択と実践的なスキルに変えることです。",
      "このセクションでは{headline}の理解を深め、スクリーンパターンを認識してより健全なデジタルライフを築くためのツールを提供します。",
      "ここでは{headline}を扱い、テクノロジーが実際にあなたの注意力に何をしているかを見て、自分の条件で使えるようになることを目指します。",
    ],
  },
};

const HEALTHY_EATING_PSYCHOLOGY_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak yemekle ilişkinin nasıl şekillendiğini ve onu nasıl dönüştürebileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde yeme kalıplarını daha net görür ve pratik bir farkındalık becerisi öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; otomatik yeme davranışlarını bilinçli seçimlere dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, yemekle ilişkinde neler olduğunu fark etmeni ve daha şefkatli bir yaklaşım geliştirmeni sağlar.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak yemekle ilişkinin nasıl şekillendiğini ve onu nasıl dönüştürebileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, otomatik yeme davranışlarını fark edip bilinçli ve şefkatli seçimlere dönüştürmektir.",
      "Bu bölüm, {headline} konusunu derinleştirerek yeme kalıplarını tanıma ve yemekle daha sağlıklı bir ilişki kurma araçları sunar.",
      "{headline} burada ele alınır; böylece yemekle ilişkinde gerçekte neler olduğunu görebilir ve kendine daha nazik bir yaklaşım geliştirebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how your relationship with food is shaped and how to transform it.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your eating patterns and learn a practical awareness skill.",
      "This section deepens your understanding of {headline} through {subtitle}, turning automatic eating behaviors into conscious, compassionate choices.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what drives your eating and responding with more kindness.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how your relationship with food is shaped and how to transform it.",
      "Here the focus is {headline}. The goal is to turn automatic eating behaviors into conscious, compassionate choices.",
      "This section deepens your understanding of {headline}, giving you tools to recognize eating patterns and build a healthier relationship with food.",
      "{headline} is addressed here so you can see what is actually driving your eating and respond with more awareness and self-compassion.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解你与食物的关系是如何形成的以及如何转变它。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的进食模式并学到实用的觉察技能。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将自动化的进食行为转化为有意识的、有慈悲的选择。",
      "这里通过{subtitle}来讨论{headline}。课程引导你认识是什么驱动了你的进食并以更多善意来回应。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解你与食物的关系是如何形成的以及如何转变它。",
      "这里的重点是{headline}。目标是将自动化的进食行为转化为有意识的、有慈悲的选择。",
      "这一部分加深你对{headline}的理解，给你识别进食模式和建立更健康食物关系的工具。",
      "这里讨论{headline}，帮你看清是什么在驱动你的进食，并以更多觉察和自我慈悲来回应。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo se forma tu relación con la comida y cómo transformarla.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tus patrones alimentarios y aprendes una habilidad práctica de conciencia.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo comportamientos alimentarios automáticos en elecciones conscientes y compasivas.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer qué impulsa tu alimentación y responder con más amabilidad.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo se forma tu relación con la comida y cómo transformarla.",
      "Aquí el foco está en {headline}. El objetivo es convertir comportamientos alimentarios automáticos en elecciones conscientes y compasivas.",
      "Esta sección profundiza en {headline}, dándote herramientas para reconocer patrones alimentarios y construir una relación más saludable con la comida.",
      "Aquí se aborda {headline} para que puedas ver qué impulsa realmente tu alimentación y responder con más conciencia y autocompasión.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como sua relação com a comida se forma e como transformá-la.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara dos seus padrões alimentares e aprende uma habilidade prática de consciência.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando comportamentos alimentares automáticos em escolhas conscientes e compassivas.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que impulsiona sua alimentação e a responder com mais gentileza.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como sua relação com a comida se forma e como transformá-la.",
      "Aqui o foco é {headline}. O objetivo é transformar comportamentos alimentares automáticos em escolhas conscientes e compassivas.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo ferramentas para reconhecer padrões alimentares e construir uma relação mais saudável com a comida.",
      "Aqui, {headline} é abordado para que você possa ver o que realmente impulsiona sua alimentação e responder com mais consciência e autocompaixão.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie deine Beziehung zum Essen geformt wurde und wie du sie verändern kannst.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Essmuster und lernst eine praktische Bewusstseinsfähigkeit.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt automatische Essensverhalten in bewusste, mitfühlende Entscheidungen.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was dein Essen antreibt, und mit mehr Freundlichkeit zu reagieren.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie deine Beziehung zum Essen geformt wurde und wie du sie verändern kannst.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, automatische Essensverhalten in bewusste, mitfühlende Entscheidungen zu verwandeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Werkzeuge, um Essmuster zu erkennen und eine gesündere Beziehung zum Essen aufzubauen.",
      "{headline} wird hier behandelt, damit du sehen kannst, was dein Essen tatsächlich antreibt, und mit mehr Bewusstheit und Selbstmitgefühl reagieren kannst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment ta relation avec la nourriture s'est formée et comment la transformer.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de tes schémas alimentaires et apprends une compétence pratique de conscience.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant les comportements alimentaires automatiques en choix conscients et compatissants.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce qui motive ton alimentation et répondre avec plus de bienveillance.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment ta relation avec la nourriture s'est formée et comment la transformer.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de transformer les comportements alimentaires automatiques en choix conscients et compatissants.",
      "Cette section approfondit ta compréhension de {headline}, te donnant des outils pour reconnaître les schémas alimentaires et construire une relation plus saine avec la nourriture.",
      "Ici, {headline} est abordé pour que tu puisses voir ce qui motive réellement ton alimentation et répondre avec plus de conscience et d'autocompassion.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、あなたと食べ物の関係がどう形作られてきたか、そしてどう変えられるかを理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分の食事パターンをより明確に把握し、実践的な気づきのスキルを学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、自動的な食行動を意識的で思いやりのある選択に変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、何があなたの食事を駆動しているかを認識し、より優しく対応するよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、あなたと食べ物の関係がどう形作られてきたか、そしてどう変えられるかを理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、自動的な食行動を意識的で思いやりのある選択に変えることです。",
      "このセクションでは{headline}の理解を深め、食事パターンを認識して食べ物とのより健全な関係を築くためのツールを提供します。",
      "ここでは{headline}を扱い、何が実際にあなたの食事を駆動しているかを見て、より多くの気づきとセルフコンパッションを持って対応できるようにします。",
    ],
  },
};

const OVERCOMING_PROCRASTINATION_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak prokrastinasyonun nasıl çalıştığını ve onu aşmak için ne yapabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde kaçınma örüntülerini daha net görür ve harekete geçmek için pratik bir yol öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; erteleme dürtüsünü üzerine hareket edebileceğin bir farkındalığa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, seni yerinde tutan şeyi fark etmeni ve daha şefkatli, daha etkili bir yanıt pratiği geliştirmeni sağlar.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak prokrastinasyonun nasıl çalıştığını ve onu aşmak için ne yapabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, erteleme dürtüsünü net bir anlayışa ve pratik becerilere dönüştürmektir.",
      "Bu bölüm, {headline} konusunu derinleştirerek kaçınma örüntülerini tanıma ve harekete geçme araçları sunar.",
      "{headline} burada ele alınır; böylece seni yerinde tutan şeyi görebilir ve daha şefkatli, daha etkili bir yaklaşım geliştirebilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how procrastination works and what you can do to move past it.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your avoidance patterns and learn a practical way to take action.",
      "This section deepens your understanding of {headline} through {subtitle}, turning the urge to delay into awareness you can act on.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what keeps you stuck and practicing a kinder, more effective response.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how procrastination works and what you can do to move past it.",
      "Here the focus is {headline}. The goal is to turn the urge to delay into clear understanding and practical skills.",
      "This section deepens your understanding of {headline}, giving you tools to recognize avoidance patterns and take action with more confidence.",
      "{headline} is addressed here so you can see what keeps you stuck and practice a kinder, more effective way forward.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解拖延是如何运作的以及你可以做什么来克服它。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的逃避模式并学到采取行动的实用方法。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将延迟的冲动转化为可以付诸行动的觉察。",
      "这里通过{subtitle}来讨论{headline}。课程引导你识别是什么让你停滞，并练习更温和、更有效的回应。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解拖延是如何运作的以及你可以做什么来克服它。",
      "这里的重点是{headline}。目标是将延迟的冲动转化为清晰的理解和实用的技能。",
      "这一部分加深你对{headline}的理解，给你识别逃避模式和更自信地采取行动的工具。",
      "这里讨论{headline}，帮你看清是什么让你停滞，并练习更温和、更有效的前进方式。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo funciona la procrastinación y qué puedes hacer para superarla.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tus patrones de evitación y aprendes una forma práctica de actuar.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo el impulso de retrasar en conciencia sobre la que puedes actuar.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer qué te mantiene atascado y practicar una respuesta más amable y efectiva.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo funciona la procrastinación y qué puedes hacer para superarla.",
      "Aquí el foco está en {headline}. El objetivo es convertir el impulso de retrasar en comprensión clara y habilidades prácticas.",
      "Esta sección profundiza en {headline}, dándote herramientas para reconocer patrones de evitación y actuar con más confianza.",
      "Aquí se aborda {headline} para que puedas ver qué te mantiene atascado y practicar una forma más amable y efectiva de avanzar.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como a procrastinação funciona e o que pode fazer para superá-la.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara dos seus padrões de evitação e aprende uma forma prática de agir.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando o impulso de adiar em consciência sobre a qual você pode agir.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que te mantém preso e a praticar uma resposta mais gentil e eficaz.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como a procrastinação funciona e o que pode fazer para superá-la.",
      "Aqui o foco é {headline}. O objetivo é transformar o impulso de adiar em compreensão clara e habilidades práticas.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo ferramentas para reconhecer padrões de evitação e agir com mais confiança.",
      "Aqui, {headline} é abordado para que você possa ver o que te mantém preso e praticar uma forma mais gentil e eficaz de avançar.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie Prokrastination funktioniert und was du tun kannst, um sie zu überwinden.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Vermeidungsmuster und lernst einen praktischen Weg zu handeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt den Drang zu verzögern in Bewusstheit, nach der du handeln kannst.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was dich festhält, und eine freundlichere, effektivere Reaktion zu üben.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie Prokrastination funktioniert und was du tun kannst, um sie zu überwinden.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, den Drang zu verzögern in klares Verständnis und praktische Fähigkeiten zu verwandeln.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Werkzeuge, um Vermeidungsmuster zu erkennen und selbstbewusster zu handeln.",
      "{headline} wird hier behandelt, damit du sehen kannst, was dich festhält, und einen freundlicheren, effektiveren Weg nach vorn üben kannst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment la procrastination fonctionne et ce que tu peux faire pour la surmonter.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de tes schémas d'évitement et apprends une façon pratique d'agir.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant l'envie de reporter en conscience sur laquelle tu peux agir.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce qui te bloque et pratiquer une réponse plus bienveillante et efficace.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment la procrastination fonctionne et ce que tu peux faire pour la surmonter.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de transformer l'envie de reporter en compréhension claire et en compétences pratiques.",
      "Cette section approfondit ta compréhension de {headline}, te donnant des outils pour reconnaître les schémas d'évitement et agir avec plus de confiance.",
      "Ici, {headline} est abordé pour que tu puisses voir ce qui te bloque et pratiquer une façon plus bienveillante et efficace d'avancer.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、先延ばしがどう機能するのか、そしてそれを乗り越えるために何ができるかを理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分の回避パターンをより明確に把握し、行動を起こす実践的な方法を学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、遅らせたい衝動を行動できる気づきに変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、何があなたを停滞させているかを認識し、より優しく効果的な対応を練習するよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、先延ばしがどう機能するのか、そしてそれを乗り越えるために何ができるかを理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、遅らせたい衝動を明確な理解と実践的なスキルに変えることです。",
      "このセクションでは{headline}の理解を深め、回避パターンを認識してより自信を持って行動するためのツールを提供します。",
      "ここでは{headline}を扱い、何があなたを停滞させているかを見て、より優しく効果的な前進の仕方を練習できるようにします。",
    ],
  },
};

const LIVING_WITH_GRIEF_TEMPLATES: Record<Language, StepDescriptionTemplates> = {
  tr: {
    withSubtitle: [
      "Bu ders, {headline} konusunu {subtitle} üzerinden ele alarak yasın nasıl işlediğini ve bu süreçte kendine nasıl nazik davranabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. {subtitle} sayesinde yas deneyimini daha net görür ve iyileşme yolunda somut bir adım öğrenirsin.",
      "Bu bölüm, {headline} konusunu {subtitle} çerçevesinde derinleştirir; kaybın bıraktığı izleri fark edebileceğin ve onlarla barışabileceğin bir anlayışa dönüştürür.",
      "{headline} burada {subtitle} aracılığıyla ele alınır. Ders, yasınla ilgili neler olduğunu fark etmeni ve kendine daha şefkatli yaklaşmanı sağlar.",
    ],
    withoutSubtitle: [
      "Bu ders, {headline} konusunu ele alarak yasın nasıl işlediğini ve bu süreçte kendine nasıl nazik davranabileceğini anlamana yardımcı olur.",
      "Buradaki odak {headline}. Amaç, kaybın bıraktığı etkileri anlamak ve iyileşme için somut araçlar sunmaktır.",
      "Bu bölüm, {headline} konusunu derinleştirerek yas sürecinde seni destekleyen farkındalık ve pratik araçlar sunar.",
      "{headline} burada ele alınır; böylece yasınla ilgili gerçekte neler olduğunu görebilir ve kendinle daha nazik bir ilişki kurabilirsin.",
    ],
  },
  en: {
    withSubtitle: [
      "This lesson explores {headline} through {subtitle}, helping you understand how grief works and how to be gentle with yourself through the process.",
      "Here the focus is {headline}. By examining {subtitle}, you build a clearer picture of your grief experience and learn a concrete step toward healing.",
      "This section deepens your understanding of {headline} through {subtitle}, turning the weight of loss into awareness you can hold with more compassion.",
      "{headline} is addressed here through {subtitle}. The lesson guides you toward recognizing what grief is doing inside you and responding with kindness.",
    ],
    withoutSubtitle: [
      "This lesson explores {headline}, helping you understand how grief works and how to be gentle with yourself through the process.",
      "Here the focus is {headline}. The goal is to understand the effects of loss and offer concrete tools for healing.",
      "This section deepens your understanding of {headline}, giving you awareness and practical tools to support yourself through grief.",
      "{headline} is addressed here so you can see what grief is actually doing inside you and build a kinder relationship with yourself.",
    ],
  },
  zh: {
    withSubtitle: [
      "本节课通过{subtitle}来探索{headline}，帮助你理解悲伤是如何运作的以及如何在这个过程中温柔对待自己。",
      "这里的重点是{headline}。通过审视{subtitle}，你会更清晰地看到自己的悲伤体验并学到走向疗愈的具体步骤。",
      "这一部分通过{subtitle}加深你对{headline}的理解，将失去的重量转化为你可以用更多慈悲来承载的觉察。",
      "这里通过{subtitle}来讨论{headline}。课程引导你认识悲伤在你内在做了什么，并以善意来回应。",
    ],
    withoutSubtitle: [
      "本节课探索{headline}，帮助你理解悲伤是如何运作的以及如何在这个过程中温柔对待自己。",
      "这里的重点是{headline}。目标是理解失去的影响并提供疗愈的具体工具。",
      "这一部分加深你对{headline}的理解，给你在悲伤中支持自己的觉察和实用工具。",
      "这里讨论{headline}，帮你看清悲伤实际上在你内在做了什么，并与自己建立更温柔的关系。",
    ],
  },
  es: {
    withSubtitle: [
      "Esta lección explora {headline} a través de {subtitle}, ayudándote a comprender cómo funciona el duelo y cómo ser amable contigo mismo durante el proceso.",
      "Aquí el foco está en {headline}. Al examinar {subtitle}, construyes una imagen más clara de tu experiencia de duelo y aprendes un paso concreto hacia la sanación.",
      "Esta sección profundiza en {headline} a través de {subtitle}, convirtiendo el peso de la pérdida en conciencia que puedes sostener con más compasión.",
      "Aquí se aborda {headline} a través de {subtitle}. La lección te guía para reconocer lo que el duelo está haciendo dentro de ti y responder con amabilidad.",
    ],
    withoutSubtitle: [
      "Esta lección explora {headline}, ayudándote a comprender cómo funciona el duelo y cómo ser amable contigo mismo durante el proceso.",
      "Aquí el foco está en {headline}. El objetivo es comprender los efectos de la pérdida y ofrecer herramientas concretas para sanar.",
      "Esta sección profundiza en {headline}, dándote conciencia y herramientas prácticas para apoyarte durante el duelo.",
      "Aquí se aborda {headline} para que puedas ver lo que el duelo realmente está haciendo dentro de ti y construir una relación más amable contigo mismo.",
    ],
  },
  pt: {
    withSubtitle: [
      "Esta aula explora {headline} através de {subtitle}, ajudando você a entender como o luto funciona e como ser gentil consigo mesmo durante o processo.",
      "Aqui o foco é {headline}. Ao examinar {subtitle}, você constrói uma imagem mais clara da sua experiência de luto e aprende um passo concreto em direção à cura.",
      "Esta seção aprofunda sua compreensão de {headline} através de {subtitle}, transformando o peso da perda em consciência que você pode sustentar com mais compaixão.",
      "Aqui, {headline} é abordado através de {subtitle}. A aula guia você a reconhecer o que o luto está fazendo dentro de você e a responder com gentileza.",
    ],
    withoutSubtitle: [
      "Esta aula explora {headline}, ajudando você a entender como o luto funciona e como ser gentil consigo mesmo durante o processo.",
      "Aqui o foco é {headline}. O objetivo é compreender os efeitos da perda e oferecer ferramentas concretas para a cura.",
      "Esta seção aprofunda sua compreensão de {headline}, oferecendo consciência e ferramentas práticas para se apoiar durante o luto.",
      "Aqui, {headline} é abordado para que você possa ver o que o luto realmente está fazendo dentro de você e construir uma relação mais gentil consigo mesmo.",
    ],
  },
  de: {
    withSubtitle: [
      "Diese Lektion erkundet {headline} durch {subtitle} und hilft dir zu verstehen, wie Trauer funktioniert und wie du während des Prozesses sanft mit dir selbst umgehen kannst.",
      "Hier liegt der Fokus auf {headline}. Indem du {subtitle} untersuchst, gewinnst du ein klareres Bild deiner Trauererfahrung und lernst einen konkreten Schritt zur Heilung.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} durch {subtitle} und verwandelt das Gewicht des Verlusts in Bewusstheit, die du mit mehr Mitgefühl halten kannst.",
      "{headline} wird hier durch {subtitle} behandelt. Die Lektion leitet dich an, zu erkennen, was Trauer in dir bewirkt, und mit Freundlichkeit zu reagieren.",
    ],
    withoutSubtitle: [
      "Diese Lektion erkundet {headline} und hilft dir zu verstehen, wie Trauer funktioniert und wie du während des Prozesses sanft mit dir selbst umgehen kannst.",
      "Hier liegt der Fokus auf {headline}. Das Ziel ist, die Auswirkungen des Verlusts zu verstehen und konkrete Werkzeuge zur Heilung anzubieten.",
      "Dieser Abschnitt vertieft dein Verständnis von {headline} und gibt dir Bewusstheit und praktische Werkzeuge, um dich durch die Trauer zu unterstützen.",
      "{headline} wird hier behandelt, damit du sehen kannst, was Trauer tatsächlich in dir bewirkt, und eine freundlichere Beziehung zu dir selbst aufbauen kannst.",
    ],
  },
  fr: {
    withSubtitle: [
      "Cette leçon explore {headline} à travers {subtitle}, t'aidant à comprendre comment le deuil fonctionne et comment être doux avec toi-même pendant le processus.",
      "Ici, l'accent est mis sur {headline}. En examinant {subtitle}, tu construis une image plus claire de ton expérience de deuil et apprends un pas concret vers la guérison.",
      "Cette section approfondit ta compréhension de {headline} à travers {subtitle}, transformant le poids de la perte en conscience que tu peux porter avec plus de compassion.",
      "Ici, {headline} est abordé à travers {subtitle}. La leçon te guide pour reconnaître ce que le deuil fait en toi et répondre avec bienveillance.",
    ],
    withoutSubtitle: [
      "Cette leçon explore {headline}, t'aidant à comprendre comment le deuil fonctionne et comment être doux avec toi-même pendant le processus.",
      "Ici, l'accent est mis sur {headline}. L'objectif est de comprendre les effets de la perte et d'offrir des outils concrets pour guérir.",
      "Cette section approfondit ta compréhension de {headline}, te donnant conscience et outils pratiques pour te soutenir à travers le deuil.",
      "Ici, {headline} est abordé pour que tu puisses voir ce que le deuil fait réellement en toi et construire une relation plus douce avec toi-même.",
    ],
  },
  ja: {
    withSubtitle: [
      "このレッスンでは、{subtitle}を通して{headline}を探求し、悲嘆がどう機能するのか、そしてそのプロセスの中で自分に優しくする方法を理解する手助けをします。",
      "ここでの焦点は{headline}です。{subtitle}を検証することで、自分の悲嘆体験をより明確に把握し、癒しに向けた具体的な一歩を学びます。",
      "このセクションでは、{subtitle}を通じて{headline}の理解を深め、喪失の重さをより多くの慈悲を持って抱える気づきに変えます。",
      "ここでは{subtitle}を通じて{headline}を扱います。レッスンは、悲嘆があなたの内側で何をしているかを認識し、優しさを持って応答するよう導きます。",
    ],
    withoutSubtitle: [
      "このレッスンでは{headline}を探求し、悲嘆がどう機能するのか、そしてそのプロセスの中で自分に優しくする方法を理解する手助けをします。",
      "ここでの焦点は{headline}です。目標は、喪失の影響を理解し、癒しのための具体的なツールを提供することです。",
      "このセクションでは{headline}の理解を深め、悲嘆を通じて自分を支えるための気づきと実践的なツールを提供します。",
      "ここでは{headline}を扱い、悲嘆が実際にあなたの内側で何をしているかを見て、自分とのより優しい関係を築けるようにします。",
    ],
  },
};

const COURSE_TEMPLATES: Record<string, Record<Language, StepDescriptionTemplates>> = {
  spiritual_journey: STEP_DESCRIPTION_TEMPLATES,
  quit_smoking: QUIT_SMOKING_TEMPLATES,
  making_peace_with_anxiety: MAKING_PEACE_WITH_ANXIETY_TEMPLATES,
  anger_management: ANGER_MANAGEMENT_TEMPLATES,
  healthy_relationships: HEALTHY_RELATIONSHIPS_TEMPLATES,
  digital_detox: DIGITAL_DETOX_TEMPLATES,
  healthy_eating_psychology: HEALTHY_EATING_PSYCHOLOGY_TEMPLATES,
  overcoming_procrastination: OVERCOMING_PROCRASTINATION_TEMPLATES,
  living_with_grief: LIVING_WITH_GRIEF_TEMPLATES,
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
