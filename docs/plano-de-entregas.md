# 📅 Plano de Entregas e Matriz de Rastreabilidade

### 🎯 Objetivo do Projeto
Desenvolver a plataforma web containerizada **GreenER** para monitoramento de microsserviços, estimativa de consumo de energia (kWh) e emissão de dióxido de carbono equivalente (CO₂e) utilizando PostgreSQL nativo sem ORM.

---

### 📊 Matriz de Rastreabilidade e Avaliação da Rubrica

A tabela abaixo registra o planejamento, a rastreabilidade e a localização das evidências para os critérios de avaliação previstos na rubrica:

| Código | Requisito Relacionado | Entrega Concreta | Como Verificar | Responsáveis | Evidência no GitHub | Situação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ES01** | Escopo GreenER | Backlog de produto priorizado e organizado em sub-issues | Consultar as Issues e Milestones no GitHub | Equipe | [Issues develop](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/issues) | Concluído |
| **ES02** | Planejamento | Sprint Backlog registrado com metas, pontos e responsáveis | Verificar registro de objetivos no relatório de Sprint | Equipe | [docs/sprints/sprint-1.md](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/docs/sprints/sprint-1.md) | Concluído |
| **ES03** | Critérios de Aceite | Definição explícita de DoR e DoD em cada sub-issue criada | Acessar o detalhamento de sub-issues no repositório | Equipe | [Issues develop](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/issues) | Concluído |
| **ES04** | Rastreabilidade | Vinculação entre `(RF/RNF/RP)`, commits e Pull Requests | Verificar IDs de sub-issues nas mensagens de commit | Equipe | [Commits develop](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/commits) | Concluído |
| **ES05** | Evolução Incremental | Histórico contínuo e bem distribuído de commits no repositório | Consultar o histórico de contribuições e commits | Equipe | [Commits develop](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/commits) | Concluído |
| **ES06** | Sprint Review | Registro das entregas, pendências e autoavaliação da Sprint 1 | Ler o relatório oficial da Sprint Review 1 | Equipe | [docs/sprints/sprint-1.md](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/docs/sprints/sprint-1.md) | Concluído |
| **ES07** | Definition of Done | Evidências de conclusão aplicadas conforme o DoD do projeto | Conferir artefatos no relatório da sprint | Equipe | [docs/sprints/sprint-1.md](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/docs/sprints/sprint-1.md) | Concluído |
| **ES08** | Documentação | `README.md` completo com guia Docker e arquitetura da solução | Seguir os passos do manual principal na raiz | Equipe | [README.md](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/README.md) | Concluído |
| **ES09** | Participação | Contribuição individual verificável de todos os membros | Consultar o painel de contribuidores do GitHub | Todos os Membros | [Contributors develop](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/graphs/contributors) | Concluído |
| **DW01** | Tecnologias | React + TS no Frontend; Node.js + TS no Backend | Conferir os arquivos `package.json` dos módulos | Equipe | [frontend/package.json](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/frontend/) | Concluído |
| **DW02** | RF01, RF03 | Polling integrado com Agregador de Métricas e Carbono | Testar as chamadas HTTP para `/services` e `/metrics` | Dev Backend | [backend/src/integrations/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/) | Concluído |
| **DW03** | RNF05, RP02 | API REST modular em Node.js (Routes, Controller, Service, Repository) | Consultar os arquivos de rotas e repositórios | Dev Backend | [docs/api.md](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/docs/api.md) | Concluído |
| **DW07** | RP04 | Execução 100% containerizada via Docker Compose | Executar `docker compose up` e verificar containers | Dev Infra | [compose.yaml](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/compose.yaml) | Concluído |
| **BD01** | RP03 | Tabelas em SQL explícito sem ORM em `database/DDL.sql` | Executar `database/DDL.sql` em um banco limpo | Dev Database | [database/schema.sql](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/database/schema.sql) | Concluído |
| **BD02** | RP03, RF10 | Inserções e seleções com SQL parametrizado (`$1`, `$2`) | Verificar o código SQL na camada de Repositories | Dev Database | [backend/src/modules/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/) | Concluído |
| **BD03** | RP03, RP04 | Conexão backend-banco e volume de dados persistente | Testar reinicialização do container PostgreSQL | Dev Infra / DB | [compose.yaml](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/compose.yaml) | Concluído |
| **BD04** | RF14, RF15 | Consultas SQL de análise com agregação, JOIN e ordenação | Executar queries de histórico e rankings de impacto | Dev Database | [database/README.md](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/database/README.md) | Concluído |
| **TP01** | RP02 | Modelagem orientada a objetos com encapsulamento | Verificar as classes e domain models no backend | Dev Backend | [backend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/) | Concluído |
| **TP02** | RP01, RP02 | Tipagem forte em TypeScript sem o uso de `any` | Verificar interfaces e tipos no código fonte | Equipe | [backend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/) | Concluído |
| **TP03** | RNF04 | Tratamento de exceções via `try/catch` em APIs e Banco | Testar simulação de falhas nas chamadas externas | Dev Backend | [backend/src/](https://github.com/pentascripts-organization/EcoByteMetrics/tree/develop/backend/) | Concluído |
