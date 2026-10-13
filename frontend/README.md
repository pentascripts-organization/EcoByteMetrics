# Frontend · EcoByteMetrics

React + TypeScript, Vite e React Router. Pesquisa regional, dashboard, serviços, energia, emissões, comparação e preferências locais.

## Executar

Use Node.js 24 e npm. O backend foi copiado da develop sem alterações.

Em um terminal na raiz do projeto, inicie o backend para descoberta de serviços:

~~~powershell
cd backend
npm ci
npm run build
$env:API_METRIC = 'https://metrics.unilaunch.org'
$env:PORT = '3000'
npm start
~~~

As variáveis acima valem somente para o processo iniciado. As rotas /health e /services não consultam o banco; a rota / depende de PostgreSQL configurado pela equipe.

Em outro terminal, na pasta frontend:

~~~powershell
npm ci
npm run dev
~~~

Acesse http://localhost:5173. Para outro endereço, copie .env.example para .env.local:

~~~dotenv
VITE_BACKEND_URL=/backend
BACKEND_PROXY_TARGET=http://localhost:3000
~~~

O Vite remove /backend antes de encaminhar a requisição. VITE_BACKEND_URL aceita uma URL pública completa. Variáveis VITE_ entram no cliente compilado; segredos JWT e credenciais do banco pertencem ao backend.

## Docker

Na raiz:

~~~powershell
docker compose -f frontend/compose.yaml up --build -d
~~~

Serve somente o frontend em http://localhost:5173. Seu Compose compila VITE_BACKEND_URL=http://localhost:3000 por padrão. Defina outro endereço antes do comando, se necessário; alterar essa URL exige nova compilação.

No Compose principal, o Dockerfile usa /backend e o Nginx encaminha chamadas para backend:3000 na rede do Compose. O fallback para index.html permite recarregar rotas diretamente.

## Integração e indicadores

- GET /backend/services usa { services, lastUpdatedAt } do backend do time.
- lastUpdatedAt: null informa descoberta inicial pendente. Lista vazia com data válida significa registro vazio; descoberta antiga gera aviso.
- Métricas continuam em https://metrics.unilaunch.org/metrics/{service_id}; carbono em https://carbon.unilaunch.org/regions. Não há fallback automático para descoberta externa.
- Cálculos provisórios usam CPU máxima de 100 W; memória 0,375 W/GB; disco 0,01 W/GB; rede 0,02 W/GB. Energia = potência × intervalo em horas ÷ 1.000; emissões = energia × intensidade regional.
- Validação isola dados inválidos por serviço/região. Requisições têm cancelamento, limite de 10 segundos e até seis consultas de métricas simultâneas. Intervalos são inteiros não negativos; resultados não finitos não viram indicadores.
- Serviços indisponíveis, sem métricas e removidos são diferenciados. Energia continua visível quando faltam fatores de carbono; cobertura das emissões parciais é informada.
- Falha de descoberta preserva dados anteriores, identificados no cabeçalho como antigos.
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

verify:backend compara os hashes Git dos 39 arquivos versionados fora de frontend/ com [docs/backend-origin.json](docs/backend-origin.json). Arquivos gerados por instalação e compilação ficam fora dessa cópia.

[Tour completo do site](docs/tour-do-site.md) · [Revisão de navegação e requisitos](docs/revisao-frontend.md).

[Integração e pendências do backend](docs/integracao-frontend.md). Toda a documentação adicional desta entrega fica dentro de frontend/; README, banco, backend e infraestrutura compartilhada permanecem iguais à develop.

## Organização e desempenho

src/components contém layout, gráficos, mapa e alertas; pages contém telas; providers guarda preferências e coletas; services reúne cliente HTTP; utils reúne formatação e análise. Home possui CSS próprio; dados geográficos são referências locais.

Quatro paisagens otimizadas em JPEG, até 1.920 px: aproximadamente 2,56 MB no total, com carregamento progressivo. Globo carregado sob demanda; seu módulo ainda concentra Three.js e a biblioteca de visualização.

Contratos externos: [agregador](https://metrics.unilaunch.org/docs) e [carbono](https://carbon.unilaunch.org/docs).
