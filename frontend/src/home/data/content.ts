export type Locale = 'pt' | 'en';

export const content = {
  pt: {
    nav: {
      home: 'Início',
      solutions: 'Recursos',
      data: 'Modelo de cálculo',
      about: 'Projeto',
      access: 'Acessar plataforma',
      login: 'Entrar',
      language: 'Idioma',
      menu: 'Abrir menu',
    },
    hero: {
      eyebrow: 'SUSTENTABILIDADE EM SOFTWARE',
      line1: 'Entendendo o hoje',
      line2: 'para um amanhã',
      line3: 'mais limpo.',
      description:
        'CPU, memória, disco e rede contam uma história. A EcoByteMetrics transforma essas métricas em estimativas de energia e emissão de carbono por serviço.',
      primary: 'Explorar dashboard',
      secondary: 'Entender o cálculo',
      metricLabel: 'CO₂e',
      metricValue: '0,072',
      metricUnit: 'g / 60 segundos',
      change: 'Exemplo de cálculo',
      changeCaption: 'Energia × intensidade de carbono',
      metricFormula: '0,000848 kWh × 85 gCO₂e/kWh',
      metricNote:
        'Exemplo da atividade: 50,87 W durante 60 segundos. Não representa uma coleta real.',
    },
    solutions: {
      eyebrow: 'DO RECURSO AO IMPACTO',
      title1: 'Tecnologia e dados',
      title2: 'para medir o impacto.',
      description: 'Entenda o consumo dos serviços e como a região de execução influencia suas emissões.',
      cards: [
        {
          title: 'Métricas por serviço',
          body: 'CPU, RAM, disco e rede como ponto de partida para estimar energia.',
        },
        {
          title: 'Histórico e comparação',
          body: 'Compare serviços e acompanhe a evolução do consumo entre coletas.',
        },
        {
          title: 'Emissão de carbono',
          body: 'Relacione energia estimada à intensidade de carbono de cada região.',
        },
        {
          title: 'Monitoramento dinâmico',
          body: 'Identifique serviços novos, removidos ou indisponíveis ao longo da execução.',
        },
      ],
    },
    footer: {
      phrase: 'JUNTOS POR UM PLANETA MAIS VERDE',
      linkLabel: 'Acompanhe o projeto no GitHub',
    },
  },
  en: {
    nav: {
      home: 'Home',
      solutions: 'Features',
      data: 'Calculation model',
      about: 'Project',
      access: 'Access platform',
      login: 'Sign in',
      language: 'Language',
      menu: 'Open menu',
    },
    hero: {
      eyebrow: 'SUSTAINABILITY IN SOFTWARE',
      line1: 'Understanding today',
      line2: 'for a cleaner',
      line3: 'tomorrow.',
      description:
        'CPU, memory, disk and network tell a story. EcoByteMetrics turns these metrics into estimates of energy use and carbon emissions for each service.',
      primary: 'Open dashboard',
      secondary: 'Understand the calculation',
      metricLabel: 'CO₂e',
      metricValue: '0.072',
      metricUnit: 'g / 60 seconds',
      change: 'Calculation example',
      changeCaption: 'Energy × carbon intensity',
      metricFormula: '0.000848 kWh × 85 gCO₂e/kWh',
      metricNote:
        'Assignment example: 50.87 W over 60 seconds. This is not a live measurement.',
    },
    solutions: {
      eyebrow: 'FROM RESOURCE TO IMPACT',
      title1: 'Technology and data',
      title2: 'to measure the impact.',
      description: 'Understand service energy use and how the hosting region affects emissions.',
      cards: [
        {
          title: 'Service metrics',
          body: 'CPU, RAM, disk and network as the starting point for estimating energy.',
        },
        {
          title: 'History and comparison',
          body: 'Compare services and track changes in energy use across collections.',
        },
        {
          title: 'Carbon emissions',
          body: 'Combine estimated energy with the carbon intensity of each region.',
        },
        {
          title: 'Dynamic monitoring',
          body: 'Identify new, removed or unavailable services during execution.',
        },
      ],
    },
    footer: {
      phrase: 'TOGETHER FOR A GREENER PLANET',
      linkLabel: 'Follow the project on GitHub',
    },
  },
} as const;
