# Frontend · EcoByteMetrics

React + TypeScript, Vite e React Router. Pesquisa regional, dashboard, serviços, energia, emissões, comparação e preferências locais.

## Executar

Use Node.js 24 e npm. O backend parte da develop, com a alteração autorizada da #52 descrita ao final.

Na pasta frontend, execute:

~~~powershell
npm ci
npm run dev
~~~

O comando inicia o backend existente quando ele não está rodando no endereço local configurado. Na primeira execução, instala suas dependências se necessário. Define API_METRIC no processo, sem editar arquivos do backend, e inicia o Vite. Um backend já ativo é reutilizado; ao encerrar, termina somente os processos que iniciou.

As rotas /health e /services não consultam PostgreSQL. A rota / e funcionalidades de banco dependem da configuração da equipe.

Para iniciar o backend separadamente ou apontar para um servidor remoto, use npm run dev:frontend ou configure AUTO_START_BACKEND=false em .env.local.

Acesse http://localhost:5173. Para outro endereço, copie .env.example para .env.local:

~~~dotenv
VITE_BACKEND_URL=/backend
BACKEND_PROXY_TARGET=http://127.0.0.1:3000
~~~

O Vite remove /backend antes de encaminhar a requisição. VITE_BACKEND_URL aceita uma URL pública completa. Variáveis VITE_ entram no cliente compilado; segredos JWT e credenciais do banco pertencem ao backend.

## Docker

Na raiz:

~~~powershell
docker compose -f frontend/compose.yaml up --build -d
~~~

Serve somente o frontend em http://localhost:5173. O navegador usa /backend; o Nginx encaminha para BACKEND_PROXY_TARGET=http://host.docker.internal:3000 por padrão. O backend precisa estar rodando no host. Configure outro destino nessa variável quando necessário; ela é aplicada na inicialização do container.

No Compose principal, o Dockerfile usa /backend e o Nginx encaminha chamadas para backend:3000 na rede do Compose, por padrão. O destino é parametrizado no template do Nginx. O fallback para index.html permite recarregar rotas diretamente.

## Integração e indicadores

- GET /backend/services usa { services, lastUpdatedAt } do backend do time.
- lastUpdatedAt: null informa descoberta inicial pendente. Lista vazia com data válida significa registro vazio; descoberta antiga gera aviso.
- Métricas usam GET /backend/metrics/{service_id}, com collectedAt retornado pelo backend; carbono continua em https://carbon.unilaunch.org/regions. Não há fallback automático para descoberta externa.
- Cálculos provisórios usam CPU máxima de 100 W; memória 0,375 W/GB; disco 0,01 W/GB; rede 0,02 W/GB. Energia = potência × intervalo em horas ÷ 1.000; emissões = energia × intensidade regional.
- Validação isola dados inválidos por serviço/região. Requisições têm cancelamento, limite de 10 segundos e até seis consultas de métricas simultâneas. Intervalos são inteiros não negativos; resultados não finitos não viram indicadores.
- Serviços indisponíveis, sem métricas e removidos são diferenciados. Energia continua visível quando faltam fatores de carbono; cobertura das emissões parciais é informada.
- Falha de descoberta preserva dados anteriores e o catálogo de cidades recebido da API de carbono. Sem nenhuma coleta válida, a pesquisa informa a falha e não oferece um dashboard vazio como consulta concluída.
- Polling a cada 30 segundos nas telas de monitoramento, incluindo detalhes de serviço. Abas ocultas pausam consultas; voltar à aba solicita nova coleta. Trocar período filtra o histórico e solicita os dados atuais imediatamente. A interface mostra a janela escolhida e o início das coletas disponíveis. Não há botão de atualização nos indicadores.
- Histórico permanece na sessão. Recarregar apaga registros. Períodos de 24 h, 7 d e 30 d não recuperam dados de banco.
- Totais e rankings somam estimativas por coleta no período, com quantidade e cobertura. Intervalos podem se sobrepor; não representam consumo contínuo acumulado.
- Comparação usa ciclos presentes em todos os serviços selecionados, normalizados pela duração informada. Emissões incompletas não produzem uma taxa completa.
- Gráfico usa distância real entre horários e oferece tabela acessível.
- Região, período e data permanecem na URL ao navegar. Busca, estado e ordenação da tabela sobrevivem à ida aos detalhes.
- Pesquisa preserva código regional quando cidades coincidem. Mapa da pesquisa mostra referências regionais; dashboard mostra coordenadas dos serviços.
- Participação renovável não significa participação exclusivamente solar.
- Preferências ficam em localStorage. Login, cadastro, autorização e administração real dependem do backend; nenhuma senha é enviada ou armazenada.
- Dados exibidos são das APIs. Modo demonstrativo e simulação de destino foram removidos.

## Telas

| Rota | Conteúdo |
|---|---|
| / | Apresentação, carrossel com pausa e movimento reduzido |
| /pesquisa | País, cidade, região, globo e alertas |
| /dashboard | Estimativas, cobertura, histórico, estados e mapa |
| /servicos/:id | Estado, recursos e histórico individual |
| /servicos | Busca, localização, CPU, RAM, disco, rede e fator |
| /emissoes, /energia | Estimativas e ranking por período |
| /comparar | Mesma janela, com taxas normalizadas |
| /configuracoes | Preferências locais |
| /login, /cadastro | Prévias desabilitadas; acesso público |
| /gerenciamento | Integração de usuários pendente e diagnóstico local de requisições |

Rotas desconhecidas exibem 404 com retorno útil à navegação. Falhas de carregamento oferecem recarregar ou voltar ao início. WebGL indisponível mantém pesquisa pelos campos.

## Verificar

~~~powershell
npm run lint
npm run typecheck
npm run build
npm run verify:backend
npx playwright install chromium
npm run test:e2e
~~~

Testes cobrem desktop e celular com respostas controladas. PLAYWRIGHT_PORT permite outra porta; PLAYWRIGHT_CHANNEL=chrome usa Chrome instalado.

verify:backend confere os arquivos originais do time e as exceções autorizadas da #52 registradas em docs/backend-authorized-changes.json.

[Tour completo do site](docs/tour-do-site.md) · [Revisão de navegação e requisitos](docs/revisao-frontend.md).

[Integração e pendências do backend](docs/integracao-frontend.md). Toda a documentação adicional desta entrega fica dentro de frontend/; README da raiz, banco e infraestrutura compartilhada permanecem iguais à referência develop. As exceções no backend são a integração e rota de métricas da #52 e seu teste.

## Organização e desempenho

src/components contém layout, gráficos, mapa e alertas; pages contém telas; providers guarda preferências e coletas; services reúne cliente HTTP; utils reúne formatação e análise. Home possui CSS próprio; dados geográficos são referências locais.

Quatro paisagens otimizadas em JPEG, até 1.920 px: aproximadamente 2,56 MB no total, com carregamento progressivo. Globo carregado sob demanda; seu módulo ainda concentra Three.js e a biblioteca de visualização.

Contratos externos: [agregador](https://metrics.unilaunch.org/docs) e [carbono](https://carbon.unilaunch.org/docs).

## Problemas de conexão em outro computador

Países vêm de um catálogo local, mas cidades e indicadores dependem de APIs. Iniciar somente o Vite, sem backend ativo ou sem API_METRIC no processo do backend, deixava a descoberta indisponível. O novo npm run dev prepara esse serviço automaticamente. Erros HTTP e respostas HTML no lugar de JSON possuem diagnóstico específico; o catálogo de carbono não é descartado junto com uma falha de descoberta.

Para acesso por outro dispositivo na rede, mantenha VITE_BACKEND_URL=/backend. Configure o destino no servidor com BACKEND_PROXY_TARGET; localhost numa URL pública do cliente apontaria para o próprio dispositivo de quem abre a página.

Referências: [proxy do Vite](https://vite.dev/config/server-options#server-proxy) e [templates da imagem oficial Nginx](https://github.com/nginx/docker-nginx/blob/master/entrypoint/20-envsubst-on-templates.sh).


## Horário das coletas (#52)

Métricas são consultadas pelo backend em GET /metrics/:serviceId. collectedAt representa o recebimento validado pelo backend, em UTC; não o instante da medição na origem. O frontend exibe o horário local e preserva a última coleta válida e seu histórico em caso de falha. Cada serviço mantém seu horário; gráficos e comparação agrupam as respostas do mesmo ciclo. Consultas automáticas a cada 30 segundos enquanto a página está visível; o intervalo de amostragem é o collection_interval_seconds retornado pela API.

## Otimizações do frontend

Datas locais são validadas pelo calendário; gráficos e ranking usam o maior horário dos registros mantidos no filtro, com identificação independente por ciclo. O histórico permanece completo na retenção de 30 dias; a tabela é montada ao abrir os detalhes e mostra 50 coletas por página. Registros de diagnóstico têm contexto separado. Análises são memorizadas e o histórico indexado por serviço.

Páginas e layout carregam sob demanda. O globo só é montado próximo à área visível. A home e a tela de acesso usam versões de 960 px das fotos em telas de até 680 px; as imagens originais otimizadas permanecem para telas maiores. Proxy /backend disponível tanto em dev quanto em preview. Nenhuma dependência da aplicação foi acrescentada.
