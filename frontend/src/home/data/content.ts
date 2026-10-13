

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
} as const;
