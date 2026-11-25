# Metodologia de estimativa de energia e emissões

O modelo atribuído à UniLaunch no material da auditoria soma as potências estimadas de CPU, RAM, disco e rede. A potência em W multiplicada pela duração em horas e dividida por 1.000 produz kWh. O produto de kWh pela intensidade em gCO₂e/kWh produz gCO₂e. Para apresentar kgCO₂e, divida os gramas por 1.000. São estimativas de impacto operacional a partir da telemetria disponível.

| Componente | Entrada | Exemplo UniLaunch | Implementação |
|---|---|---|---|
| CPU | Utilização em %, dividida por 100 | 100 W de referência | 120 W de referência |
| RAM | GB | 0,375 W/GB | 0,375 W/GB |
| Disco | GB | 0,01 W/GB | 0,01 W/GB |
| Rede | GB | 0,02 W/GB | 0,02 W/GB |

Com CPU a 50%, RAM de 2 GB, disco de 10 GB, rede de 1 GB, duração de 60 s e intensidade de 85 gCO₂e/kWh, o exemplo oficial fornecido resulta em 50,87 W, aproximadamente 0,0008495 kWh com arredondamento intermediário e 0,072 gCO₂e. Sem arredondamento intermediário, a energia é 0,000847833 kWh e a emissão 0,072065833 gCO₂e.

Com o fator usado no software, os mesmos dados resultam em 60,87 W, 0,0010145 kWh e 0,0862325 gCO₂e. Em código, a energia equivale a `potência_W × intervalo_s / 3_600_000`. O intervalo nominal de polling é 30 s, enquanto a estimativa por leitura usa a duração positiva informada pela origem. A diferença de 120 W contra 100 W permanece. A fonte primária necessária para confirmar se 100 W é obrigatório, ou se é apenas o valor ilustrativo, não foi fornecida. Consulte a UniLaunch antes de mudar fatores.

## Caminhos de cálculo

- [Monitoramento SQL](../backend/src/modules/Monitoring/monitoring.repository.ts) calcula por amostra e agrupa janelas quando necessário. A intensidade capturada acompanha a métrica. Leituras com fator ausente permanecem com energia disponível e CO₂e desconhecido. O zero é um fator válido.
- [Estatísticas SQL](../backend/src/modules/Statistics/statistics.repository.ts) usa os mesmos coeficientes e cálculos próprios de janela e agregação por rota. Compare a cobertura e o recorte antes de confrontar resultados com outro endpoint, em especial coletas sem intensidade.
- [Dashboard em memória](../backend/src/modules/Dashboard/dashboard.service.ts) aplica os mesmos coeficientes, mas usa as amostras em memória e as regras próprias de cobertura do ranking.
- [Apresentação no frontend](../frontend/src/features/monitoring/domain/intervalImpact.ts) trabalha com os valores fornecidos pela API. As telas podem somar amostras e aplicar filtros e formatação. O arredondamento visual pode fazer o total exibido diferir da soma dos valores já formatados.

As somas representam as amostras disponíveis no recorte. Falhas de coleta, ausência de fator e armazenamento de dados legados podem reduzir a cobertura. Consulte [histórico](../backend/docs/HISTORY.md) para recuperação temporal e limites, [testes de dashboard](../backend/tests/dashboard.contract.test.ts) para contratos e [testes de monitoramento SQL](../backend/tests/integration/monitoring.postgres.test.ts) para históricos com PostgreSQL. O modelo não incorpora medições físicas por servidor, PUE ou emissões de fabricação.
