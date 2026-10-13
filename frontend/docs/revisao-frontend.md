# Revisão de navegação e requisitos do frontend

Revisão baseada nas imagens do desafio GreenER e no código integrado ao backend da equipe. Escopo: somente frontend/. O objetivo é transformar CPU, RAM, disco e rede em estimativas ambientais, acompanhar um ambiente dinâmico e apoiar comparação entre serviços e regiões.

## Problemas corrigidos nesta revisão

| Problema | Correção |
|---|---|
| Região perdida ao navegar para energia, emissões ou serviços | Contexto geográfico preservado nos links e exibido em todas as telas de análise |
| Período e data sem continuidade entre telas | Filtros na URL; todas as telas usam a mesma seleção |
| Data antiga filtrada dentro da janela atual, deixando registros corretos de fora | A janela histórica termina na data escolhida |
| Localização atual substituindo a localização de uma coleta anterior | Filtragem pelo código e pela localização registrados na coleta |
| IDs fora do catálogo bloqueando comparação | Seleção considera somente IDs válidos |
| Seleções rápidas substituindo o primeiro serviço da comparação | Atualização considera a URL já gravada antes de acrescentar ou remover IDs |
| Resposta atrasada da busca regional podendo redirecionar o usuário | Busca invalidada ao trocar seleção, fonte ou página |
| Consulta cancelada deixando atualização ocupada | Recuperação do estado de carregamento após cancelamento |
| Botão da página 404 recarregando o mesmo endereço inválido | Retorno à página anterior ou à pesquisa |
| Nome e marcador de serviço sem uma página própria | Rota de detalhes com estado, recursos, localização, histórico e retorno |
| Filtros da lista perdidos ao visitar um serviço | Busca, estado e ordenação preservados na URL e nos links de retorno |
| Login aparentemente preenchível sem autenticação | Prévia desabilitada e acesso público explícito |
| Aba de requisições sem informação real | Diagnóstico das últimas 50 requisições reais feitas pelo navegador |
| Preferências sem clareza sobre alterações pendentes | Aviso, salvar somente quando mudou e descartar |
| Foco insuficiente após navegação e páginas carregadas sob demanda | Foco no título disponível e títulos de documento por rota |
| Controles dispensáveis | Modo de demonstração, expansão para todas as regiões, simulação de destino e botão de atualizar removidos conforme solicitado |
| Valores extensos em cartões no celular | Quebra de texto e largura mínima corrigidas |

Foram preservados os tratamentos existentes de APIs indisponíveis, descoberta dinâmica, ausência de métricas, fatores parciais, dados antigos, precisão numérica, movimento reduzido e fallback de WebGL.

## Cobertura dos requisitos das imagens

| Requisito | Frontend atual e limite |
|---|---|
| RF01 — Descoberta | Consome /services do backend pelo proxy /backend |
| RF02 — Monitoramento dinâmico | Atualiza a cada 30 s; acompanha novos, removidos e retornos |
| RF03 — Métricas por serviço | Consulta o agregador externo, provisoriamente, enquanto o backend não possui essa rota |
| RF04 — Variação | Atualiza recursos e estimativas em cada ciclo |
| RF05 — Indisponibilidade | Estado próprio, motivo, retry e preservação de dados antigos em falha de descoberta |
| RF06 — Ausência de métricas | Estado separado; dados ausentes não viram zero |
| RF07 — Cálculo individual | Fórmula simplificada no frontend provisoriamente; detalhes por serviço |
| RF08 — Agregados | Somatórios, contagens, estados e cobertura com unidades |
| RF09 — Dashboard | Indicadores, localização, estados, fontes e histórico |
| RF10 — Histórico | Existe em memória; persistência e consulta de banco continuam pendentes no backend |
| RF11 — Atualização contínua | Polling e atualização manual; pausa em aba oculta |
| RF12 — Localização | País, região e cidade quando disponíveis |
| RF13 — Geografia | Referências de carbono na pesquisa; coordenadas de serviços no dashboard |
| RF14 — Ranking | Energia e emissões por serviço e ranking de datas por coleta |
| RF15 — Comparação | Dois a quatro serviços, ciclos em comum e normalização por duração |

“Mais eficiente” continua exigindo contexto: sem quantidade de transações ou trabalho realizado, consumo menor não demonstra melhor eficiência.

## Fluxo das imagens e responsabilidade por camada

A descoberta regional e a consulta de métricas levam ao dashboard, com caminhos próprios para região desconhecida, serviço indisponível e informações parciais. Falha de requisição não vira erro 404.

Cadastro, criptografia de credenciais, banco de usuários, sessão e permissões de administrador pertencem ao backend. Essas etapas do desenho ainda não podem funcionar com o contrato existente. A interface identifica suas prévias e não simula autenticação segura no cliente.

O armazenamento persistente do histórico também depende do backend. Filtros de 7 ou 30 dias não recuperam dados que ainda não foram coletados nesta sessão.

## Pendências fora do escopo

As rotas de métricas, carbono, cálculo, histórico, autenticação, administração e configurações protegidas continuam pendentes conforme [integração](integracao-frontend.md). A execução Docker compartilhada também depende da configuração de API_METRIC pela equipe.

Nenhuma dessas pendências foi resolvida alterando o backend. A verificação de hashes permanece disponível em npm run verify:backend, comparando os 39 arquivos versionados fora de frontend/ ao manifesto da develop.

Consulte o [tour](tour-do-site.md) para apresentação página por página.

## Validação da revisão anterior

Build com TypeScript/Vite e lint aprovados. Os 39 hashes fora de frontend/ conferem com o manifesto da develop.

Foram verificados 86 cenários Playwright em desktop e celular: 85 aprovados considerando as reexecuções focadas após correções; um teste de parallax é ignorado no celular porque o efeito usa mouse. A última reexecução dos seis casos afetados passou integralmente. Os testes usam respostas controladas, pois o ambiente externo muda durante o desafio.

A visita no navegador usada para as capturas do tour não apresentou erros JavaScript nem transbordamento horizontal.

Consulta real verificada em 13/10/2026: oito serviços exibidos no celular (390 px), respostas HTTP 200 na descoberta pelo backend, catálogo de carbono e oito consultas de métricas; nenhum aviso, erro JavaScript ou transbordamento horizontal nessa consulta.

Uma melhoria de desempenho permanece: o módulo do globo tem aproximadamente 1,77 MB minificado, apesar do carregamento sob demanda. O build informa esse tamanho; pesquisa pelos campos continua disponível sem WebGL.

## Simplificação atual

Somente dados das APIs. Recursos demonstrativos e simulação de outra região removidos. A atualização dos indicadores é automática, a cada 30 segundos, na entrada das páginas de monitoramento e ao retomar uma aba visível. O tour foi atualizado para esse fluxo.

Validação desta simplificação: build e lint aprovados; coleta automática e ausência dos controles verificadas em desktop/celular. Dos 86 cenários, 85 passaram após atualizar e reexecutar os quatro testes ligados aos recursos removidos; um teste de parallax é ignorado no celular. Os 39 arquivos do time fora de frontend/ permanecem preservados.
