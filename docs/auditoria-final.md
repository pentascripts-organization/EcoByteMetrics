# Auditoria documental do MVP

## Referência e fontes

A cópia local não tem diretório `.git`. Antes das edições, os arquivos do snapshot correspondiam à [main em 29e58c5bd05d42764851420367f918f14b440197](https://github.com/pentascripts-organization/EcoByteMetrics/commit/29e58c5bd05d42764851420367f918f14b440197), após normalizar finais de linha. A comparação usou um clone temporário externo à pasta de trabalho. O [PR #161](https://github.com/pentascripts-organization/EcoByteMetrics/pull/161) integra a Sprint 3 e sustenta a escolha técnica da main. A versão formal de entrega precisa de confirmação. Outros commits examinados incluem [a975c30](https://github.com/pentascripts-organization/EcoByteMetrics/commit/a975c30), de sincronização documental, [b6adcac](https://github.com/pentascripts-organization/EcoByteMetrics/commit/b6adcac), de indicadores operacionais, e [6d9b8bf](https://github.com/pentascripts-organization/EcoByteMetrics/commit/6d9b8bf), de estabilização do teste de Evolução.

A [develop em fd1aeba13166c8a5dd911ef3a7b12c26698c5e24](https://github.com/pentascripts-organization/EcoByteMetrics/commit/fd1aeba13166c8a5dd911ef3a7b12c26698c5e24) estava três commits atrás e zero à frente. A diferença inclui revisão do README, merge da Sprint 3 e ajuste de reentrada e perfis de Administração em quatro arquivos do frontend e um teste Playwright. [Comparação](https://github.com/pentascripts-organization/EcoByteMetrics/compare/fd1aeba13166c8a5dd911ef3a7b12c26698c5e24...29e58c5bd05d42764851420367f918f14b440197)

A consulta aos refs e à página do GitHub não encontrou tags ou releases. As milestones abertas são [Sprint 1](https://github.com/pentascripts-organization/EcoByteMetrics/milestone/1), [Sprint 2](https://github.com/pentascripts-organization/EcoByteMetrics/milestone/2) e [Sprint 3](https://github.com/pentascripts-organization/EcoByteMetrics/milestone/3). O [Project PentaScripts-DSM-2](https://github.com/orgs/pentascripts-organization/projects/2/views/1) confirma os períodos e o estado atual dos cartões. O histórico de mudanças e a baseline não estão demonstrados pela visão pública. Os contratos OpenAPI da UniLaunch confirmam as rotas externas e a relação entre energia e fator regional. [Métricas](https://metrics.unilaunch.org/openapi.json) · [Carbono](https://carbon.unilaunch.org/openapi.json) A descrição acadêmica, os pesos e a nota histórica vêm do texto anexado. Faltam os originais do desafio, das versões da rubrica, da avaliação da Sprint 1 e da apresentação, bem como capturas adicionais. Os diagramas e gráficos versionados são evidência documental da equipe. A [matriz](rastreabilidade.md) e o [plano](plano-de-entregas.md) ligam código, issues, PRs e responsáveis.

## Inventário e mudanças documentais

| Documento ou grupo | Estado inicial | Revisão |
|---|---|---|
| [README](../README.md) | Parcialmente atualizado, DDL duplicado, integração de carbono e link da Sprint 3 divergentes | Mantidos banner e estrutura visual. Atualizados produto, API externa, Compose, seed, testes e vídeo. |
| [Frontend](../frontend/README.md) | Contraditório quanto à Administração e incompleto nos testes | Perfis, rotas, providers, estado, análise e Playwright. |
| [Backend](../backend/README.md) | Parcial e desatualizado quanto a nomes de arquivos, SQL de exemplo, ambiente e permissões | Refeito com fluxo atual, classes, worker, autenticação, persistência e testes. |
| [Banco](../database/README.md) | Desatualizado, com referência a schema.sql e DDL duplicado | DER, tabelas e índices, DDL/DML autoritativos, migrations e diagnóstico. |
| [Arquitetura](arquitetura.md) e [API](api.md) | Parcialmente atualizados | Fluxos, integrações, contratos, distinção entre cache e persistência, exemplos e erros. |
| [Cálculos](calculos.md) | Incompleto para os coeficientes atuais e cobertura | Exemplo oficial fornecido, exemplo de 120 W e diferenças de agregação. |
| [Runbook](troubleshooting.md) | Parcial, sobretudo em sessão e recuperação | Diagnóstico por proxy, backup binário e restauração separada. |
| [Plano](plano-de-entregas.md) | Incompleto na Sprint 3 e estados excessivamente conclusivos | US00 a US09, atribuições, mudanças, DoD e evidências. |
| [Review 1](sprints/sprint-1/sprint-1.md) e [Review 2](sprints/sprint-2/sprint-2.md) | Registros históricos, dependentes de confirmação para validações externas | Preservados, com referência aos gráficos e períodos registrados. |
| [Review 3](sprints/sprint-3/sprint-3.md) | Vazio | Relatório com evidências, vídeo e pontos pendentes. |
| [Histórico do backend](../backend/docs/HISTORY.md) | Referência técnica de histórico e migração | Complementado pelos links nos guias e na API. |
| [Organização do frontend](../frontend/src/README.md), [geografia](../frontend/src/shared/geography/README.md), [ativos](../frontend/public/assets/README.md), [licença de GlideSelect](../frontend/src/shared/ui/GlideSelect.LICENSE.md) e [licença de SpecularButton](../frontend/src/shared/ui/SpecularButton.LICENSE.md) | Referências auxiliares e de atribuição | Preservadas. |
| [Templates](../.github/ISSUE_TEMPLATE/), [diagramas](Diagramas/) e [MER/DER iniciais](Modelo%20MER%20e%20DER/) | Templates operacionais e ilustrações históricas | Preservados. Consulte os diagramas Mermaid atuais para homologação do software. |
| [Matriz](rastreabilidade.md) e esta auditoria | Ausentes | Criadas para evidências, lacunas e homologação. |

## Evolução em relação à Sprint 1

A nota sugerida de 6,43 (58,5 de 91 pontos avaliados) vem do resumo fornecido. A coluna de apontamentos usa os critérios e problemas citados nesse resumo. O texto integral da avaliação requer confirmação.

| Ponto de atenção | Evolução posterior e evidência | Situação |
|---|---|---|
| ES02 · Planejamento e alocação | Plano das três Sprints e tarefas atribuídas. [Plano](plano-de-entregas.md) | Parcial. Falta baseline diária da Sprint 3. |
| ES06 · Review e adaptação | Reviews 2 e 3, vídeos e runbook associado à retrospectiva. [PR #138](https://github.com/pentascripts-organization/EcoByteMetrics/pull/138) | Parcial. Ata e feedback da Sprint 3 pendentes. |
| ES07 · DoD verificável | DoD de fechamento e de exportação registrada. [#127](https://github.com/pentascripts-organization/EcoByteMetrics/issues/127) · [#129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129) | Parcial. Fechamento e homologação em aberto. |
| ES08 · Reprodutibilidade | Guias atualizados e smoke no CI. [Runbook](troubleshooting.md) | Execução externa com fontes reais pendente. |
| ES09 · Evidências individuais | Cinco integrantes com atribuições e PRs verificáveis. [Participação](plano-de-entregas.md#4-participação-individual-verificável) | Parcial. Faltam registros de atividades externas e cobertura de revisões. |
| DW03 · API REST e arquitetura | Routers, controllers, serviços, SQL e testes de contratos. [Backend](../backend/README.md) · [API](api.md) | Implementação e testes controlados verificados. |
| DW07 · Pilha containerizada | Correção de montagem e smoke de três serviços. [PR #154](https://github.com/pentascripts-organization/EcoByteMetrics/pull/154) | Smoke histórico aprovado. |
| BD01 · DDL e modelo | Perfis, histórico, restrições e índices refletidos no DER. [Modelo](../database/README.md) | Evidência estática verificada. |
| BD02 · DML e parametrização | Gravação e consulta parametrizadas, inclusive comparação. [PR #140](https://github.com/pentascripts-organization/EcoByteMetrics/pull/140) | Evidência estática e teste de contrato. |
| BD03 · Persistência e reinicialização | Transações, volume e testes de integração. [Persistência](../database/README.md) | Reinício com dados reais ainda pendente nesta auditoria. |
| TP01 · Classes de negócio | Classes em autenticação, usuários e estatísticas com responsabilidades documentadas. [Backend](../backend/README.md) | Evidência estática. Adequação à rubrica depende de avaliação docente. |
| TP03 · Falhas de APIs e banco | Timeouts, erros por serviço, rollback e fallback HTTP. [Arquitetura](arquitetura.md) | Evidência controlada. Recuperação operacional real pendente. |

## Validação

| Verificação | Resultado e alcance |
|---|---|
| Backend local | Build e 47 testes passaram com fontes controladas. Incluem JWT, rotas, falhas de coleta, ciclo concorrente e comparação. |
| Frontend local | Build, lint e 230 testes unitários passaram. O Vite avisou sobre o tamanho do chunk do globo. |
| Playwright local | 67 passaram e 5 foram pulados pelo próprio conjunto de testes. Chromium com perfis desktop e mobile, dados controlados, Administração, Evolução, comparação e fallback de WebGL. |
| Docker Compose local | `docker compose config --quiet` passou com o modelo de ambiente em cópia temporária. Docker Engine indisponível no host. Subida, restart, backup, restauração e PostgreSQL real não foram executados localmente. |
| GitHub Actions na main de referência | [Backend CI](https://github.com/pentascripts-organization/EcoByteMetrics/actions/runs/45535501717), [Frontend CI](https://github.com/pentascripts-organization/EcoByteMetrics/actions/runs/45535501641) e [Docker Compose Smoke](https://github.com/pentascripts-organization/EcoByteMetrics/actions/runs/45535501646) concluíram com sucesso. O workflow de backend inclui integração de autenticação, coleta e histórico em PostgreSQL 18. O smoke verifica HTTP e proxy com PostgreSQL 16 da pilha e usa URLs de integração inativas de propósito. |
| Vídeo | O recurso oEmbed confirmou título EcoByteMetrics Sprint 3 e canal PentaScript. [YouTube](https://youtu.be/-J-_2v4ASvk) |
| Documentos | Oito diagramas Mermaid renderizaram com Mermaid CLI 12.2.0. Caminhos relativos, âncoras e largura das tabelas foram conferidos. |
| Escopo | A comparação com o snapshot normalizado encontrou dez Markdown alterados e dois novos. A referência Git foi consultada em clone separado e os testes foram executados nele. |

### Homologação final proposta

- [x] Vincular código, tarefas, PRs, testes e limitações aos requisitos.
- [x] Verificar compilação, testes de contrato, interface com respostas controladas e vídeo publicado.
- [ ] Registrar validação funcional com Docker, duas APIs reais e contas de teste.
- [ ] Comparar histórico antes e depois de reinicialização e validar restauração em banco separado.
- [ ] Conferir ranking e comparação com fator ausente, zero e janela comum.
- [ ] Revisar responsividade em dispositivo real e confirmar cobertura de critérios.
- [ ] Registrar feedback, decisões de escopo e aceite da versão pela equipe e pelos avaliadores.

## Encaminhamentos

Os blocos abaixo são identificados pela frente responsável. A numeração oficial dos demais blocos depende do cronograma da operação.

| ID e bloco | Problema e evidência | Requisitos e rubrica | Severidade e impacto | Ação de verificação ou correção |
|---|---|---|---|---|
| BE-01 · Backend | CPU de 120 W no SQL e no cache, exemplo UniLaunch de 100 W. [Cálculos](calculos.md) | RF07–08, RF14–15 · DW02, BD04 | Média. Muda estimativas e comparabilidade. | Confirmar os fatores oficiais e testar resultados nas três rotas de cálculo. |
| BE-02 · Backend | Rotas operacionais e SQL têm contratos e políticas de cobertura diferentes. [API](api.md) | RF05–08, RNF04 · DW03, TP03 | Média. Consumo e falhas podem ser interpretados de forma diferente entre clientes. | Validar cenários com ausência, timeout, zero e retomada e documentar contratos de domínio por rota. |
| DB-01 · Banco | Volume corrigido e transações implementadas, sem reinício e restauração nesta rodada. [Banco](../database/README.md) | RF10, RP03–04 · BD01–03 | Alta. Falta confirmar preservação do histórico na operação. | Capturar consultas antes e depois do reinício, validar migrations e restaurar dump em instância separada. |
| DB-02 · Banco | Consultas de histórico têm agregação e limites, mas não há medição representativa. [Histórico](../backend/docs/HISTORY.md) | RNF03, RF10, RF15 · BD04 | Média. A carga de consulta pode limitar a análise. | Medir latência e planos de execução por período com base representativa. |
| FE-01 · Frontend | Globo e comparação testados com dados controlados. Build informa chunk grande. [Frontend](../frontend/README.md) | RF13–15, RNF01, RNF03 · DW04–05 | Média. Falta comprovar experiência com dados e dispositivos reais. | Verificar coordenadas ausentes, ranking, teclado, celular e carga do globo. |
| SEC-01 · Segurança | Logout remove o cookie e o Bearer mantém validade original. `monitoring-settings` aceita ambos os perfis. [API](api.md) | RP06 · DW06 | Média. Política de revogação e acesso à configuração precisa ser homologada. | Confirmar política esperada, HTTPS, tempos de sessão e perfil por rota em ambiente de teste. |
| SEC-02 · Segurança | `npm ci` informou nove alertas moderados no frontend. [Manifesto](../frontend/package.json) | RNF04 · DW01 | Média. A aplicabilidade dos alertas precisa de triagem. | Identificar dependências afetadas e avaliar impacto em execução sem alterar o lockfile neste bloco. |
| INF-01 · Infraestrutura e testes | Smoke histórico cobre Compose e proxy. Execução local integrada requer Docker Engine e APIs acessíveis. [Workflow](../.github/workflows/docker-compose-smoke.yml) | RP04–05, RNF04–05 · DW07, ES08 | Alta. Falta homologação dinâmica completa. | Repetir instalação limpa, persistência, login, falhas externas e recuperação com operador externo. |
| AC-01 · Gestão acadêmica | US09 e exportação abertas. [#128](https://github.com/pentascripts-organization/EcoByteMetrics/issues/128) · [#129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129) | RNF05, RP05, RP07 · ES01, ES06–07 | Alta. O compromisso adicional afeta o aceite da DoD. | A equipe decide entrega ou adiamento com registro e anuência docente quando exigida. |
| AC-02 · Gestão acadêmica | Originais acadêmicos, feedback, burndown e baseline da Sprint 3 incompletos. [Review 3](sprints/sprint-3/sprint-3.md) | RP07 · ES02, ES06–07, ES09 | Média. Limita a comprovação histórica. | Obter rubrica oficial, avaliação e ata, exportar histórico do Project, complementar evidências individuais e definir versão e data de entrega. |
