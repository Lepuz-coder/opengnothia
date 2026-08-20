import type { SchoolQuizTexts } from "./index";

export const ptSchoolQuiz: SchoolQuizTexts = {
  title: "A abordagem com a sua cara",
  intro:
    "Algumas perguntas para encontrar a abordagem terapêutica que mais combina com você. Não há respostas certas ou erradas — escolha o que fizer sentido para você.",
  progress: "Pergunta {current}/{total}",
  resultTitle: "Nossa sugestão para você",
  resultWhyTitle: "Por que esta abordagem?",
  retakeButton: "Refazer o questionário",
  takeButton: "Fazer o questionário",
  noSchoolLabel: "Ainda não escolhida",
  questions: {
    hardDay: {
      text: "Depois de um dia difícil, o que vem primeiro para você?",
      options: {
        analyze: "Sentar e destrinchar passo a passo o que aconteceu",
        lookBack: "Me perguntar do que esse sentimento me faz lembrar",
        turnInward: "Parar, respirar e me voltar para dentro",
        control: "Me perguntar: “o que está realmente nas minhas mãos agora?”",
        depends: "Depende — às vezes uma coisa, às vezes outra",
      },
    },
    rootCause: {
      text: "De onde você acha que vêm principalmente as suas dificuldades de hoje?",
      options: {
        thoughts: "Dos meus hábitos de pensamento — do significado que dou às coisas",
        past: "Do meu passado — antigas relações e vivências ainda em cena hoje",
        childhood: "Dos padrões de “eu sou assim” que aprendi na infância",
        howToLive: "Mais do que procurar a causa, quero aprender a viver com elas",
      },
    },
    hardEmotion: {
      text: "Quando chega uma emoção difícil, o que você gostaria de fazer com ela?",
      options: {
        test: "Encontrar o pensamento que a disparou e colocá-lo à prova",
        carry: "Aprender a levá-la comigo em vez de lutar contra ela",
        calm: "Recebê-la com serenidade — balançar sem virar",
        underneath: "Entender o que está se mexendo lá no fundo",
        refuge: "Me refugiar na respiração, na oração ou no silêncio",
      },
    },
    missing: {
      text: "O que mais está faltando na sua vida ultimamente?",
      options: {
        quietMind: "Uma mente calma — uma pausa dos pensamentos em círculo",
        meaning: "A sensação de que o que eu faço tem significado",
        selfPeace: "Fazer as pazes comigo — as feridas antigas baixarem o volume",
        balance: "Um equilíbrio interior que não balança fácil",
      },
    },
    guide: {
      text: "Como você gostaria que fosse quem caminha ao seu lado?",
      options: {
        structured: "Alguém estruturado, com ferramentas concretas e pequenos experimentos",
        digger: "Alguém que faz perguntas profundas e escava a minha história comigo",
        sage: "Alguém sábio e sereno, com uma filosofia de vida madura",
        flexible: "Alguém flexível, que usa o que eu precisar no momento",
        accepting: "Alguém que me aceita como sou e me encoraja na direção dos meus valores",
      },
    },
    faith: {
      text: "Que lugar a espiritualidade ou a fé ocupa na sua vida?",
      options: {
        central: "Um lugar central — é uma das línguas maternas do meu mundo interior",
        sometimes: "Uma fonte à qual volto de vez em quando; me faz bem",
        notReally: "Pouco — uma linguagem mais concreta e terrena me serve melhor",
        bigQuestions: "Fé à parte, as grandes perguntas da vida ocupam muito a minha cabeça",
      },
    },
    changeStyle: {
      text: "Quando você quer mudar algo, qual caminho parece mais natural?",
      options: {
        experiment: "Fazer pequenos experimentos e olhar os resultados",
        resistance: "Primeiro entender o que resiste dentro de mim",
        values: "Clarear o que importa para mim e caminhar até lá em passos pequenos",
        tryPaths: "Experimentar vários caminhos; largar o que não funciona e seguir para o próximo",
      },
    },
    familiar: {
      text: "Qual frase soa mais familiar para você?",
      options: {
        worstCase: "“Minha cabeça sempre corre para o pior cenário.”",
        notEnough: "“Faça o que eu fizer, tem uma voz aqui dentro dizendo que não sou suficiente.”",
        emptiness: "“Está tudo aparentemente bem, mas existe um vazio dentro de mim.”",
        samePlay: "“Vivo a mesma história com pessoas diferentes.”",
        uncontrollable: "“O que foge do meu controle me esgota.”",
      },
    },
    bestMoments: {
      text: "Pense nos momentos em que você se sente melhor — o que costuma estar presente?",
      options: {
        clarity: "Resolvi um problema e a cabeça está limpa",
        serving: "Estou contribuindo para algo maior do que eu",
        presence: "Estou em contato com a natureza, o silêncio ou o meu interior",
        livedValues: "Dei tempo ao que importa para mim, desse no que desse",
        composure: "Mantive o leme mesmo no meio da tempestade",
      },
    },
    innerCritic: {
      text: "Como fala com você o seu crítico interior (“não chega”, “você falhou”)?",
      options: {
        oldVoice: "Com dureza — e o tom vem de um lugar antigo que me é muito familiar",
        reason: "Ele se faz ouvir, mas amolece quando mostro provas",
        defuse: "Consigo vê-lo como “apenas um pensamento” e ganhar distância",
        external: "Mais do que a voz interior, o que me esgota é o barulho do mundo lá fora",
      },
    },
  },
  reasons: {
    integrative:
      "Suas respostas não apontam para um único método, mas para necessidades que mudam com a situação. A abordagem integrativa reúne as ferramentas de várias escolas em um acompanhante coerente — feita para quem valoriza a flexibilidade.",
    psychodynamic:
      "Nas suas respostas se destaca a tendência de entender o presente olhando o passado e seus padrões repetidos. É exatamente isso que a abordagem psicodinâmica faz: seguir com você o rastro das antigas relações e vivências no seu hoje.",
    cbt: "Suas respostas mostram afinidade com o trabalho sobre os pensamentos — entender, testar, remodelar. A TCC ensina você a transformar os ciclos pensamento-emoção com ferramentas concretas e pequenos experimentos.",
    logotherapy:
      "Nas suas respostas sobressai a busca de sentido: sensação de vazio, grandes perguntas, vontade de servir a algo. A logoterapia trabalha exatamente nessa veia — tornar até a dor suportável através do sentido.",
    act: "Suas respostas se inclinam para dar espaço às emoções em vez de lutar contra elas, e caminhar na direção dos seus valores. A ACT desenvolve essa flexibilidade de forma sistemática: aceitação, desfusão e pequenos passos guiados por valores.",
    schema:
      "Suas respostas trazem marcas de padrões de “eu sou assim” da infância e de um crítico interior familiar. A terapia do esquema reconhece esses padrões antigos e os transforma pela raiz.",
    stoic:
      "Separar o que depende de você do que não depende, e buscar um equilíbrio interior inabalável, se destacam nas suas respostas. O acompanhamento estoico treina exatamente esse músculo: a dicotomia do controle, a prática da virtude e a serenidade.",
    spiritual:
      "O recolhimento, o silêncio e a espiritualidade têm um lugar claro nas suas respostas. A orientação espiritual coloca essa fonte no centro — você avança com práticas de presença e paz interior a partir da sua própria tradição.",
  },
};
