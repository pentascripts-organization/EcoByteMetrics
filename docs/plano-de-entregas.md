# 📅 Plano de Entregas e Matriz de Rastreabilidade

**Projeto:** EcoByteMetrics (GreenER) <br>
**Organização:** Pentascripts <br>
**Repositório Oficial:** [https://github.com/pentascripts-organization/EcoByteMetrics](https://github.com/pentascripts-organization/EcoByteMetrics) <br>

---

## 🎯 1. Escopo Geral do Projeto & Objetivos por Sprint

### 💡 Objetivo Geral do Produto
Desenvolver a plataforma web containerizada **GreenER** para monitoramento contínuo de microsserviços, estimativa de consumo energético em quilowatt-hora (kWh) e cálculo aproximado da pegada de carbono em dióxido de carbono equivalente (gCO₂e), utilizando PostgreSQL nativo sem ORM e orquestração Docker.

### 🗓️ Objetivos Específicos das Sprints
* **Sprint 1 (Fundação, Polling e Interface Base):** Estabelecer a infraestrutura containerizada via Docker Compose, criar o esquema nativo em SQL (`DDL.sql`), estruturar a interface responsiva em React + TS com suporte à localização e desenvolver o backend em Node.js + TS com o serviço de polling para descoberta (`/services`) e coleta de métricas (`/metrics`).
* **Sprint 2 (Motor Ambiental, Dashboard e Segurança):** Implementar o motor de cálculo ambiental (kWh e gCO₂e), persistência temporal em DML, Dashboard operacional com ordenação por ranking de impacto, tratamento de resiliência a falhas e autenticação JWT.
* **Sprint 3 (Geolocalização em Mapa, Comparador e MVP Final):** Desenvolver a visualização geográfica dos microsserviços em mapa interativo, o módulo comparador de eficiência ambiental entre aplicações e a consolidação do MVP containerizado final.

---

### 👥 2. Matriz de Participação e Contribuição Individual (Sprint 2)

A tabela a seguir apresenta a matriz atualizada registrada para a Sprint 2. As atribuições históricas abaixo devem ser lidas com as evidências da Sprint Review 2:

| Integrante | Papel Scrum / Frente | Tarefas Concluídas na Sprint 2 |
| :--- | :--- | :--- |
| **Alef** | Dev Team (Frontend / State) | • **#26** Painel Operacional em React com Métrica e Estado<br>• **#99** Validação do dashboard e do ranking<br>• **#100** Validação da atualização e dos estados da tela |
| **Cauã** | Product Owner / Dev Backend | • **#38** Rota de Login e Emissão de Token JWT<br>• **#39** Middleware de Proteção JWT no Backend<br>• **#40** Tratamento de Segurança e Criptografia de Credenciais<br>• **#80** Módulo de Autenticação e Geração de Token JWT no Backend |
| **Enzo** | Dev Team (Frontend) | • **#27** API de Indicadores Consolidados e Ranking<br>• **#28** Ordenação e Ranking de Serviços por Maior Impacto<br>• **#101** Validação do contrato das rotas do dashboard<br>• **#102** Validação de falhas e recuperação das APIs auxiliares |
| **Thiago** | Dev Team (Backend / DB) | • **#29** Integração com o Serviço de Intensidade de Carbono<br>• **#30** Lógica de Cálculo de Consumo Energético e (CO_2e)<br>• **#31** Consolidação de Indicadores Agregados<br>• **#32** Persistência do Histórico de Coletas (DML PostgreSQL)<br>• **#37** Modelagem e Tabela de Usuários no PostgreSQL (DDL/DML) |
| **Vinicius** | Scrum Master / Dev Infra | • **Doc** Documentação reformulação após sprint-1<br>• **#33** Tratamento da Variação de Métricas a Cada Requisição<br>• **#34** Detecção de Indisponibilidade de Serviços<br>• **#35** Detecção de Ausência de Métricas em Serviços Ativos<br>• **#36** Middleware e Resiliência contra Quedas de APIs Auxiliares |

---

## 3. User Stories e situação de entrega

As datas planejadas permanecem no README. O [Project PentaScripts-DSM-2](https://github.com/orgs/pentascripts-organization/projects/2/views/1) registra três iterações e oferece uma [visão de prioridades](https://github.com/orgs/pentascripts-organization/projects/2/views/2). A coluna de verificação sintetiza as entregas e condições observáveis. Os critérios originais permanecem nas issues. O estado da issue foi consultado em 25/11/2026 e pode divergir da existência de implementação.

| Sprint e história | Requisitos | Entrega, dependência e verificação | Situação e evidência |
|---|---|---|---|
| 1 · US00 · [issue #2](https://github.com/pentascripts-organization/EcoByteMetrics/issues/2) | RNF05, RP02–04 | Docker, DDL e documentação base. Verificar a inicialização da pilha com volume vazio. A issue usa o nome Documentação e Engenharia Inicial de Requisitos, enquanto o README resume a frente como Setup Infra & Schema SQL. | Fechada. [Review 1](sprints/sprint-1/sprint-1.md) |
| 1 · US01 · [issue #3](https://github.com/pentascripts-organization/EcoByteMetrics/issues/3) | RF11–12, RNF01, RP01 | Interface e localização. Verificar cidade e timestamp em desktop e celular. | Fechada. [Review 1](sprints/sprint-1/sprint-1.md) |
| 1 · US02 · [issue #4](https://github.com/pentascripts-organization/EcoByteMetrics/issues/4) | RF01–03 | Descoberta e coleta via agregador. Verificar entrada, remoção e atualização de leituras. | Fechada. [Review 1](sprints/sprint-1/sprint-1.md) |
| 2 · US03 · [issue #5](https://github.com/pentascripts-organization/EcoByteMetrics/issues/5) | RF09, RF14, RNF02–03 | Dashboard e ranking. Verificar ordenação e atualização sem recarregar. | Aberta. [issue #99](https://github.com/pentascripts-organization/EcoByteMetrics/issues/99), [issue #100](https://github.com/pentascripts-organization/EcoByteMetrics/issues/100), [issue #101](https://github.com/pentascripts-organization/EcoByteMetrics/issues/101). Alef e Enzo conforme planejamento da Sprint 2. |
| 2 · US04 · [issue #6](https://github.com/pentascripts-organization/EcoByteMetrics/issues/6) | RF07–08, RF10 | Cálculo e histórico. Conferir amostra e janela SQL com fator presente e ausente. | Aberta. Thiago nas entregas [issue #29](https://github.com/pentascripts-organization/EcoByteMetrics/issues/29), [issue #30](https://github.com/pentascripts-organization/EcoByteMetrics/issues/30), [issue #31](https://github.com/pentascripts-organization/EcoByteMetrics/issues/31), [issue #32](https://github.com/pentascripts-organization/EcoByteMetrics/issues/32). |
| 2 · US05 · [issue #7](https://github.com/pentascripts-organization/EcoByteMetrics/issues/7) | RF04–06, RNF04 | Estados de falha e recuperação. Verificar a próxima rodada após indisponibilidade. | Aberta. Vinicius nas tarefas [issue #33](https://github.com/pentascripts-organization/EcoByteMetrics/issues/33), [issue #34](https://github.com/pentascripts-organization/EcoByteMetrics/issues/34), [issue #35](https://github.com/pentascripts-organization/EcoByteMetrics/issues/35), [issue #36](https://github.com/pentascripts-organization/EcoByteMetrics/issues/36). |
| 2 · US06 · [issue #9](https://github.com/pentascripts-organization/EcoByteMetrics/issues/9) | RP06 | Autenticação e proteção. Verificar login, perfis e acesso à configuração. | Aberta. Cauã nas tarefas [issue #38](https://github.com/pentascripts-organization/EcoByteMetrics/issues/38), [issue #39](https://github.com/pentascripts-organization/EcoByteMetrics/issues/39), [issue #40](https://github.com/pentascripts-organization/EcoByteMetrics/issues/40). |
| 3 · US07 · [issue #10](https://github.com/pentascripts-organization/EcoByteMetrics/issues/10) | RF12–13 | Globo depende dos metadados do agregador. Verificar marcadores, navegação e serviços sem coordenadas. | Fechada. Cauã, Alef e Vinicius em [issue #113](https://github.com/pentascripts-organization/EcoByteMetrics/issues/113), [issue #114](https://github.com/pentascripts-organization/EcoByteMetrics/issues/114), [issue #115](https://github.com/pentascripts-organization/EcoByteMetrics/issues/115), [issue #116](https://github.com/pentascripts-organization/EcoByteMetrics/issues/116), [issue #117](https://github.com/pentascripts-organization/EcoByteMetrics/issues/117). |
| 3 · US08 · [issue #11](https://github.com/pentascripts-organization/EcoByteMetrics/issues/11) | RF15, RP05, RP07 | Comparador e fechamento. Verificar janelas iguais entre aplicações, cobertura e execução containerizada. | Aberta. Thiago, Cauã e Alef em [issue #118](https://github.com/pentascripts-organization/EcoByteMetrics/issues/118), [issue #119](https://github.com/pentascripts-organization/EcoByteMetrics/issues/119), [issue #120](https://github.com/pentascripts-organization/EcoByteMetrics/issues/120), [issue #121](https://github.com/pentascripts-organization/EcoByteMetrics/issues/121), [issue #122](https://github.com/pentascripts-organization/EcoByteMetrics/issues/122), [issue #125](https://github.com/pentascripts-organization/EcoByteMetrics/issues/125), [issue #127](https://github.com/pentascripts-organization/EcoByteMetrics/issues/127). |
| 3 · US09 · [issue #128](https://github.com/pentascripts-organization/EcoByteMetrics/issues/128) | RNF01, RNF03–05, RP01–03, RP06 | Há badges e runbook. Exportação, retenção controlada e homologação de performance têm evidência incompleta. | Aberta. [issue #129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129), [issue #132](https://github.com/pentascripts-organization/EcoByteMetrics/issues/132), [issue #136](https://github.com/pentascripts-organization/EcoByteMetrics/issues/136). |

A linha do tempo do README previa encerramento da Sprint 3 em 23/11. A correção de persistência entrou em 23/11 às 21h44 em Brasília. A estabilização do teste de Evolução e a integração na main ocorreram em 24/11. A integração na main ocorreu em 24/11/2026, seguida da correção de Administração no commit de referência. A data da entrega acadêmica requer confirmação. [PR #154](https://github.com/pentascripts-organization/EcoByteMetrics/pull/154), [PR #160](https://github.com/pentascripts-organization/EcoByteMetrics/pull/160), [PR #161](https://github.com/pentascripts-organization/EcoByteMetrics/pull/161) · [Correção de Administração](https://github.com/pentascripts-organization/EcoByteMetrics/commit/29e58c5bd05d42764851420367f918f14b440197)

A exportação CSV/JSON é compromisso da US09 no backlog. Os 15 RF reproduzidos na matriz não incluem exportação. O escopo histórico permanece registrado e eventual adiamento exige decisão da equipe e, quando aplicável, anuência docente.

## 4. Participação individual verificável

A atribuição de uma issue identifica responsabilidade planejada. Os PRs abaixo identificam autoria ou entrega observável. A evidência por pessoa é amostral. Consulte os relatórios das [Sprints 1](sprints/sprint-1/sprint-1.md) e [2](sprints/sprint-2/sprint-2.md) para o contexto anterior.

| Integrante | Entrega e artefato | Evidência | Requisitos e critérios |
|---|---|---|---|
| Alef Gabriel de Oliveira · [@VtecturboBr](https://github.com/VtecturboBr) | Interface de comparação, monitoramento, apresentação em celular e Administração. | [Administração em 29e58c5](https://github.com/pentascripts-organization/EcoByteMetrics/commit/29e58c5bd05d42764851420367f918f14b440197) · [PR #144](https://github.com/pentascripts-organization/EcoByteMetrics/pull/144), [PR #145](https://github.com/pentascripts-organization/EcoByteMetrics/pull/145), [PR #149](https://github.com/pentascripts-organization/EcoByteMetrics/pull/149) · [issue #120](https://github.com/pentascripts-organization/EcoByteMetrics/issues/120), [issue #121](https://github.com/pentascripts-organization/EcoByteMetrics/issues/121), [issue #122](https://github.com/pentascripts-organization/EcoByteMetrics/issues/122), [issue #127](https://github.com/pentascripts-organization/EcoByteMetrics/issues/127) | RF09, RF13–15 · DW04–06, ES09 |
| Vinicius Guin · [@ViniciusGuin](https://github.com/ViniciusGuin) | Atribuição em documentação e coordenadas ausentes. PR de sincronização documental. | [Docs em 6524fb9](https://github.com/pentascripts-organization/EcoByteMetrics/commit/6524fb996a984cadfc643f4890fe301918349e22) · [PR #151](https://github.com/pentascripts-organization/EcoByteMetrics/pull/151), [PR #156](https://github.com/pentascripts-organization/EcoByteMetrics/pull/156) · [issue #117](https://github.com/pentascripts-organization/EcoByteMetrics/issues/117), [issue #126](https://github.com/pentascripts-organization/EcoByteMetrics/issues/126) | RF12–13, RNF05 · ES08–09, DW04 |
| Cauã Isaque · [@Cauaisq](https://github.com/Cauaisq) | Janela de comparação e correção de montagem do volume PostgreSQL. | [Volume em 01ed932](https://github.com/pentascripts-organization/EcoByteMetrics/commit/01ed932ce40650b3aa6ba0523c5b1e7c9bf02f78) · [PR #142](https://github.com/pentascripts-organization/EcoByteMetrics/pull/142), [PR #154](https://github.com/pentascripts-organization/EcoByteMetrics/pull/154) · [issue #119](https://github.com/pentascripts-organization/EcoByteMetrics/issues/119), [issue #125](https://github.com/pentascripts-organization/EcoByteMetrics/issues/125) | RF10, RF15, RP04 · DW07, BD03–04, ES09 |
| Thiago · [@ThiagoDT](https://github.com/ThiagoDT) | Comparação em SQL e provisionamento das contas iniciais. | [Comparação em 8343b1e](https://github.com/pentascripts-organization/EcoByteMetrics/commit/8343b1ed61e953893db02a99e3c3a77fe98186a7) · [PR #140](https://github.com/pentascripts-organization/EcoByteMetrics/pull/140), [PR #146](https://github.com/pentascripts-organization/EcoByteMetrics/pull/146) · [issue #118](https://github.com/pentascripts-organization/EcoByteMetrics/issues/118), [issue #130](https://github.com/pentascripts-organization/EcoByteMetrics/issues/130) | RF15, RP03, RP06 · BD01–04, DW06, ES09 |
| Enzo Suzuki · [@EnzoSuzukiProkopas](https://github.com/EnzoSuzukiProkopas) | Runbook de contingência e atribuição de padronização do ambiente. | [Runbook em 592ac11](https://github.com/pentascripts-organization/EcoByteMetrics/commit/592ac11e08fc2e0bf51b9ff3719122b2feae46f4) · [Ambiente em b48a775](https://github.com/pentascripts-organization/EcoByteMetrics/commit/b48a775d7254159463a57c886a3d41001b81a207) · [PR #138](https://github.com/pentascripts-organization/EcoByteMetrics/pull/138), [PR #141](https://github.com/pentascripts-organization/EcoByteMetrics/pull/141) · [issue #124](https://github.com/pentascripts-organization/EcoByteMetrics/issues/124), [issue #136](https://github.com/pentascripts-organization/EcoByteMetrics/issues/136) | RNF04–05, RP04 · ES08–09, DW07, TP03 |

Os nomes completos de Cauã e Thiago requerem confirmação. Os perfis públicos consultados não exibem esses nomes completos. Revisões, prototipagem, planejamento e trabalho fora do GitHub podem ser complementados pela equipe com ata, histórico do Figma ou outra evidência de autoria.

## 5. Definition of Done

A [issue #127](https://github.com/pentascripts-organization/EcoByteMetrics/issues/127) exige MVP funcional, responsivo e containerizado validado, relatório preenchido e vídeo enviado. Seu DoR exige US00 a US09 concluídas e há histórias abertas. A [issue #129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129) define exportação autenticada como condição de conclusão. As duas issues continuam abertas. A DoD de cada tarefa permanece no registro original. A [auditoria](auditoria-final.md) registra as verificações de homologação desta etapa.

## 6. Avaliação

Consulte a [matriz de requisitos e rubrica](rastreabilidade.md), a [Sprint Review 3](sprints/sprint-3/sprint-3.md) e a [auditoria final](auditoria-final.md).
