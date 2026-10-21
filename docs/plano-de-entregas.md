# 📅 Plano de Entregas e Matriz de Rastreabilidade

**Projeto:** EcoByteMetrics (GreenER)  
**Organização:** Pentascripts  
**Repositório Oficial:** [https://github.com/pentascripts-organization/EcoByteMetrics](https://github.com/pentascripts-organization/EcoByteMetrics)  

---

## 🎯 1. Escopo Geral do Projeto & Objetivos por Sprint

### 💡 Objetivo Geral do Produto
Desenvolver a plataforma web containerizada **GreenER** para monitoramento contínuo de microsserviços, estimativa de consumo energético em quilowatt-hora (kWh) e cálculo aproximado da pegada de carbono em dióxido de carbono equivalente (gCO₂e), utilizando PostgreSQL nativo sem ORM e orquestração Docker.

### 🗓️ Objetivos Específicos das Sprints
* **Sprint 1 (Fundação, Polling e Interface Base):** Estabelecer a infraestrutura containerizada via Docker Compose, criar o esquema nativo em SQL (`DDL.sql`), estruturar a interface responsiva em React + TS com suporte à localização e desenvolver o backend em Node.js + TS com o serviço de polling para descoberta (`/services`) e coleta de métricas (`/metrics`).
* **Sprint 2 (Motor Ambiental, Dashboard e Segurança):** Implementar o motor de cálculo ambiental (kWh e gCO₂e), persistência temporal em DML, Dashboard operacional com ordenação por ranking de impacto, tratamento de resiliência a falhas e autenticação JWT.
* **Sprint 3 (Geolocalização em Mapa, Comparador e MVP Final):** Desenvolver a visualização geográfica dos microsserviços em mapa interativo, o módulo comparador de eficiência ambiental entre aplicações e a consolidação do MVP containerizado final.

---

## 👥 2. Matriz de Participação e Contribuição Individual 

Conforme a regra do critério **ES09 (8 pontos)**, a tabela abaixo registra a atribuição de responsabilidades e as contribuições individuais verificáveis no GitHub para cada integrante do time, com as frentes e sub-issues devidamente alinhadas:

| Integrante | Papel Scrum / Frente | Responsabilidades Principais na Sprint 1 | Sub-issues / Evidências no GitHub |
| :--- | :--- | :--- | :--- |
| **Vinicius** | Scrum Master / Dev Infra / Dev Frontend | Orquestração Docker Compose, configuração do ambiente e liderança da documentação técnica | [#14 Docker Compose](https://github.com/pentascripts-organization/EcoByteMetrics/issues/14) \\| [#15 Docs](https://github.com/pentascripts-organization/EcoByteMetrics/issues/15) \\| [#22 Polling](https://github.com/pentascripts-organization/EcoByteMetrics/issues/22) |
| **Cauã** | Product Owner / Dev Backend / Dev Database | Modelagem de requisitos, refinamento de DoR/DoD e integração com Agregador de Métricas | [#43 Diagrama](https://github.com/pentascripts-organization/EcoByteMetrics/issues/43) \| [#21 /services](https://github.com/pentascripts-organization/EcoByteMetrics/issues/21) |
| **Enzo** | Dev Team (Frontend) | Prototipagem da interface no Figma (desktop e mobile) e estruturação de componentes responsivos em React + TS | [#16 Figma](https://github.com/pentascripts-organization/EcoByteMetrics/issues/16)
| **Thiago** | Dev Team (Backend / Database) | Setup modular do servidor Node.js + TS, serviço de polling periódico e modelagem do esquema SQL relacional em PostgreSQL | [#12 Schema SQL](https://github.com/pentascripts-organization/EcoByteMetrics/issues/12) \| [#20 Server Node](https://github.com/pentascripts-organization/EcoByteMetrics/issues/20) \|
| **Alef** | Dev Team (Frontend) | Tratamento visual de componentes para exibição de cidade e elemento de horário e intervalo da última atualização | [#49 Exibição Cidade](https://github.com/pentascripts-organization/EcoByteMetrics/issues/49) \| [#52 Horário Atualização](https://github.com/pentascripts-organization/EcoByteMetrics/issues/52) \| [#17 React UI](https://github.com/pentascripts-organization/EcoByteMetrics/issues/17) |
> **📌 Observação sobre a Participação da Equipe:**  
> No repositório do GitHub, os commits do Enzo aparecem concentrados no arquivo `README.md`. No entanto, ele desenvolveu em parceria com o Alef na criação dos protótipos de tela no Figma (#16). Por ser a primeira Sprint do projeto, parte do trabalho feito em dupla acabou sendo enviada em commits unificados. O grupo definiu como ponto de melhoria organizar os commits de forma mais individualizada a partir da Sprint 2.

---

## 📊 3. Matriz de Rastreabilidade e Avaliação dos Critérios da Rubrica

Tabela oficial de acompanhamento de todos os critérios da **Rubrica de Avaliação das Sprints**:

| Código | Requisito Relacionado | Entrega Concreta | Como Verificar | Responsáveis | Evidência no GitHub | Situação (Sprint 1) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ES01** | Escopo GreenER | Product Backlog priorizado e organizado em User Stories e sub-issues | Consultar a aba de Issues e o quadro de projeto no GitHub | Equipe | [Aba de Issues no GitHub](https://github.com/pentascripts-organization/EcoByteMetrics/issues) | **Concluído** |
| **ES02** | Planejamento | Sprint Backlog registrado com metas, pontos e responsáveis da Sprint 1 | Verificar objetivos e tarefas no relatório oficial da Sprint 1 | Equipe | [docs/sprints/sprint-1.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/docs/sprints/sprint-1.md) | **Concluído** |
| **ES03** | Critérios de Aceite | Definição explícita de DoR e DoD em cada sub-issue catalogada | Acessar o detalhamento das sub-issues no GitHub | Equipe | [Aba de Issues no GitHub](https://github.com/pentascripts-organization/EcoByteMetrics/issues) | **Concluído** |
| **ES04** | Rastreabilidade | Vinculação entre requisitos `(RF/RNF/RP)`, commits e Pull Requests | Verificar os IDs das sub-issues nas mensagens de commit | Equipe | [Histórico de Commits](https://github.com/pentascripts-organization/EcoByteMetrics/commits/develop) | **Concluído** |
| **ES05** | Evolução Incremental | Histórico contínuo e bem distribuído de commits ao longo da sprint | Consultar o histórico de contribuições da branch develop | Equipe | [Histórico de Commits](https://github.com/pentascripts-organization/EcoByteMetrics/commits/develop) | **Concluído** |
| **ES06** | Sprint Review | Registro das entregas, pendências, autoavaliação e decisões da Sprint 1 | Ler o relatório oficial da Sprint Review 1 | Equipe | [docs/sprints/sprint-1.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/docs/sprints/sprint-1.md) | **Concluído** |
| **ES07** | Definition of Done | Definição objetiva de DoD e evidências de aplicação no incremento | Conferir os artefatos validados no relatório da sprint | Equipe | [docs/sprints/sprint-1.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/docs/sprints/sprint-1.md) | **Concluído** |
| **ES08** | Documentação | Manual principal `README.md` com arquitetura, ER e guia Docker | Seguir o passo a passo de execução no README da raiz | Equipe | [README.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/README.md) | **Concluído** |
| **ES09** | Participação | Contribuição individual relevante e verificável de todos os membros | Consultar a Matriz da Seção 2 e o gráfico do GitHub | Todos | [Painel de Contribuidores](https://github.com/pentascripts-organization/EcoByteMetrics/graphs/contributors) | **Concluído** |
| **DW01** | Tecnologias | React + TS no Frontend; Node.js + TS no Backend; separação modular | Conferir as pastas dos dois módulos no repositório | Equipe | [Pasta frontend/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/frontend) \| [Pasta backend/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend) | **Concluído** |
| **DW02** | RF01, RF03 | Polling integrado com Agregador de Métricas (`/services` e `/metrics`) | Verificar as integrações de API no código do backend | Dev Backend | [backend/src/integrations/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/src/integrations) | **Concluído** |
| **DW03** | RNF05, RP02 | API REST modular em Node.js (Routes, Controller, Service, Repository) | Consultar a documentação técnica de rotas e APIs | Dev Backend | [docs/api.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/docs/api.md) | **Concluído** |
| **DW04** | RF11, RNF01 | Interface React organizada em componentes, pages e hooks | Verificar a estrutura de código-fonte do frontend | Dev Frontend | [frontend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/frontend/src) | **Concluído** |
| **DW05** | RF09, RF14 | Dashboard Operacional e Ordenação por Ranking de Impacto | Exibição de estado, consumo, emissões e ordenação | Dev Frontend | [US03 no README.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/README.md#us03) | **Não previsto nesta sprint** |
| **DW06** | RP06 | Autenticação e proteção de rotas administrativas via JWT | Proteção de rotas no backend com geração de token | Dev Backend | [US06 no README.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/README.md#us06) | **Não previsto nesta sprint** |
| **DW07** | RP04 | Execução 100% containerizada via Docker Compose | Executar `docker compose up` e verificar subida | Dev Infra | [compose.yaml](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/compose.yaml) | **Concluído** |
| **BD01** | RP03 | Tabelas em SQL explícito sem ORM em `database/schema.sql` | Executar `database/schema.sql` em banco limpo | Dev Database | [database/schema.sql](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/database/schema.sql) | **Concluído** |
| **BD02** | RP03, RF10 | Operações DML com SQL parametrizado (`$1`, `$2`) nos Repositories | Verificar inserções/seleções nos repositórios | Dev Database | [backend/src/modules/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/src/modules) | **Concluído** |
| **BD03** | RP03, RP04 | Conexão backend-banco e volume de dados persistente (`pgdata`) | Testar a preservação de dados após reiniciar container | Dev Infra / DB | [compose.yaml](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/compose.yaml) | **Concluído** |
| **BD04** | RF14, RF15 | Consultas SQL de análise com agregação, JOIN e ordenação | Executar queries de histórico no guia do banco | Dev Database | [database/README.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/database/README.md) | **Não previsto nesta sprint** |
| **TP01** | RP02 | Modelagem orientada a objetos com encapsulamento no backend | Verificar a estrutura do código-fonte do backend | Dev Backend | [backend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/src) | **Concluído** |
| **TP02** | RP01, RP02 | Tipagem forte em TypeScript sem o uso de `any` injustificado | Conferir interfaces, tipos e rotas no código backend | Equipe | [backend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/src) | **Concluído** |
| **TP03** | RNF04 | Tratamento de exceções via `try/catch` em APIs e Banco | Testar o tratamento de erros no código backend | Dev Backend | [backend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/src) | **Concluído** |
