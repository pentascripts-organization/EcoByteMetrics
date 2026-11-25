# 📄 Sprint Review — Sprint 3

**Projeto** EcoByteMetrics (GreenER) · PentaScripts · FATEC Jacareí e UniLaunch <br>
**Período planejado** 10/11 a 23/11/2026 <br>
**Referência auditada** [main em 29e58c5](https://github.com/pentascripts-organization/EcoByteMetrics/commit/29e58c5bd05d42764851420367f918f14b440197), consultada em 25/11/2026

## Demonstração e objetivo

A demonstração [EcoByteMetrics Sprint 3](https://youtu.be/-J-_2v4ASvk) está publicada no canal PentaScript. O título e o canal foram confirmados pelo oEmbed do YouTube. A meta planejada incluiu visualização geográfica, comparação de impacto e consolidação do MVP containerizado.

## Escopo planejado e executado

| História | Tarefas e condições de aceite verificáveis | Entrega e lacuna |
|---|---|---|
| [US07 · #10](https://github.com/pentascripts-organization/EcoByteMetrics/issues/10) | Posicionar serviços, abrir informações do marcador, permitir navegação e tolerar coordenadas ausentes. [Tarefas de mapa e coordenadas](../../plano-de-entregas.md#3-user-stories-e-situação-de-entrega) | Globo, seleção e fallback por lista. A issue está fechada. Homologação com dados da origem e WebGL real ainda pendente. [PR #151](https://github.com/pentascripts-organization/EcoByteMetrics/pull/151) · [PR #144](https://github.com/pentascripts-organization/EcoByteMetrics/pull/144) |
| [US08 · #11](https://github.com/pentascripts-organization/EcoByteMetrics/issues/11) | Comparar serviços numa janela comum e conferir tabela, gráfico e Compose. A [issue #127](https://github.com/pentascripts-organization/EcoByteMetrics/issues/127) inclui MVP responsivo validado, Review e vídeo. | Comparador, endpoint SQL e Compose disponíveis na referência. A história e a tarefa de fechamento continuam abertas. [PR #140](https://github.com/pentascripts-organization/EcoByteMetrics/pull/140) · [PR #142](https://github.com/pentascripts-organization/EcoByteMetrics/pull/142) · [PR #154](https://github.com/pentascripts-organization/EcoByteMetrics/pull/154) |
| [US09 · #128](https://github.com/pentascripts-organization/EcoByteMetrics/issues/128) | Consolidar observabilidade, sinalização, relatórios e otimização. A [issue #129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129) exige exportação autenticada. | Badges e runbook integrados. Exportação segue aberta e falta comprovar retenção controlada e desempenho em carga representativa. [PR #158](https://github.com/pentascripts-organization/EcoByteMetrics/pull/158) · [PR #138](https://github.com/pentascripts-organization/EcoByteMetrics/pull/138) |

O [PR #161](https://github.com/pentascripts-organization/EcoByteMetrics/pull/161) integrou a Sprint 3 na main em 24/11, após o encerramento planejado em 23/11. A correção de volume entrou em 23/11 no horário de Brasília. A estabilização do teste da Evolução e o ajuste de perfil na Administração entraram em 24/11. Consulte a cronologia no [plano](../../plano-de-entregas.md).

## Funcionalidades do MVP

- Descoberta e coletas periódicas com estados por serviço. Visão geral, detalhes, filtros, ranking e atualização pela API.
- Globo com marcadores quando disponíveis, histórico persistido, Evolução, comparação de última leitura ou por período e indicação de cobertura incompleta.
- Login, cadastro de `USER`, sessão JWT e edição da conta. `ADMIN` tem cartões de configuração somente leitura e serviços monitorados. `USER` tem a área **Sua conta**.
- Execução em Compose, PostgreSQL com SQL explícito e migrations na inicialização.

## Evolução desde a Sprint 1

A base de polling, infraestrutura e interface da [Sprint 1](../sprint-1/sprint-1.md) recebeu estimativas, persistência, resiliência e autenticação na [Sprint 2](../sprint-2/sprint-2.md). A Sprint 3 acrescentou comparação, globo, Administração e correção de volume. O [quadro de evolução](../../auditoria-final.md#evolução-em-relação-à-sprint-1) registra os 12 critérios destacados e a qualidade das evidências disponíveis.

## Requisitos e rubrica

A [matriz](../../rastreabilidade.md) cobre 15 requisitos funcionais, cinco não funcionais, sete restrições e 23 critérios. As tecnologias, o uso de SQL explícito, o JWT e o smoke do Compose têm evidências verificadas no respectivo escopo. Os fluxos de coleta, mapa, histórico e comparação precisam de homologação com fontes reais. Os fatores ambientais, a documentação reprodutível e a gestão acadêmica ainda têm comprovação parcial. Os pesos seguem a edição de 29/09/2026 reproduzida no pedido e aguardam confirmação docente.

## Validação técnica

Nesta auditoria, build e 47 testes de backend passaram. No frontend, lint, build e 230 unitários passaram. Em Chromium, 67 testes passaram e cinco foram pulados pelo conjunto. As suítes cobrem autenticação, comparação, estados de falha e layouts com dados controlados. A configuração do Compose foi validada localmente. O Docker Engine estava indisponível para subida e teste real de persistência. As três execuções históricas do GitHub Actions na referência passaram. O smoke confirmou HTTP e proxy em CI com endpoints externos inativos de propósito. Consulte [resultados e limites](../../auditoria-final.md#validação).

## Participação individual

Alef Gabriel de Oliveira entregou comparação, monitoramento e Administração. Vinicius Guin contribuiu com documentação e tratamento de coordenadas ausentes. Cauã Isaque trabalhou na janela de comparação e na correção do volume. Thiago implementou a comparação SQL e o provisionamento inicial. Enzo Suzuki produziu o runbook e consta na padronização de ambiente. A [matriz de participação](../../plano-de-entregas.md#4-participação-individual-verificável) vincula perfis, issues e PRs por pessoa.

## Burndown

Os relatórios anteriores incluem seus burndowns. A [visão Backlog do Project](https://github.com/orgs/pentascripts-organization/projects/2/views/1), filtrada por Sprint 3, exibia 26 cartões em 25/11, com 23 em Done, dois em Backlog e um em In progress. Havia estimativa no campo Estimate de 22 cartões. O gráfico de burndown disponível no Project está configurado para a Sprint 1. O estado atual e as datas de fechamento mais recentes permitem reconstruir a contagem abaixo. Para um burndown de pontos, ainda faltam a baseline e a série de alterações de estimativas, inclusões e reaberturas.

| Data em Brasília | Cartões fechados no dia | Total acumulado da amostra |
|---|---:|---:|
| 13/11 | 2 | 2 |
| 14/11 | 1 | 3 |
| 16/11 | 2 | 5 |
| 17/11 | 1 | 6 |
| 19/11 | 7 | 13 |
| 20/11 | 3 | 16 |
| 21/11 | 1 | 17 |
| 22/11 | 1 | 18 |
| 23/11 | 2 | 20 |
| 24/11 | 3 | 23 |

A contagem usa o campo de fechamento dos cartões hoje fechados na visão filtrada. A [issue #129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129) segue aberta no repositório e está fora dos 26 cartões dessa visão. US07 aparece fechada e US08, US09 e #127 aparecem abertas. Os merges #154, #160 e #161 complementam a cronologia de integração.

## Feedback de Review e retrospectiva

A inspeção encontrou o vídeo publicado, a entrega de runbook no [PR #138](https://github.com/pentascripts-organization/EcoByteMetrics/pull/138) e correções registradas nos PRs. A estabilização da linha do tempo e o reparo de volume são ocorrências técnicas documentadas. Feedback de professores ou cliente, ata de Review e decisões coletivas de retrospectiva permanecem pendentes de confirmação pela equipe.

## Pendências e conclusão

O MVP foi integrado na main com comparação, histórico e Administração. Exportação CSV/JSON permanece como compromisso da US09. Gestão completa de usuários, controle de coleta pela interface e simulação geográfica permanecem indisponíveis. O fechamento acadêmico depende de confirmar a versão da rubrica, a data e a referência de entrega, os fatores ambientais, o escopo adicional e as evidências de participação e feedback. A [auditoria](../../auditoria-final.md#encaminhamentos) registra os responsáveis por frente e os procedimentos de homologação pendentes.
