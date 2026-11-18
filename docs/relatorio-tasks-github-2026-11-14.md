# Relatório das tasks do EcoByteMetrics
Data da análise: **14/11/2026**, horário de São Paulo.

## 1. Resultado principal

O projeto tem bastante funcionalidade implementada, mas o backlog mistura **trabalho a desenvolver**, **trabalho a validar/integrar** e **registros administrativos a encerrar**. Não é correto tratar todas as issues abertas como funcionalidades ainda inexistentes, nem todas as fechadas como entrega final comprovada.

| Escopo consultado | Total | Abertas | Fechadas |
| --- | ---: | ---: | ---: |
| Issues encontradas pela busca de vínculo com o Project 2 | 78 | 29 | 49 |
| Todas as issues do repositório, incluindo as não retornadas pelo filtro do projeto | 84 | 32 | 52 |
| Tasks técnicas/documentais dentro do projeto, excluindo User Stories e dailies | 58 | 20 | 38 |
| User Stories dentro do projeto | 10 | 7 | 3 |
| Dailies dentro do projeto | 10 | 2 | 8 |

**As 29 abertas do projeto se dividem em 20 tasks, 7 User Stories e 2 dailies.** Os totais são contagem de issues, não percentual de funcionalidade entregue, horas ou pontos: histórias e suas subtasks não devem contar duas vezes como progresso do produto.

Fontes: [Project 2](https://github.com/orgs/pentascripts-organization/projects/2), [issues abertas no projeto](https://github.com/pentascripts-organization/EcoByteMetrics/issues?q=is%3Aissue%20is%3Aopen%20project%3Apentascripts-organization%2F2), [issues do repositório](https://github.com/pentascripts-organization/EcoByteMetrics/issues).

### O que precisa de atenção primeiro

1. **Consistência do cálculo — #119:** dashboard usa CPU máxima de 100 W, enquanto histórico/estatísticas usam 120 W. O mesmo serviço pode receber resultados diferentes conforme a rota.
2. **Comparação no backend — #118:** a interface compara dados de monitoramento, mas o endpoint específico pedido pela task não foi identificado.
3. **Docker e primeiro acesso — #123–#125 e #130:** há configuração, mas falta comprovar o conjunto atual. O DML remoto não cria usuários e a configuração do frontend ainda usa PGPORT.
4. **Integração de trabalho existente:** #113 e #136 foram concluídas na develop; ainda não chegaram à main consultada. A cópia local também tem funcionalidades que não aparecem na develop.
5. **Backlog e aceite:** #114, #115, #117 e #120 já têm base no GitHub; #135 passa localmente. Precisam de revisão do aceite e evidências, sem recomeçar do zero.
6. **Documentação e apresentação — #126 e #127:** ainda precisam refletir a implementação real e provar a entrega final.

## 2. Como interpretar a análise

- **Aberta/fechada** é o estado da issue no GitHub, consultado por API e por busca com filtro do projeto.
- **Implementada/base existente** significa evidência na leitura estática do código. Não significa aprovação completa do DoD.
- **Local** refere-se apenas à pasta fornecida nesta sessão. Ela não contém .git e diverge do GitHub, portanto não foi possível associá-la com segurança a uma branch ou commit.
- **develop** foi usada para inspecionar o trabalho integrado mais recente; **main** foi consultada para distinguir a entrega principal. As árvores consultadas foram main `8b11160a3fb5f0660cf48779f219cba0a10527d8` e develop `c2156bad478279d0d45232413142e2f76d80edde` (SHAs de árvore, não de commit).
- A URL do quadro não pôde ser renderizada pela ferramenta web; o conector não oferece leitura direta de Projects. Usei o filtro de projeto do GitHub e a API de issues. **Não foram auditadas colunas como Todo/In Progress/Done, campos customizados, itens rascunho ou arquivados do quadro.**
- O relatório abrange as tasks do projeto/equipe, sem filtrar por um usuário específico. Os responsáveis abaixo vêm dos assignees das issues, não de nomes inferidos da pasta local.

## 3. Tasks abertas: o que são e como concluir

### [#114](https://github.com/pentascripts-organization/EcoByteMetrics/issues/114) — Renderização dos Marcadores (*Pins*) Geográficos no Mapa

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Base implementada no GitHub; validar aderência.

**Em termos claros:** Posicionar os serviços no mapa usando latitude e longitude recebidas da API.

**O que já existe:** WorldGlobe.tsx e RegionMap.tsx já renderizam pontos agrupados por localização. O requisito não começa do zero.

**Como executar:** Reutilizar groupServiceLocations; conferir que as coordenadas usadas vêm do backend, sem inventar uma cidade quando faltarem dados. Tratar vários serviços no mesmo ponto e permitir selecionar cada um.

**Aceite sugerido:** Mostrar dois serviços em locais distintos e dois no mesmo local; conferir seleção, posição e permanência dos serviços sem coordenadas na lista.

### [#115](https://github.com/pentascripts-organization/EcoByteMetrics/issues/115) — Ajuste dos Parâmetros de Zoom e Pan no Mapa Interativo

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Base implementada no GitHub; validar interação.

**Em termos claros:** Permitir navegar, aproximar e afastar o mapa sem perder os pontos ou bloquear a página.

**O que já existe:** O globo já tem código de enquadramento, foco, rotação e interação. O comportamento visual não foi exercitado nesta análise.

**Como executar:** Revisar limites da câmera e os gestos de mouse/toque; impedir que interações fora do mapa o movimentem; conferir redimensionamento e preferência por movimento reduzido.

**Aceite sugerido:** Validar zoom mínimo/máximo, toque e rotação em desktop e celular; registrar evidência de fluidez e ausência de recortes indevidos.

### [#116](https://github.com/pentascripts-organization/EcoByteMetrics/issues/116) — Exibição do Popup Informativo ao Clicar no Marcador

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Parcial no GitHub; implementação adicional local.

**Em termos claros:** Abrir um resumo ao clicar em um marcador: nome, estado, kWh e gCO₂e.

**O que já existe:** Na develop, um ponto individual navega para detalhes; grupos abrem uma lista com nomes e estados. A cópia local já tem map-popup-card com energia e carbono, mas o fluxo individual ainda deve ser conferido.

**Como executar:** Completar RegionMap para abrir o resumo exigido tanto em marcadores individuais quanto em grupos; oferecer fechar e abrir detalhes; identificar leitura ausente sem convertê-la em zero.

**Aceite sugerido:** Clicar em ponto individual e agrupado, conferir todos os campos e unidades, fechar pelo teclado e testar largura móvel.

### [#117](https://github.com/pentascripts-organization/EcoByteMetrics/issues/117) — Tratamento Gracioso para Coordenadas Nulas (`null`)

**GitHub:** aberta. **Responsável:** Sem responsável.  
**Avaliação:** Base implementada no GitHub; validar casos extremos.

**Em termos claros:** Manter o serviço na interface mesmo quando sua localização não tem coordenadas.

**O que já existe:** O adaptador de monitoring converte coordenadas ausentes/inválidas em undefined; o agrupamento do mapa ignora pontos inválidos. Os testes locais incluem histórico sem coordenadas.

**Como executar:** Preservar o serviço na tabela e nos totais; apenas omitir o marcador; mostrar localização indisponível quando necessário. Cobrir null, ausência, NaN, limites inválidos e a coordenada válida 0,0.

**Aceite sugerido:** A lista e o dashboard continuam navegáveis sem coordenadas e sem exceções; zero de latitude/longitude continua válido.

### [#118](https://github.com/pentascripts-organization/EcoByteMetrics/issues/118) — Endpoint REST de Comparação em SQL Nativo Parametrizado

**GitHub:** aberta. **Responsável:** @ThiagoDT.  
**Avaliação:** Pendente no GitHub.

**Em termos claros:** Fornecer uma comparação calculada no backend a partir do histórico persistido.

**O que já existe:** Não foi identificado o endpoint específico GET /metrics/compare. Existe /api/monitoring, com consulta ao banco, e a interface calcula a comparação sobre esses dados.

**Como executar:** Reutilizar os repositories existentes para receber pelo menos dois IDs e uma janela temporal única. Consultar Metrics com SQL parametrizado, agregação e JOINs; devolver totais, recursos, unidades, cobertura e limites do período. Documentar a URL adotada. Registrar /compare antes de rotas parametrizadas como /:serviceId.

**Aceite sugerido:** Teste de contrato com dois serviços e valores conhecidos; IDs e períodos inválidos retornam 400; dados ausentes ficam explícitos; resultado vem do PostgreSQL e não de cache em RAM.

### [#119](https://github.com/pentascripts-organization/EcoByteMetrics/issues/119) — Trava de Janela Temporal e Unificação das Fórmulas Ambientais

**GitHub:** aberta. **Responsável:** @Cauaisq.  
**Avaliação:** Pendente; divergência de cálculo confirmada.

**Em termos claros:** Garantir uma comparação justa, com o mesmo intervalo e a mesma fórmula ambiental.

**O que já existe:** dashboard.service.ts usa potência máxima de CPU de 100 W; monitoring.repository.ts e statistics.repository.ts usam 120 W. A interface também permite comparar últimas leituras com horários/durações diferentes.

**Como executar:** Unificar coeficientes e conversões. Usar 120 W se esse for o coeficiente aprovado pelo projeto; calcular kWh pela duração real e gCO₂e pelo fator correspondente à amostra. Fixar início/fim da comparação no backend e separar claramente a consulta de últimas leituras da comparação temporal. Documentar quando a interface converte g para kg.

**Aceite sugerido:** A mesma amostra produz o mesmo resultado em dashboard, histórico, estatísticas e comparador; limites temporais são iguais para todos os serviços; falta de fator não vira emissão zero.

### [#120](https://github.com/pentascripts-organization/EcoByteMetrics/issues/120) — Interface de Seleção de Serviços para Comparação

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Funcionalidade central já existe no GitHub; refinamentos locais.

**Em termos claros:** Permitir escolher e remover duas ou mais aplicações da comparação.

**O que já existe:** ComparisonPanel.tsx na develop já usa checkboxes e parâmetros app da URL. A cópia local acrescenta busca, chips e seleção em lote.

**Como executar:** Validar os seletores existentes e a persistência da seleção nos filtros/URL. Integrar os refinamentos locais por PR, se necessários. Um dropdown é um detalhe de apresentação a alinhar com o aceite, não motivo para duplicar a seleção existente.

**Aceite sugerido:** Selecionar/remover serviços, preservar filtros, tratar seleção indisponível e mostrar a comparação somente com pelo menos dois serviços.

### [#121](https://github.com/pentascripts-organization/EcoByteMetrics/issues/121) — Tabela Lado a Lado dos Indicadores do Comparador

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Parcial no GitHub; ampliada localmente.

**Em termos claros:** Comparar energia, carbono, CPU, memória e rede em uma tabela legível.

**O que já existe:** A develop já tem tabela de energia/emissões. Na cópia local, CPU, memória e rede aparecem como informações na célula da aplicação. A exibição de emissões usa kg CO₂e, enquanto a issue pede gCO₂e.

**Como executar:** Completar os indicadores no contrato e na interface; definir se CPU/memória/rede são última leitura ou agregados do período. Não apresentar recursos atuais como se fossem históricos. Padronizar ou explicar a conversão de unidade.

**Aceite sugerido:** Dois serviços exibem todos os indicadores e suas unidades; períodos e ausências ficam claros; tabela funciona em tela estreita.

### [#122](https://github.com/pentascripts-organization/EcoByteMetrics/issues/122) — Gráficos Pareados de Consumo (kWh) e Carbono gCO2e

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Pendente no GitHub; implementação local com ajuste necessário.

**Em termos claros:** Mostrar gráficos pareados de energia e carbono para os serviços selecionados.

**O que já existe:** A árvore de develop não contém ComparisonPairedChart.tsx; a cópia local contém e o build passou. O componente local usa ?? 0 para energia/carbono ausentes, o que pode representar desconhecido como impacto zero.

**Como executar:** Revisar o componente local para preservar null e indicar ausência de dados; unificar cores/ordem entre os gráficos; usar a mesma seleção e período da tabela; definir gCO₂e ou conversão documentada para kg. Depois integrar por PR.

**Aceite sugerido:** Gráfico e tabela concordam; falta de emissão não desenha uma barra de emissão zero; nomes longos, zero real e dispositivos móveis são tratados.

### [#123](https://github.com/pentascripts-organization/EcoByteMetrics/issues/123) — Atualização da Imagem Base no database/Dockerfile

**GitHub:** aberta. **Responsável:** @EnzoSuzukiProkopas.  
**Avaliação:** Reformular a premissa antes de executar.

**Em termos claros:** Garantir uma imagem PostgreSQL suportada e compatível com a configuração de persistência.

**O que já existe:** No GitHub está postgres:18-alpine; localmente está postgres:16-alpine. A afirmação da issue de que PostgreSQL 18 não existe está incorreta na data desta análise: há lançamento oficial e tag 18-alpine.

**Como executar:** Escolher e documentar a versão por compatibilidade real. Validar pull/build, PGDATA, diretório do volume e recuperação. Se optar por 16, revisar o mount junto com a mudança. Não apontar uma versão principal diferente diretamente para o cluster existente; planejar migração quando houver dados.

**Aceite sugerido:** Imagem escolhida disponível, banco sobe e preserva dados ao recriar o container; decisão de versão e procedimento de migração registrados.

### [#124](https://github.com/pentascripts-organization/EcoByteMetrics/issues/124) — Padronização de Variáveis de Ambiente e Portas no compose.yaml

**GitHub:** aberta. **Responsável:** @EnzoSuzukiProkopas.  
**Avaliação:** Pendente no GitHub e local.

**Em termos claros:** Eliminar nomes de variáveis e portas que confundem frontend e PostgreSQL.

**O que já existe:** compose.yaml ainda publica o frontend usando ${FRONT_PORT}:${PGPORT}; o healthcheck do backend também fixa 3000 apesar de PORT configurável.

**Como executar:** Trocar PGPORT por FRONTEND_INTERNAL_PORT, atualizar .env.example e referências. Alinhar nomes das URLs externas com API_METRIC/API_CARBON efetivamente usados. Fazer o healthcheck acompanhar a porta configurada e verificar a rede interna.

**Aceite sugerido:** docker compose config resolve corretamente; frontend e banco têm portas independentes; documentação e configuração usam os mesmos nomes.

### [#125](https://github.com/pentascripts-organization/EcoByteMetrics/issues/125) — Validação da Execução Containerizada via Docker Compose

**GitHub:** aberta. **Responsável:** @Cauaisq.  
**Avaliação:** Validação final pendente.

**Em termos claros:** Comprovar que frontend, backend, PostgreSQL e integrações funcionam juntos em containers.

**O que já existe:** Há Compose, Dockerfiles e entregas anteriores de infraestrutura; não executei o ambiente containerizado nesta análise.

**Como executar:** Após corrigir configuração e provisionamento, subir ambiente isolado; verificar healthchecks, login, coleta, histórico, mapa e comparador; reiniciar/recriar containers preservando o volume; simular queda/retorno das APIs.

**Aceite sugerido:** Registrar comandos, versões e evidências de fluxo completo. Mostrar que o histórico e os usuários continuam disponíveis após reinicialização.

### [#126](https://github.com/pentascripts-organization/EcoByteMetrics/issues/126) — Sincronização do DDL no README.md e Contratos na pasta docs/

**GitHub:** aberta. **Responsável:** Sem responsável.  
**Avaliação:** Pendente; documentação ainda contém inconsistências.

**Em termos claros:** Fazer os documentos representarem o banco, as rotas e a arquitetura reais.

**O que já existe:** Há divergências entre os documentos locais e o código. Na Sprint 2 em develop aparecem referências a schema.sql e US06 #8, mas os artefatos consultados usam DDL.sql e a US06 é #9.

**Como executar:** Comparar README, DDL.sql, migrations, routers, docs/api.md, docs/arquitetura.md e relatórios de sprint. Corrigir nomes, IDs, unidades, portas, variáveis, diagramas e links. Distinguir endpoint existente de planejado.

**Aceite sugerido:** Um integrante consegue iniciar o projeto seguindo apenas o guia e chamar as rotas documentadas; tabelas/colunas/IDs citados existem.

### [#127](https://github.com/pentascripts-organization/EcoByteMetrics/issues/127) — Fechamento do MVP e Apresentação Final

**GitHub:** aberta. **Responsável:** Sem responsável.  
**Avaliação:** Pendente; depende das entregas finais.

**Em termos claros:** Consolidar o MVP e as evidências acadêmicas da Sprint 3.

**O que já existe:** A issue exige auditoria dos 23 critérios, relatório e vídeo final. A cópia local tem o arquivo da Sprint 3 vazio; o arquivo não apareceu na árvore remota consultada.

**Como executar:** Preencher matriz de critérios com links verificáveis; concluir validação Docker e funcionalidades; revisar main; produzir roteiro, vídeo e relatório com entregas, limitações, participação e retrospectiva.

**Aceite sugerido:** Cada critério tem evidência real; relatório preenchido; vídeo acessível; versão demonstrada identificada por commit/tag.

### [#130](https://github.com/pentascripts-organization/EcoByteMetrics/issues/130) — Provisionamento DML de Usuários e Índices Compostos SQL

**GitHub:** aberta. **Responsável:** @ThiagoDT.  
**Avaliação:** Pendente no GitHub; parcialmente preparada localmente.

**Em termos claros:** Permitir o primeiro login e melhorar consultas de histórico com um índice adequado.

**O que já existe:** DML.sql em develop contém apenas instruções comentadas; localmente há INSERT de ADMIN, mas não de USER. O DDL já contém índice (date_houry,id_service), que não tem a mesma ordem do pedido (id_service,date_houry). Não foi encontrado schema.sql na árvore consultada.

**Como executar:** Definir provisionamento de ADMIN e USER de teste com hash bcrypt e configuração de implantação, evitando depender de credenciais fixas para uso real. Adicionar uma migration para o índice orientado às consultas por serviço/período, se EXPLAIN justificar; atualizar DDL.sql. Validar também banco já existente.

**Aceite sugerido:** Banco novo permite login conforme procedimento documentado; perfil USER não recebe permissão administrativa; migration funciona sem recriar dados; consulta usa o índice esperado.

### [#131](https://github.com/pentascripts-organization/EcoByteMetrics/issues/131) — Remoção de Código Morto e Módulos Órfãos no Backend

**GitHub:** aberta. **Responsável:** @Cauaisq.  
**Avaliação:** Parcialmente desatualizada; limpeza requer análise de dependências.

**Em termos claros:** Remover módulos realmente órfãos sem quebrar a coleta ativa.

**O que já existe:** WorkerCarbons e WorkerService ainda existem. Porém carbon-api.ts é importado pelo collector, pelo Dashboard e por Services; portanto sua exclusão direta quebraria código ativo. O app.ts remoto consultado contém uma definição direta de GET /metrics, não duas.

**Como executar:** Mapear imports e inicialização do worker. Remover apenas classes sem uso; se carbon-api.ts tiver de ser consolidado, migrar todos os consumidores primeiro. Atualizar a issue para retirar a duplicação de rota que não foi encontrada.

**Aceite sugerido:** Build e testes do backend passam; polling, carbono e dashboard continuam ativos; nenhum import aponta para arquivo removido.

### [#132](https://github.com/pentascripts-organization/EcoByteMetrics/issues/132) — Lógica de Contexto e Badges Semafóricas de Impacto

**GitHub:** aberta. **Responsável:** Sem responsável.  
**Avaliação:** Parcial; regra de impacto ainda precisa ser definida.

**Em termos claros:** Sinalizar visualmente tanto a disponibilidade quanto o impacto ambiental de cada aplicação.

**O que já existe:** Há cores para estados operacionais no código remoto. A cópia local tem StatusBadge, mas o status recebido não representa automaticamente consumo saudável ou pico.

**Como executar:** Definir limiares verificáveis para impacto, com período, unidade e tratamento de falta de dados. Diferenciar saúde operacional de impacto, pois online não significa baixo consumo. Mapear NO_METRICS para atenção e OFFLINE para indisponível; cobrir picos e valores sem fator.

**Aceite sugerido:** Casos conhecidos produzem verde/amarelo/vermelho conforme regra documentada; texto explica o estado; dados desconhecidos não recebem aparência de consumo baixo.

### [#133](https://github.com/pentascripts-organization/EcoByteMetrics/issues/133) — Estilização Condicional CSS das Badges Semafóricas

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Parcial no GitHub; estilos locais ainda divergem do aceite.

**Em termos claros:** Aplicar o visual das badges e cartões a partir das regras de estado/impacto.

**O que já existe:** Já existem indicadores coloridos na develop. Localmente há classes monitoring-badge--*, mas no-metrics está cinza, enquanto #132 pede amarelo.

**Como executar:** Concluir a regra de #132 e reutilizá-la nas classes CSS. Alinhar NO_METRICS ao estado de atenção aprovado, aplicar em cards/tabelas/mapa quando pertinente, garantir texto/ícone além da cor e respeitar movimento reduzido.

**Aceite sugerido:** Todos os estados e o pico de impacto têm apresentação coerente em desktop/mobile; leitura não depende apenas da cor.

### [#134](https://github.com/pentascripts-organization/EcoByteMetrics/issues/134) — Limpeza de Componentes Órfãos e Páginas Legadas

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Parcialmente desatualizada; revisar arquivos realmente órfãos.

**Em termos claros:** Reduzir duplicação e arquivos legados sem apagar reexports usados.

**O que já existe:** Os nomes App.tsx raiz, mensagem.tsx e home.service.ts citados não aparecem na árvore atual consultada. Há diretórios de compatibilidade/legado na cópia local; alguns arquivos podem apenas reexportar a implementação ativa.

**Como executar:** Partir de main.tsx, rotas e imports; separar componente ativo, reexport e arquivo sem referências. Atualizar a lista da issue; remover apenas os órfãos confirmados, ajustar aliases/imports e documentação.

**Aceite sugerido:** Build do frontend e testes passam, rotas continuam acessíveis e não restam imports quebrados. Não remover um reexport só por parecer duplicado.

### [#135](https://github.com/pentascripts-organization/EcoByteMetrics/issues/135) — Correção de Parâmetros de Teste de Integração e CSS Grid

**GitHub:** aberta. **Responsável:** @VtecturboBr.  
**Avaliação:** Aceite automatizado atendido localmente; validar e integrar.

**Em termos claros:** Alinhar o contrato HTTP usado nos testes e impedir que o Grid estoure a largura disponível.

**O que já existe:** Os 195 testes locais do frontend passaram, incluindo integração. Há minmax no CSS e envio explícito de view no adaptador. Isso não prova que a branch remota passa nem que todo layout é responsivo.

**Como executar:** Comparar a correção local com develop. Manter explícitos latest/analysis/history e preservar a autenticação do histórico; atualizar mocks para o contrato público. Revisar os grids que ainda têm larguras mínimas rígidas. Não afrouxar autenticação apenas para satisfazer um mock.

**Aceite sugerido:** Testes e build passam no commit do PR; histórico protegido continua exigindo sessão; textos longos e telas móveis não deformam os painéis.

## 4. Tasks fechadas: o que foi entregue e como conferir

As 38 tasks abaixo estão fechadas com motivo `completed` no GitHub. A coluna final descreve a entrega esperada, a evidência observada e/ou a verificação a preservar. **Não houve execução ponta a ponta de todas elas nesta análise.**

| Issue e título | Responsável atual | Descrição clara | Implementação/verificação |
| --- | --- | --- | --- |
| [#12](https://github.com/pentascripts-organization/EcoByteMetrics/issues/12) — Modelagem do Esquema do Banco de Dados e Scripts SQL | @ThiagoDT | Criar o esquema relacional do banco sem ORM. | Manter DDL.sql e migrations com tabelas, chaves e constraints; validar criação em banco vazio. A estrutura existe, mas novos campos devem acompanhar migrations. |
| [#13](https://github.com/pentascripts-organization/EcoByteMetrics/issues/13) — Configuração e Inicialização do Container PostgreSQL | @ThiagoDT | Disponibilizar PostgreSQL em container e inicializar o esquema. | Configurar credenciais, healthcheck e montagem dos scripts; verificar execução inicial e persistência. A validação final da configuração atual pertence a #123–#125. |
| [#14](https://github.com/pentascripts-organization/EcoByteMetrics/issues/14) — Orquestração da Aplicação via Docker Compose | @ThiagoDT | Subir os componentes com uma rede Docker comum. | Compose coordena banco, backend e frontend com depends_on/healthchecks. A entrega histórica está fechada; mudanças posteriores precisam passar por #125. |
| [#15](https://github.com/pentascripts-organization/EcoByteMetrics/issues/15) — Criar documentação técnica e instruções do sistema (Sprint 1) | @ViniciusGuin | Documentar instalação, arquitetura, banco e APIs na Sprint 1. | Manter README executável por outra pessoa e diagramas compatíveis com o código. Atualizações atuais estão em #126. |
| [#16](https://github.com/pentascripts-organization/EcoByteMetrics/issues/16) — Prototipagem Completa da Interface no Figma (Desktop e Mobile) | @VtecturboBr, @EnzoSuzukiProkopas | Definir protótipos desktop e mobile antes da implementação. | Manter link do Figma, telas, fluxos e aceite da equipe. Fechada no GitHub; não inspecionei o arquivo Figma nem sua aprovação. |
| [#17](https://github.com/pentascripts-organization/EcoByteMetrics/issues/17) — Estruturação de Componentes Responsivos em React + TS | @VtecturboBr, @EnzoSuzukiProkopas | Estruturar uma interface React/TypeScript adaptável a diferentes telas. | Separar páginas, componentes e rotas e validar tamanhos de tela. A estrutura está presente; o build e os testes locais passaram, sem validação visual nesta análise. |
| [#20](https://github.com/pentascripts-organization/EcoByteMetrics/issues/20) — Setup do Servidor Node.js com Arquitetura Modular | @ThiagoDT | Organizar o servidor Node/TypeScript em módulos. | Separar responsabilidades de rotas, controllers, services e repositories. A estrutura existe e há PR histórico #73; novo código deve seguir esse padrão. |
| [#21](https://github.com/pentascripts-organization/EcoByteMetrics/issues/21) — Integração com o Agregador de Métricas (/services) | @EnzoSuzukiProkopas, @Cauaisq | Descobrir serviços na API externa. | Consultar /services com validação de resposta e configuração de URL; reconhecer inclusões futuras sem reiniciar. Implementação de integração e coleta presente. |
| [#22](https://github.com/pentascripts-organization/EcoByteMetrics/issues/22) — Serviço de Polling Periódico no Backend Node.js | @ViniciusGuin | Executar descoberta e coleta periodicamente. | Agendar uma única rotina com controle de concorrência, duração e falhas; iniciar pelo servidor e não pela importação do app. A coleta atual está centralizada no collector. |
| [#23](https://github.com/pentascripts-organization/EcoByteMetrics/issues/23) — Coleta de Métricas por Serviço (/metrics/{id_servico}) | @EnzoSuzukiProkopas, @Cauaisq | Coletar os recursos de hardware de cada serviço. | Consumir /metrics/{id}, validar tipos/unidades e tratar ausência/falha por aplicação sem interromper as demais. Código e testes de contrato existem. |
| [#26](https://github.com/pentascripts-organization/EcoByteMetrics/issues/26) — Painel Operacional em React com Métrica e Estado | @VtecturboBr | Apresentar métricas e estados no dashboard. | Renderizar snapshot com carregamento, erro, vazio e atualização automática; não perder a última leitura válida durante falhas. Interface implementada. |
| [#27](https://github.com/pentascripts-organization/EcoByteMetrics/issues/27) — API de Indicadores Consolidados e Ranking | @EnzoSuzukiProkopas | Entregar indicadores consolidados e ranking por API. | Definir contratos de totais e ordenação e testá-los com dados conhecidos. Rotas e PR #81/#112 existem; a divergência de fórmula identificada exige #119. |
| [#28](https://github.com/pentascripts-organization/EcoByteMetrics/issues/28) — Ordenação e Ranking de Serviços por Maior Impacto | @EnzoSuzukiProkopas | Ordenar os serviços por impacto. | Permitir ordenar por energia/carbono, com empates e ausência de dados coerentes. Há interface e PRs #83/#84; revalidar após unificar a fórmula. |
| [#29](https://github.com/pentascripts-organization/EcoByteMetrics/issues/29) — Integração com o Serviço de Intensidade de Carbono | @ThiagoDT | Obter fatores de emissão por região. | Consultar e validar a API de carbono com timeout, preservar unidade e data do fator e tratar ausência. Há integração/collector e PR #98. |
| [#30](https://github.com/pentascripts-organization/EcoByteMetrics/issues/30) — Lógica de Cálculo de Consumo Energético e CO₂e | @ThiagoDT | Converter utilização e tempo em energia e emissões. | Calcular potência estimada, multiplicar pela duração e pelo fator regional correspondente. Entrega fechada com PR #104, mas o coeficiente 100 W versus 120 W continua divergente: #119. |
| [#31](https://github.com/pentascripts-organization/EcoByteMetrics/issues/31) — Consolidação de Indicadores Agregados | @ThiagoDT | Somar indicadores para obter totais e análises. | Agregar apenas amostras dentro da mesma janela, preservar cobertura e não inventar zeros para dados ausentes. Há estatísticas e PR #97; revisar a fonte RAM versus banco em #118/#119. |
| [#32](https://github.com/pentascripts-organization/EcoByteMetrics/issues/32) — Persistência do Histórico de Coletas (DML PostgreSQL) | @ThiagoDT | Gravar o histórico de coletas no PostgreSQL. | Persistir recursos, instante, intervalo e fator com SQL parametrizado e transação; evitar duplicações. Há repositories, migrations e PR #89; a persistência em reinicialização deve ser demonstrada por #125. |
| [#33](https://github.com/pentascripts-organization/EcoByteMetrics/issues/33) — Tratamento da Variação de Métricas a Cada Requisição | @ViniciusGuin | Refletir os valores diferentes recebidos em cada coleta. | Trocar o snapshot atual e inserir novas amostras sem modificar o passado. Há testes e PR #95; conferir que falhas não geram amostras artificiais. |
| [#34](https://github.com/pentascripts-organization/EcoByteMetrics/issues/34) — Detecção de Indisponibilidade de Serviços | @ViniciusGuin | Identificar quando um serviço não responde. | Distinguir timeout/indisponibilidade de métrica ausente e preservar última leitura com indicação de desatualização. Há PR #103 e testes de resiliência. |
| [#35](https://github.com/pentascripts-organization/EcoByteMetrics/issues/35) — Detecção de Ausência de Métricas em Serviços Ativos | @ViniciusGuin | Identificar serviço ativo sem telemetria. | Tratar resposta vazia/nula sem considerar consumo zero ou remoção. Há PR #105 e testes específicos. |
| [#36](https://github.com/pentascripts-organization/EcoByteMetrics/issues/36) — Middleware e Resiliência contra Quedas de APIs Auxiliares | @ViniciusGuin | Manter o sistema operante quando APIs externas falham. | Isolar erros por fonte/serviço, usar timeout, manter dados anteriores identificados e retomar coleta automaticamente. Há PR #106 e validação #102. |
| [#37](https://github.com/pentascripts-organization/EcoByteMetrics/issues/37) — Modelagem e Tabela de Usuários no PostgreSQL (DDL/DML) | @ThiagoDT | Armazenar usuários e perfis no banco. | Criar Users, unicidade de e-mail, hash e role; provisionar contas conforme procedimento. O modelo e PR #107 existem, mas o DML atual não provisiona contas: #130. |
| [#38](https://github.com/pentascripts-organization/EcoByteMetrics/issues/38) — Rota de Login e Emissão de Token JWT | @Cauaisq | Autenticar credenciais e emitir JWT. | Validar payload, comparar bcrypt e emitir token com expiração, sem expor senha/hash. Há Auth e PR #87; testar sucesso, senha errada, usuário inexistente e banco indisponível. |
| [#39](https://github.com/pentascripts-organization/EcoByteMetrics/issues/39) — Middleware de Proteção JWT no Backend | @Cauaisq | Exigir token nas rotas administrativas. | Validar assinatura/expiração, distinguir 401 de 403 e conferir perfil quando necessário. Há middleware e PR #94; preservar a proteção durante ajustes de #135. |
| [#40](https://github.com/pentascripts-organization/EcoByteMetrics/issues/40) — Tratamento de Segurança e Criptografia de Credenciais | @Cauaisq | Proteger credenciais e segredos. | Guardar senhas com bcrypt, manter segredo JWT fora do código e evitar devolver hash/senha em respostas. Issue fechada; revisar novas rotas e configuração de implantação ao concluir #130. |
| [#43](https://github.com/pentascripts-organization/EcoByteMetrics/issues/43) — Diagramação da Arquitetura do Sistema e Fluxos de Dados | @Cauaisq | Documentar componentes e fluxos da arquitetura. | Diagramar APIs auxiliares, backend, frontend, PostgreSQL e caminhos de coleta/autenticação. Artefatos existem; sincronização com a arquitetura atual entra em #126. |
| [#44](https://github.com/pentascripts-organization/EcoByteMetrics/issues/44) — Modelagem do Banco de Dados Relacional e Esquema MER | @ThiagoDT | Modelar entidades e relacionamentos. | Manter MER/DER coerentes com PK/FK e campos de DDL/migrations. Arquivos de modelagem presentes e PR #61; não houve revisão visual desses diagramas. |
| [#47](https://github.com/pentascripts-organization/EcoByteMetrics/issues/47) — Documentação das Rotas e Contratos da API REST | @ViniciusGuin | Especificar rotas e payloads da API. | Documentar método, URL, autenticação, filtros, campos, unidades e erros. Há docs/api.md e PR #68; o novo comparador/exportação deve atualizar esse contrato. |
| [#49](https://github.com/pentascripts-organization/EcoByteMetrics/issues/49) — Tratamento para Exibição de Cidade quando Disponível | @VtecturboBr, @ViniciusGuin | Exibir cidade quando a informação existir. | Usar cidade como detalhe opcional sem eliminar país/região nem exibir texto quebrado quando nula. Código de localização existe; validar com #53 e #117. |
| [#52](https://github.com/pentascripts-organization/EcoByteMetrics/issues/52) — Exibição do Horário e Intervalo da Última Atualização | @VtecturboBr | Informar quando ocorreu a última atualização. | Mostrar instante e intervalo reais de coleta e distinguir horário da amostra de horário da consulta. A interface e testes locais tratam atualização; não usar o relógio do navegador como prova de coleta. |
| [#80](https://github.com/pentascripts-organization/EcoByteMetrics/issues/80) — Módulo de Autenticação e Geração de Token JWT no Backend | @Cauaisq | Consolidar o módulo de autenticação JWT. | Organizar login, token e middleware com contratos comuns. Há PR #82; o escopo se sobrepõe a #38–#40 e não deve gerar outra implementação de login. |
| [#93](https://github.com/pentascripts-organization/EcoByteMetrics/issues/93) — Refatoração e Atualização da Documentação Técnica (Sprint 2) | @ViniciusGuin | Atualizar documentação técnica da Sprint 2. | Revisar README, banco, API, cálculos e rastreabilidade com base no código. PR #110 integrado; inconsistências documentais ainda encontradas devem ser resolvidas em #126. |
| [#99](https://github.com/pentascripts-organization/EcoByteMetrics/issues/99) — Validação do dashboard e do ranking | @VtecturboBr | Conferir se o dashboard e ranking exibem os resultados esperados. | Comparar indicadores e ordenação com uma massa conhecida, além de vazio e carbono ausente; registrar evidências. Issue fechada e testes locais presentes; não atesta equivalência entre fórmulas distintas. |
| [#100](https://github.com/pentascripts-organization/EcoByteMetrics/issues/100) — Validação da atualização e dos estados da tela | @VtecturboBr | Conferir atualização automática e estados de interface. | Simular carregamento, vazio, resposta incompleta e recuperação sem reload. Testes locais de integração/snapshot passaram; validação visual não foi refeita. |
| [#101](https://github.com/pentascripts-organization/EcoByteMetrics/issues/101) — Validação do contrato das rotas do dashboard | @EnzoSuzukiProkopas | Verificar o contrato das rotas usadas pelo dashboard. | Testar campos, formatos e status de sucesso/erro com dados previsíveis. PR #112 integrado; #113 amplia depois o payload de coordenadas na develop. |
| [#102](https://github.com/pentascripts-organization/EcoByteMetrics/issues/102) — Validação de falhas e recuperação das APIs auxiliares | @EnzoSuzukiProkopas | Verificar falhas e recuperação das APIs auxiliares. | Simular timeout, HTTP inválido e ausência de métricas; provar que uma falha não interrompe os demais serviços e que a retomada atualiza o estado. Há PR #112; testes de backend não foram reexecutados nesta máquina. |
| [#113](https://github.com/pentascripts-organization/EcoByteMetrics/issues/113) — Envio de Coordenadas JSON e Refatoração de Middleware | @Cauaisq | Disponibilizar coordenadas no JSON e extrair middleware de método HTTP. | PR #139 integrado à develop em 13/11/2026, 22h17, horário de São Paulo. app.ts remoto retorna coordenadas; methodNotAllowed foi extraído. Ainda não está na main consultada: falta promover e validar a integração final. |
| [#136](https://github.com/pentascripts-organization/EcoByteMetrics/issues/136) — Runbook de Contingência (docs/troubleshooting.md) e Retrospectiva | @EnzoSuzukiProkopas | Documentar recuperação de falhas e finalizar a retrospectiva da Sprint 2. | PR #138 integrado à develop em 13/11/2026, 21h41, horário de São Paulo. docs/troubleshooting.md existe e a seção de avaliação da Sprint 2 foi preenchida. Ainda não está na main consultada; a cópia local também não contém o runbook. |

### Entregas fechadas que ainda não estão na main consultada

- **#113:** [PR #139](https://github.com/pentascripts-organization/EcoByteMetrics/pull/139), integrado à develop. O backend passa a incluir coordenadas nos payloads e compartilha o middleware methodNotAllowed.
- **#136:** [PR #138](https://github.com/pentascripts-organization/EcoByteMetrics/pull/138), integrado à develop. Runbook e retrospectiva estão presentes remotamente.
- O [PR #137](https://github.com/pentascripts-organization/EcoByteMetrics/pull/137) foi fechado sem merge; ele não prova integração na main. Para #136, a evidência correta é o #138.
- O [PR #109](https://github.com/pentascripts-organization/EcoByteMetrics/pull/109), develop → main, foi integrado em 09/11/2026 no horário de São Paulo, antes dos PRs #138 e #139.

A promoção à main deve respeitar o processo de revisão do time e incluir as validações finais. Este relatório não alterou branches nem abriu PRs.

## 5. User Stories: situação e decisão de fechamento

Uma User Story descreve um resultado de produto e reúne várias tasks. O fechamento de suas subtasks não comprova automaticamente revisão, integração na main e vídeo quando esses itens fazem parte do DoD.

| História | GitHub / avaliação | O que representa | O que falta conferir |
| --- | --- | --- | --- |
| [#2](https://github.com/pentascripts-organization/EcoByteMetrics/issues/2) — US00 - Documentação e Engenharia Inicial de Requisitos | Fechada | Fundação técnica: repositório, documentação, SQL e containers. | Manter #12–#15 coerentes e validar novamente o ambiente após mudanças de configuração. |
| [#3](https://github.com/pentascripts-organization/EcoByteMetrics/issues/3) — US01 - UI Responsiva & Localização | Fechada; revisar cobertura | Interface responsiva e apresentação da localização dos serviços. | Conferir componentes e atualização automática; revisar #48/#53, abertas fora do projeto, antes de afirmar que todos os critérios de localização estão comprovados. |
| [#4](https://github.com/pentascripts-organization/EcoByteMetrics/issues/4) — US02 - Polling & Descoberta Dinâmica | Fechada | Descoberta automática e polling de serviços/métricas. | Validar #20–#23 e a retomada da coleta com inclusão de novos serviços. |
| [#5](https://github.com/pentascripts-organization/EcoByteMetrics/issues/5) — US03 - Dashboard & Ranking de Impacto | Aberta; candidata à revisão de fechamento | Dashboard com indicadores e ranking por impacto. | As subtasks #26–#28 e #99–#102 estão fechadas. Verificar a fórmula com #119 e conferir os requisitos de integração na main, revisão por colega e vídeo exigidos pelo DoD; só então fechar. |
| [#6](https://github.com/pentascripts-organization/EcoByteMetrics/issues/6) — US04 - Motor Ambiental & Histórico | Aberta; há pendência de consistência | Motor de cálculo de energia/carbono e histórico. | As subtasks #29–#32 estão fechadas, mas #119 mostra fórmula divergente e #118 exige fonte persistida unificada. Resolver consistência e validar cálculo/histórico antes do fechamento. |
| [#7](https://github.com/pentascripts-organization/EcoByteMetrics/issues/7) — US05 - Resiliência & Tolerância a Falhas | Aberta; candidata à revisão de fechamento | Resistir a falhas externas sem derrubar o painel. | #33–#36 e #102 estão fechadas. Anexar evidência de falha e recuperação no fluxo completo, revisar integração na main e os demais itens do DoD. |
| [#9](https://github.com/pentascripts-organization/EcoByteMetrics/issues/9) — US06 - Autenticação JWT na Configuração | Aberta; candidata à revisão de fechamento | Proteger as configurações com autenticação e autorização. | #37–#40 e #80 estão fechadas. Resolver o provisionamento de #130 e comprovar login, expiração, 401/403 e permissões em containers, além de revisão/vídeo. |
| [#10](https://github.com/pentascripts-organization/EcoByteMetrics/issues/10) — US07 - Visualização Geográfica em Mapa | Aberta; base implementada | Mostrar os serviços em mapa interativo. | #113 foi integrada à develop; #114–#117 continuam abertas. Validar pins, navegação, popup completo e coordenadas ausentes antes de promover para main. |
| [#11](https://github.com/pentascripts-organization/EcoByteMetrics/issues/11) — US08 - Comparador & Consolidação MVP | Aberta | Comparar serviços no mesmo período e entregar o MVP containerizado. | Concluir #118–#127: backend de comparação, fórmula e janela única, indicadores, gráficos, infraestrutura, documentação e demonstração final. |
| [#128](https://github.com/pentascripts-organization/EcoByteMetrics/issues/128) — US09 — Observabilidade, Relatórios e Otimização do Sistema | Aberta; escopo amplo e incompletamente detalhado | Dar suporte a auditoria, operação e manutenção: exportação, sinalização visual, retenção e desempenho. | Revisar #129–#136 e vincular #129 ao projeto se ela for válida. Retenção no PostgreSQL precisa de política, prazo e critério de aceite próprios; limite de observações no navegador não prova retenção no banco. Definir também métricas e limites de desempenho para encerrar a história. |

## 6. Dailies: registros administrativos

Dailies registram o que cada integrante fez, o próximo passo e os impedimentos. Não são funcionalidades pendentes do sistema.

| Daily | Estado | Como tratar |
| --- | --- | --- |
| [#57](https://github.com/pentascripts-organization/EcoByteMetrics/issues/57) — Daily - 07/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#58](https://github.com/pentascripts-organization/EcoByteMetrics/issues/58) — Daily - 08/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#62](https://github.com/pentascripts-organization/EcoByteMetrics/issues/62) — Daily 09/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#71](https://github.com/pentascripts-organization/EcoByteMetrics/issues/71) — Daily - 13/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#79](https://github.com/pentascripts-organization/EcoByteMetrics/issues/79) — Daily 20/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#85](https://github.com/pentascripts-organization/EcoByteMetrics/issues/85) — Daily 23/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#86](https://github.com/pentascripts-organization/EcoByteMetrics/issues/86) — Daily 26/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#88](https://github.com/pentascripts-organization/EcoByteMetrics/issues/88) — Daily 27/10 | Fechada | Registro histórico encerrado; manter conteúdo e vínculos às tasks da data. |
| [#90](https://github.com/pentascripts-organization/EcoByteMetrics/issues/90) — Daily 28/10 | Aberta | Revisar campos ainda vazios e registrar decisões existentes; depois encerrar como registro administrativo, sem inventar retrospectivamente atividades. |
| [#92](https://github.com/pentascripts-organization/EcoByteMetrics/issues/92) — Daily 29/10 | Aberta | Revisar campos ainda vazios e registrar decisões existentes; depois encerrar como registro administrativo, sem inventar retrospectivamente atividades. |

Responsável das dailies consultadas: @ViniciusGuin. #90 e #92 continuam abertas e contêm partes individuais não preenchidas.

## 7. Issues do repositório fora do resultado do filtro do projeto

Foram encontradas seis issues adicionais. Três são abertas e relevantes ao produto; outras três são dailies fechadas. Elas não estão incluídas nos totais de 78/29/49 do projeto.

### [#48](https://github.com/pentascripts-organization/EcoByteMetrics/issues/48) — Componente para exibição de país e região

**Estado:** aberta. **Responsável:** Sem responsável.

**O que é:** informar onde cada serviço está hospedado, com país e região em cards/tabelas.

**Situação:** a interface já trata localização e país, mas a presença e clareza da região em todos os pontos pedidos deve ser conferida. A US01 fechada não elimina esta issue aberta.

**Como fazer:** reutilizar o contrato de localização, apresentar país/região com fallback para ausências e manter cidade opcional. Validar nomes longos e nomes localizados.

**Aceite:** serviço com país/região mostra ambos claramente; ausência parcial não quebra o componente nem inventa localização.

### [#53](https://github.com/pentascripts-organization/EcoByteMetrics/issues/53) — Testes de componentes com dados geográficos incompletos

**Estado:** aberta. **Responsável:** Sem responsável.

**O que é:** provar que a localização incompleta não quebra dashboard, tabelas ou mapa.

**Situação:** há testes locais envolvendo coordenadas ausentes, mas isso não comprova todo o aceite visual desta issue.

**Como fazer:** usar dados com país sem cidade, região nula, país desconhecido, coordenadas nulas/inválidas e 0,0. Verificar componente, tabela e mapa e reaproveitar os testes de #117, evitando duplicação.

**Aceite:** testes pertinentes passam, serviços continuam acessíveis e evidências visuais cobrem desktop/mobile.

### [#129](https://github.com/pentascripts-organization/EcoByteMetrics/issues/129) — Exportação de relatórios ambientais em CSV e JSON

**Estado:** aberta. **Responsável:** Sem responsável.

**O que é:** baixar o histórico selecionado para auditoria, com período, energia e emissões.

**Situação:** não foi identificada a rota GET /reports/export nos roteadores inspecionados. Há um comentário na issue contendo apenas “ERRO”; ele não esclarece o escopo nem prova implementação.

**Como fazer:** confirmar o escopo válido da issue; adicionar ao projeto se fizer parte da US09. Reutilizar a consulta persistida; proteger o endpoint com JWT e, se previsto, perfil. Validar formato/período/IDs; gerar CSV com escape correto e JSON com metadados, unidades e ausência explícita; usar Content-Type e Content-Disposition adequados; adicionar botão com estados de carregamento/erro.

**Aceite:** usuário autenticado baixa ambos os formatos; 401 sem token; dados correspondem à mesma janela da consulta; caracteres especiais e valores ausentes são preservados; exportação grande tem limite definido.

### Dailies extras fechadas

| Issue | O que representa / como manter |
| --- | --- |
| [#24](https://github.com/pentascripts-organization/EcoByteMetrics/issues/24) — Daily 01/10 | Registro de alinhamento e planejamento inicial; manter relato e vínculos às entregas. |
| [#41](https://github.com/pentascripts-organization/EcoByteMetrics/issues/41) — Daily 02/10 | Registro de documentação, modelagem e prototipação; não representa código a implementar. |
| [#54](https://github.com/pentascripts-organization/EcoByteMetrics/issues/54) — Daily 05/10 | Registro de arquitetura, banco e interface; preservar como evidência de acompanhamento. |

## 8. Diferenças entre a cópia local e o GitHub

| Item | GitHub develop | Cópia local | Implicação |
| --- | --- | --- | --- |
| #122: gráficos pareados | Componente específico ausente na árvore | ComparisonPairedChart.tsx presente | Trabalho local precisa de revisão e integração; null convertido em zero deve ser corrigido. |
| #116: popup | Lista de grupo com nome/estado; serviço individual abre detalhes | Popup com energia/carbono adicionado para grupos | Há avanço local, mas o aceite do marcador individual ainda requer conferência. |
| #120: seleção | Checkboxes e parâmetros de URL | Busca, chips e ações em lote | Funcionalidade base já existe; refinamento local não deve ser contado como integrado. |
| #121: tabela | Energia/emissões | Informações de CPU/memória/rede adicionadas | Definir se recursos se referem ao mesmo período dos totais. |
| #132/#133: badge | Indicadores de status existentes | StatusBadge e classes específicas | Lógica de picos e NO_METRICS amarelo continuam exigindo ajuste/aceite. |
| #123: PostgreSQL | postgres:18-alpine | postgres:16-alpine | Não é uma correção validada só pela edição do Dockerfile; revisar versão e persistência. |
| #130: DML | Provisionamento comentado | INSERT de ADMIN | Não foi demonstrado provisionamento completo nem primeiro login em containers. |
| #135: view | Rotas públicas explícitas latest/analysis; demais consultas exigem autenticação | Router aceita ausência de view publicamente | Não confundir correção de mock com alteração autorizada do limite de autenticação. |
| #113: coordenadas em rotas legadas | Alterações integradas na develop | app.ts local não contém a mesma transformação remota | A cópia local não é o estado mais recente de todos os módulos. |
| #136: runbook | docs/troubleshooting.md presente | Arquivo ausente | Não recriar a task com base apenas na pasta local; recuperar a entrega remota quando integrar. |
| #127: relatório Sprint 3 | Arquivo não apareceu na árvore consultada | Arquivo vazio | Entrega documental final continua pendente. |

**Conclusão prática:** há divergências nas duas direções. Antes de juntar trabalho, criar uma branch a partir da develop atual e revisar o diff da cópia local por escopo; copiar a pasta inteira sobre o remoto pode perder entregas recentes.

## 9. Ordem recomendada de execução

| Ordem | Issues | Resultado esperado |
| --- | --- | --- |
| 1 | #119 | Fórmulas, unidades, duração e janela temporal coerentes; referência única para os próximos módulos. |
| 2 | #118 | Comparação de dados persistidos com contrato estável no backend. |
| 3 | #123, #124, #130 | Versão e persistência do banco, portas/variáveis e primeiro acesso reproduzíveis. |
| 4 | #114, #115, #117, #120, #135 | Validar e aproveitar as funcionalidades existentes; fechar apenas o que tiver evidência completa. |
| 5 | #116, #121, #122, #132, #133 | Integrar e completar o frontend, sem perder a semântica de dados ausentes e períodos. |
| 6 | #131, #134 | Limpar módulos confirmadamente órfãos com a arquitetura já estabilizada. |
| 7 | #129, US09/#128 | Exportação e definição verificável de retenção/desempenho; evitar escopo implícito sem aceite. |
| 8 | #125, #48, #53 | Validar conjunto containerizado e localização em cenários reais/incompletos. |
| 9 | #126 | Documentar a implementação final, incluindo as entregas #113 e #136. |
| 10 | #5, #6, #7, #9, #10, #11, #128, #127; #90/#92 | Revisar fechamento das histórias, integrar na main, concluir relatório/vídeo e encerrar registros administrativos. |

As tarefas independentes podem andar em paralelo pela equipe, mas os contratos e cálculos devem ser acordados antes de finalizar tabela, gráficos e exportação.

## 10. Evidências e limites da verificação

### Executado nesta análise

- Consulta de issues abertas/fechadas vinculadas ao Project 2 e conferência das duas páginas de issues do repositório.
- Consulta de responsáveis e motivo de fechamento; todas as 49 issues fechadas no recorte do projeto estão marcadas como completed.
- Consulta da lista de pull requests com estado e data de merge, distinguindo PR fechado de PR integrado.
- Leitura das árvores main/develop e de arquivos selecionados de API, dashboard, mapa, comparador, SQL, Compose, worker, retrospectiva e runbook.
- Inspeção da cópia local para comparação.
- **Frontend local: npm test — 195 testes aprovados, zero falhas.**
- **Frontend local: npm run build — TypeScript e Vite concluídos.** O Vite avisou sobre chunks grandes, incluindo o globo, o que reforça a necessidade de medir desempenho na US09.
- **Backend local: npm test não iniciou**, porque o comando tsx não está disponível nas dependências instaladas desta cópia. Isso é uma limitação do ambiente, não evidência de testes funcionais reprovados.

### Não comprovado nesta análise

- Execução real de Docker/PostgreSQL e integrações auxiliares.
- Validação visual/interativa de desktop/mobile, popup, acessibilidade e fluidez.
- Revisão do Figma, conteúdo dos vídeos e atendimento integral à rubrica acadêmica.
- Sucesso de testes/build das branches remotas: resultados locais não foram atribuídos à develop ou main.
- Campos/colunas/rascunhos/arquivo do Project, nem critérios de aceite externos não fornecidos.

### Referências de código e decisões

- [backend/src/modules/Dashboard/dashboard.service.ts](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/backend/src/modules/Dashboard/dashboard.service.ts): coeficiente de CPU do dashboard.
- [backend/src/modules/Monitoring/monitoring.router.ts](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/backend/src/modules/Monitoring/monitoring.router.ts): contrato e autenticação de consultas.
- [frontend/src/features/monitoring/components/ComparisonPanel.tsx](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/frontend/src/features/monitoring/components/ComparisonPanel.tsx): seleção e tabela remotas.
- [frontend/src/features/monitoring/components/map/RegionMap.tsx](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/frontend/src/features/monitoring/components/map/RegionMap.tsx): seleção de marcador e grupo.
- [frontend/src/features/monitoring/api/monitoring.ts](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/frontend/src/features/monitoring/api/monitoring.ts): validação de coordenadas e parâmetros.
- [database/DDL.sql](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/database/DDL.sql) e [database/DML.sql](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/database/DML.sql): estrutura, índice e provisionamento.
- [compose.yaml](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/compose.yaml) e [database/Dockerfile](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/database/Dockerfile): configuração de containers.
- [docs/troubleshooting.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/docs/troubleshooting.md) e [docs/sprints/sprint-2/sprint-2.md](https://github.com/pentascripts-organization/EcoByteMetrics/blob/develop/docs/sprints/sprint-2/sprint-2.md): evidências da #136.
- [Lançamento oficial do PostgreSQL 18, em 25/09/2025](https://www.postgresql.org/about/news/postgresql-18-released-3142/) e [catálogo oficial de imagens PostgreSQL](https://github.com/docker-library/official-images/blob/master/library/postgres): a tag 18-alpine existe; a premissa de #123 precisa ser corrigida.

Nenhuma issue, responsável, coluna, PR ou branch foi alterada. O relatório registra o estado observado e recomendações para conclusão.

