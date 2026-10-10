# Frontend · EcoByteMetrics

Interface em React com TypeScript, Vite e React Router. A página inicial usa cinco paisagens em carrossel automático. Pesquisa, dashboard e gerenciamento reutilizam a marca, as fontes e a identidade natural, com painéis claros e tons de verde.

A home está em `src/home`, com CSS limitado a essa página. A escala desktop aprovada é aplicada apenas enquanto a home está aberta; o dashboard e as demais rotas mantêm seus estilos e tamanhos. O exemplo de 0,072 gCO₂e em 60 segundos é ilustrativo e não representa uma coleta real.

## Executar com Docker

Na raiz do repositório, com Docker e Docker Compose instalados:

```sh
docker compose -f frontend/compose.yaml up --build -d
```

Acesse **http://localhost:5173**. Para encerrar:

```sh
docker compose -f frontend/compose.yaml down
```

O Dockerfile compila os arquivos e o Nginx serve a aplicação. O fallback para `index.html` permite acessar e recarregar diretamente qualquer rota. Este Compose executa apenas o frontend; a infraestrutura completa será integrada quando o backend estiver implementado.

## Desenvolvimento local

Para trabalhar na interface sem Docker, use Node.js 24 e npm:

```sh
cd frontend
npm ci
npm run dev
```

Comandos de verificação:

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Se a porta 5173 já estiver ocupada, defina `PLAYWRIGHT_PORT` com outra porta antes de executar os testes.

Os testes de navegador verificam navegação, estados vazios, persistência de preferências, formulário de login, parallax, movimento reduzido, seleção de país/cidade no globo e layout em desktop e celular. Também verificam a consulta sem WebGL. Para usar um Chrome já instalado, defina `PLAYWRIGHT_CHANNEL=chrome`; por padrão é usado o Chromium do Playwright.

## Telas disponíveis

| Rota | Conteúdo |
| --- | --- |
| `/` | Apresentação, proposta, funcionamento e propósito |
| `/pesquisa` | Globo 3D interativo, seleção de país e cidade, consulta de CO₂ e alertas |
| `/gerenciamento` | Prévia administrativa, filtros, edição de perfil e bloqueio de usuários de demonstração |
| `/dashboard` | Indicadores, histórico, estado do monitoramento e localização |
| `/servicos` | Lista, busca, filtro por estado e ordenação |
| `/emissoes` | Estrutura de análise de emissões e explicação do cálculo |
| `/energia` | Estrutura de análise de consumo e explicação do cálculo |
| `/comparar` | Seleção e estrutura de comparação de dois a quatro serviços |
| `/login` | Formulário visual de acesso com mostrar/ocultar senha |
| `/configuracoes` | Preferências locais de parallax e período padrão |

Rotas inexistentes apresentam uma página 404 com retorno ao início. O menu se adapta a telas menores, e cada página tem título próprio.

## Estado dos dados e autenticação

**O frontend consulta diretamente as APIs públicas do ambiente simulado do desafio. Autenticação e histórico em banco de dados ainda dependem do backend.**

- Ao abrir as telas de monitoramento, o adaptador consulta `https://metrics.unilaunch.org/services`, `https://metrics.unilaunch.org/metrics/{service_id}` e `https://carbon.unilaunch.org/regions`. As APIs permitem CORS e não exigem credenciais nas consultas implementadas. A home e o login não iniciam coletas.
- Há atualização automática a cada 30 segundos, atualização manual e uma nova consulta ao buscar uma região. Os países e cidades selecionáveis vêm das regiões cadastradas pela API de carbono. Cada serviço é associado ao fator pelo `location.region_code`, e nomes conhecidos são exibidos em português.
- O cálculo usa o intervalo `collection_interval_seconds` de cada resposta, com CPU máxima de 100 W, memória de 0,375 W/GB, disco de 0,01 W/GB e rede de 0,02 W/GB. Energia = potência × intervalo em horas ÷ 1.000; emissão = energia × fator regional em gCO₂e/kWh.
- Respostas parciais ou inválidas não geram estimativas inventadas. Serviços com erro de indisponibilidade são marcados como indisponíveis; erros de métricas e campos ausentes são identificados como sem métricas. Serviços removidos do registro mantêm identificação e histórico, com estado removido e métricas atuais vazias. Se o fator de carbono falhar, energia disponível continua visível e emissões sem fator são `—`.
- O histórico contém as coletas recebidas nesta sessão, com localização e código regional no momento da coleta. Recarregar a página limpa esse histórico. O período filtra os registros disponíveis em relação à última consulta; não recupera dias anteriores de um banco de dados. Totais somam os intervalos coletados, sem interpolar períodos não observados ou tratar dados ausentes como zero. Coletas simultâneas são agrupadas no gráfico e no ranking entre datas. Não há verificação de sobreposição entre intervalos; os totais representam a soma das estimativas coletadas, não uma medição contínua auditada.
- O controle **Usar dados de demonstração** ativa exemplos fixos e identificados, definidos em `src/services/demo.ts`. Os exemplos não representam respostas reais das APIs. O modo fica ativo apenas nesta sessão da aplicação; recarregar a página desativa a demonstração.
- No modo de demonstração, **Brasil / São Paulo** abre o dashboard, **França / Paris** mostra indisponibilidade e **Japão / Tóquio** mostra métricas incompletas. Esses exemplos são separados das respostas das APIs. No modo conectado, o comportamento depende dos serviços presentes na região na consulta atual. Uma região cadastrada sem serviços é informada como tal; uma região fora do catálogo mostra o alerta de região desconhecida.
- O dashboard mantém país e cidade na URL, filtra coletas da região e permite escolher uma data/hora limite. O retorno para agora remove esse limite, mantendo o período selecionado. Os indicadores de estado dos serviços e de participação renovável referem-se à última consulta, não ao histórico.
- Gerenciamento é uma prévia pública sem autenticação. Usuários são demonstrativos; editar perfis e bloquear/desbloquear não envia requisições nem altera usuários reais. Essas mudanças são descartadas ao sair da tela.
- A busca e os filtros trabalham sobre a lista de serviços; a seleção de comparação fica desabilitada enquanto ela estiver vazia.
- O login não autentica nem cria tokens. Ao enviar, informa que a integração ainda está pendente e limpa os campos. A aplicação não envia ou salva as credenciais.
- As configurações atuais são somente de visualização. Elas ficam no `localStorage` deste navegador e não configuram a coleta. A proteção JWT das configurações de monitoramento será responsabilidade do backend.
- Falhas de armazenamento das preferências são informadas; falhas de carregamento de indicadores também têm tratamento visual.

## Organização e integração futura

```text
src/
  components/  Marca, cenas decorativas, layout e elementos compartilhados
  contexts/    Contratos de contexto de monitoramento e preferências
  data/        Países e cidades do catálogo geográfico local
  hooks/       Acesso aos contextos e comportamento do parallax
  pages/       Telas acessíveis por rota
  providers/   Estado compartilhado, preferências e carregamento
  services/    Adaptador HTTP das APIs do desafio e demonstração explícita
  types/       Serviços, estados, coletas e configurações tipados
  utils/       Formatação dos indicadores
  App.tsx      Rotas, títulos e navegação de página
  styles.css   Identidade visual, responsividade e animação
```

O adaptador está em `src/services/monitoring.ts`, com contratos em `src/types/monitoring.ts`. Ele valida as respostas externas, limita o tempo das requisições e permite cancelar coletas ao sair das telas ou trocar de modo. Falhas no agregador preservam o último snapshot e são informadas na interface. A integração pode ser transferida para o backend quando coleta centralizada, persistência e autenticação estiverem disponíveis.

Documentação dos contratos: [Agregador de métricas](https://metrics.unilaunch.org/docs) e [Intensidade de carbono](https://carbon.unilaunch.org/docs). Testes automatizados usam respostas controladas desses contratos para não depender dos estados variáveis do simulador.

Para filtrar histórico por região, cada coleta precisa informar `serviceId`. Coordenadas e `renewablePercent` são opcionais por serviço. Porcentagem renovável não é tratada como porcentagem exclusivamente solar. Autorização administrativa e auditoria de requisições dependem do backend.

## Globo interativo

A pesquisa segue a ordem **país → cidade → Buscar**. Clicar no país destaca seus limites e aproxima a câmera; os marcadores e os botões mostram suas cidades. Trocar o país limpa a cidade anterior. É possível girar e aproximar o globo com mouse, toque ou os controles. O campo de país e a lista de cidades cadastradas permitem selecionar a região por teclado e continuam funcionando quando WebGL não está disponível. A lista de cidades evita sugestões de endereços salvos pelo navegador.

O globo usa [react-globe.gl](https://github.com/vasturiano/react-globe.gl) e Three.js, carregados apenas nas telas com mapa. A referência [cool-globe](https://github.com/RafalUlecki/cool-globe) foi analisada: seu aprofundamento é em estados/províncias, portanto a seleção de cidades foi implementada diretamente sobre a biblioteca utilizada por ele.

Os limites de 177 países são arquivos locais do Natural Earth. O catálogo estático de 243 cidades é usado apenas para traduzir nomes. Os marcadores e botões usam exclusivamente as coordenadas e cidades de referência retornadas por `GET /regions`; países com registros recebem destaque. Países sem registros e indisponibilidade do catálogo têm mensagens distintas. Origem e licença dos limites estão em [src/data/README.md](src/data/README.md). O fator se refere ao código regional, e a emissão calculada se refere aos serviços monitorados, não à emissão total da cidade.

O parallax usa eventos de ponteiro e `requestAnimationFrame`, com profundidade diferente para cada folha, sem renderizações React a cada movimento. Pode ser desativado nas preferências. Telas de toque e a preferência `prefers-reduced-motion` evitam o movimento decorativo.

As fontes estão instaladas no projeto, sem chamadas a Google Fonts. As imagens também são locais; sua origem e os prompts estão em [public/assets/README.md](public/assets/README.md).

Referências de implementação: [React](https://react.dev/learn), [Vite](https://vite.dev/guide/) e [React Router](https://reactrouter.com/start/declarative/installation).
