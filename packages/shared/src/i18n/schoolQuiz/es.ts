import type { SchoolQuizTexts } from "./index";

export const esSchoolQuiz: SchoolQuizTexts = {
  title: "Tu enfoque a medida",
  intro:
    "Unas pocas preguntas para encontrar el enfoque terapéutico que mejor encaja contigo. No hay respuestas correctas ni incorrectas — elige lo que te resuene.",
  progress: "Pregunta {current}/{total}",
  resultTitle: "Nuestra sugerencia para ti",
  resultWhyTitle: "¿Por qué este enfoque?",
  retakeButton: "Repetir el cuestionario",
  takeButton: "Hacer el cuestionario",
  noSchoolLabel: "Aún sin elegir",
  questions: {
    hardDay: {
      text: "Después de un día difícil, ¿qué te sale primero?",
      options: {
        analyze: "Sentarme y desmenuzar paso a paso lo que pasó",
        lookBack: "Preguntarme a qué me recuerda este sentimiento",
        turnInward: "Parar, respirar y volverme hacia dentro",
        control: "Preguntarme: «¿qué está realmente en mis manos ahora?»",
        depends: "Depende — a veces una cosa, a veces otra",
      },
    },
    rootCause: {
      text: "¿De dónde crees que vienen sobre todo tus dificultades actuales?",
      options: {
        thoughts: "De mis hábitos de pensamiento — del significado que doy a las cosas",
        past: "De mi pasado — viejas relaciones y vivencias siguen hoy en escena",
        childhood: "De los patrones de «yo soy así» que aprendí en la infancia",
        howToLive: "Más que buscar la causa, me importa aprender a vivir con ellas",
      },
    },
    hardEmotion: {
      text: "Cuando llega una emoción difícil, ¿qué te gustaría hacer con ella?",
      options: {
        test: "Encontrar el pensamiento que la disparó y ponerlo a prueba",
        carry: "Aprender a llevarla conmigo en vez de pelear contra ella",
        calm: "Recibirla con serenidad — mecerme sin volcar",
        underneath: "Entender qué se mueve por debajo",
        refuge: "Refugiarme en la respiración, la oración o el silencio",
      },
    },
    missing: {
      text: "¿Qué es lo que más echas en falta en tu vida últimamente?",
      options: {
        quietMind: "Una mente en calma — un descanso de los pensamientos en bucle",
        meaning: "La sensación de que lo que hago tiene sentido",
        selfPeace: "Hacer las paces conmigo — que las viejas heridas bajen el volumen",
        balance: "Un equilibrio interior que no se tambalee fácilmente",
      },
    },
    guide: {
      text: "¿Cómo querrías que fuera quien te acompañe?",
      options: {
        structured: "Alguien estructurado, con herramientas concretas y pequeños experimentos",
        digger: "Alguien que haga preguntas profundas y excave mi historia conmigo",
        sage: "Alguien sabio y sereno, con una filosofía de vida asentada",
        flexible: "Alguien flexible, que use lo que necesito en cada momento",
        accepting: "Alguien que me acepte como soy y me anime hacia mis valores",
      },
    },
    faith: {
      text: "¿Qué lugar ocupan la espiritualidad o la fe en tu vida?",
      options: {
        central: "Uno central — es una de las lenguas maternas de mi mundo interior",
        sometimes: "Una fuente a la que vuelvo de vez en cuando; me hace bien",
        notReally: "Poco — me va mejor un lenguaje más concreto y terrenal",
        bigQuestions: "Fe aparte, las grandes preguntas de la vida ocupan mucho mi mente",
      },
    },
    changeStyle: {
      text: "Cuando quieres cambiar algo, ¿qué camino te resulta más natural?",
      options: {
        experiment: "Hacer pequeños experimentos y mirar los resultados",
        resistance: "Entender primero qué se resiste dentro de mí",
        values: "Aclarar qué me importa y caminar hacia allí con pasos pequeños",
        tryPaths: "Probar varios caminos; soltar lo que no funciona y pasar al siguiente",
      },
    },
    familiar: {
      text: "¿Qué frase te suena más familiar?",
      options: {
        worstCase: "«Mi mente siempre corre al peor escenario.»",
        notEnough: "«Haga lo que haga, una voz dentro dice que no soy suficiente.»",
        emptiness: "«Todo parece ir bien, pero hay un vacío dentro de mí.»",
        samePlay: "«Vivo la misma historia con personas distintas.»",
        uncontrollable: "«Lo que escapa a mi control me agota.»",
      },
    },
    bestMoments: {
      text: "Piensa en los momentos en que te sientes mejor — ¿qué suele haber?",
      options: {
        clarity: "He resuelto un problema y tengo la mente despejada",
        serving: "Estoy aportando a algo más grande que yo",
        presence: "Estoy en contacto con la naturaleza, el silencio o mi interior",
        livedValues: "He dedicado tiempo a lo que me importa, salga como salga",
        composure: "He mantenido el timón incluso en medio de la tormenta",
      },
    },
    innerCritic: {
      text: "¿Cómo te habla tu crítico interior («no basta», «fallaste»)?",
      options: {
        oldVoice: "Con dureza — y su tono viene de un lugar antiguo que me es muy familiar",
        reason: "Se hace oír, pero se ablanda cuando le muestro pruebas",
        defuse: "Puedo verlo como «solo un pensamiento» y tomar distancia",
        external: "Más que mi voz interior, me agota el ruido del mundo de fuera",
      },
    },
  },
  reasons: {
    integrative:
      "Tus respuestas no apuntan a un único método, sino a necesidades que cambian según la situación. El enfoque integrador reúne las herramientas de distintas escuelas en un acompañante coherente — hecho para quienes valoran la flexibilidad.",
    psychodynamic:
      "En tus respuestas destaca la tendencia a entender el presente mirando al pasado y sus patrones repetidos. Eso es justo lo que hace el enfoque psicodinámico: seguir contigo la huella de viejas relaciones y vivencias en tu hoy.",
    cbt: "Tus respuestas muestran afinidad por trabajar con los pensamientos — entenderlos, ponerlos a prueba, remodelarlos. La TCC te enseña a transformar los bucles pensamiento-emoción con herramientas concretas y pequeños experimentos.",
    logotherapy:
      "En tus respuestas resalta la búsqueda de sentido: sensación de vacío, grandes preguntas, ganas de servir a algo. La logoterapia trabaja justo en esa veta — busca hacer soportable incluso el dolor a través del sentido.",
    act: "Tus respuestas se inclinan por hacer sitio a las emociones en vez de pelear con ellas, y caminar hacia tus valores. ACT desarrolla esa flexibilidad de forma sistemática: aceptación, defusión y pequeños pasos guiados por valores.",
    schema:
      "Tus respuestas llevan la huella de patrones de «yo soy así» de la infancia y de un crítico interior familiar. La terapia de esquemas reconoce esos viejos patrones y los transforma desde la raíz.",
    stoic:
      "Separar lo que depende de ti de lo que no, y buscar un equilibrio interior inquebrantable, destacan en tus respuestas. El acompañamiento estoico entrena justo ese músculo: la dicotomía del control, la práctica de la virtud y la serenidad.",
    spiritual:
      "El recogimiento, el silencio y la espiritualidad ocupan un lugar claro en tus respuestas. La guía espiritual pone esa fuente en el centro — avanzas con prácticas de presencia y paz interior desde tu propia tradición.",
  },
};
