# ⚙️ Backend — EcoByteMetrics (GreenER)

API REST em Node.js, Express 5 e TypeScript. O Dockerfile e o CI usam Node.js 22. Os comandos locais também foram validados com Node.js 24. [app.ts](src/app.ts) registra as rotas, valida o transporte JSON e centraliza falhas inesperadas. [server.ts](src/server.ts) aplica as migrations antes de ouvir requisições, dispara a primeira coleta e inicia o agendamento.

| Camada | Responsabilidade e fonte |
|---|---|
| HTTP | Routers associam métodos, parâmetros e middlewares aos controllers. Controllers validam entradas e traduzem resultados e erros em respostas. Consulte o [contrato](../docs/api.md). |
| Negócio | Services validam regras de conta, serviço, localização, métrica, carbono e estatísticas. [AuthUserService](src/modules/Auth/auth.service.ts) mantém a dependência de repositório em estado privado, valida a credencial e emite o token. [UserService](src/modules/Users/user.service.ts) encapsula validação, normalização e hash. [StatisticService](src/modules/Statistics/statistics.service.ts) valida janelas e identificadores antes da consulta. |
| Persistência | Repositories executam SQL explícito com parâmetros. [pool do pg](src/db/connection.ts) recebe `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER` e `POSTGRES_PASSWORD`, usa os demais padrões do driver e registra erros do pool. |
| Coleta | [Worker](src/modules/Worker/worker.job.ts) agenda rodadas a cada 30 s e ignora novo disparo enquanto o anterior está em curso. [Coletor](src/modules/Monitoring/collector.ts) compartilha a promessa da rodada ativa, valida amostras, limita o paralelismo por lotes de seis e publica o estado após o commit. |
| Leitura | [Monitoramento](src/modules/Monitoring/monitoring.repository.ts) consulta o histórico persistido. [Estatísticas](src/modules/Statistics/statistics.repository.ts) agrega e compara por SQL. [Dashboard legado](src/modules/Dashboard/dashboard.service.ts) resume leituras em memória. |

## Integrações e falhas

O fluxo principal usa `fetch` em [metrics-api.ts](src/integrations/metrics-api.ts) para `GET /services` e `GET /metrics/{id}` em `API_METRIC`. [carbon-api.ts](src/integrations/carbon-api.ts) usa `GET /regions` em `API_CARBON`, valida o payload e fornece fatores por código regional. Quando a descoberta falha, o coletor preserva o catálogo em memória e sinaliza a indisponibilidade dos serviços conhecidos. Sem catálogo em memória, a rodada termina com erro. Falhas individuais são registradas por serviço. Ausência de fator preserva energia e deixa emissão desconhecida. Falha na transação impede a publicação da rodada. Consulte [arquitetura](../docs/arquitetura.md), [histórico](docs/HISTORY.md) e [cálculos](../docs/calculos.md).

## Autenticação

Cadastro público cria perfil `USER`. A senha é armazenada com bcrypt. Login emite JWT com `role` e cookie `ecobyte_session` HttpOnly e SameSite=Strict. A restauração verifica o cookie e a conta, preservando o vencimento original. Logout limpa o cookie e o JWT continua válido até expirar. Use HTTPS em produção com cookie Secure.

[auth.middleware.ts](src/modules/Auth/auth.middleware.ts) valida o Bearer. [admin.middleware.ts](src/modules/Auth/admin.middleware.ts) protege POSTs administrativos. [userAccess.middleware.ts](src/modules/Auth/userAccess.middleware.ts) permite à própria conta ou a `ADMIN` acessar operações de conta por ID. As configurações de coleta são somente leitura e a rota aceita Bearer de ambos os perfis. Os cartões de monitoramento da Administração aparecem somente para ADMIN na interface.

## Execução e testes

Para a pilha inteira, siga o [README principal](../README.md). Para desenvolvimento local, inicie o PostgreSQL do Compose, copie [backend/.env.example](.env.example) para `backend/.env` se necessário e aponte `POSTGRES_HOST=127.0.0.1` e `POSTGRES_PORT=5433` para o banco publicado. Configure segredos locais e use a mesma porta escolhida em `BACKEND_PROXY_TARGET` no frontend.

```powershell
npm ci
npm run dev
npm run build
npm test
```

Em `backend/`, `npm run start` executa o build. `npm run test:auth` executa o recorte unitário de autenticação. Os scripts `test:auth:postgres`, `test:worker:postgres` e `test:history:postgres` usam banco real e devem ser executados em ambiente de teste. O primeiro consulta o backend em execução e cria contas temporárias. Os demais exercitam persistência e recuperação do histórico. As condições estão em [backend-ci.yml](../.github/workflows/backend-ci.yml) e [tests/integration](tests/integration/).
