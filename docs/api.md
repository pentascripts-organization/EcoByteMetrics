# API REST do EcoByteMetrics

Os caminhos abaixo são do Express. No Docker, a interface usa o proxy Nginx e acrescenta o prefixo `/backend`. As rotas são definidas em [app.ts](../backend/src/app.ts) e nos [módulos](../backend/src/modules/).

## Autenticação e contas

| Método e rota | Entrada e acesso | Resposta |
|---|---|---|
| `POST /auth/login` | JSON com `email` e `password`. | `200` com `token`, `tokenType`, `expiresIn` e cookie de sessão. `400` para entrada inválida, `401` para credenciais inválidas, `403` para perfil inválido e `500` em falha interna. |
| `GET /auth/session` | Cookie `ecobyte_session`. | `200` com `token` e `tokenType`, `401` quando a sessão não é válida, `503` se a conta não pôde ser consultada. |
| `POST /auth/logout` | Limpa o cookie da sessão. | `200` com `loggedOut: true`. |
| `POST /api/users` | Público. JSON com `name_user`, `email_user` e `password_user`. | `201` com a conta criada. |
| `GET /api/users/:id_user` | Bearer JWT. A própria conta ou perfil `ADMIN`. ID inteiro positivo. | `200` com os dados da conta. |
| `PUT /api/users/:id_user` | Mesmo acesso da consulta. Envie nome, e-mail e nova senha. | `200` com a conta atualizada. |
| `DELETE /api/users/:id_user` | Mesmo acesso da consulta. | `200` após excluir a conta. |

As respostas de conta incluem `id_user`, `name_user` e `email_user`. O cadastro cria uma conta `USER`. Cadastro e edição rejeitam campos de perfil. O nome deve ter até 50 caracteres, o e-mail até 254, e a senha entre oito caracteres e 72 bytes. O middleware retorna `401` para JWT ausente ou inválido e `403` quando o perfil ou a conta não permite a operação. As rotas de conta podem retornar `400` por entrada inválida, `404` quando não encontram a conta e `409` por e-mail em uso. O cookie é HttpOnly. `/auth/session` consulta o cookie mesmo quando o cliente envia um cabeçalho Bearer. Consulte os [controllers de Auth](../backend/src/modules/Auth/auth.controller.ts) e [Users](../backend/src/modules/Users/user.controller.ts).

## Monitoramento da interface

### `GET /api/monitoring`

| Parâmetro | Valores |
|---|---|
| `view` | `latest` para o catálogo e as leituras recentes, público. `analysis` para as consultas públicas de Evolução e Comparar. `history` ou ausência do parâmetro para histórico detalhado, com Bearer JWT ou cookie de sessão. |
| `period` | `24h` ou `7d`. Padrão `7d`. |
| `until` | Instante ISO 8601 com fuso e segundos, até o momento atual. Sem o parâmetro, consulta até agora. |
| `service` | Identificador externo. Pode ser repetido até 100 vezes, com até 255 caracteres por identificador. Valores duplicados são reunidos. |

Exemplo público · `GET /api/monitoring?view=analysis&period=24h&service=checkout-worker`.

Trecho ilustrativo de uma resposta sem leituras — os demais metadados também fazem parte da resposta.

```json
{
  "source": "database",
  "services": [],
  "regions": [],
  "history": [],
  "historyIncluded": true,
  "historyPeriod": "24h",
  "historyUntil": "2026-11-20T15:00:00.000Z",
  "selectedAt": null,
  "totalEnergyKwh": null,
  "totalEmissionsG": null
}
```

O catálogo `services` traz o ID externo, nome, localização, estado e métricas da última leitura disponível. `regions` inclui os fatores regionais e o percentual renovável. Cada leitura histórica traz `serviceId`, `collectedAt`, `firstCollectedAt`, `energyKwh`, `emissionsG`, `sampleCount`, `emissionCount` e `intervalSeconds`. O campo `resources` contém médias de CPU (%), memória, disco e rede (GB), com duração em segundos, ou `null` quando indisponível. A energia é expressa em kWh e as emissões em gramas de CO₂e. `null` indica indisponibilidade, e zero é um valor válido. Aplicações sem coordenadas permanecem nas listas, sem marcador no mapa. A resposta também pode trazer observações, eventos de coleta e avisos de cobertura. O middleware da visão detalhada roda antes da validação dos parâmetros. Sem credencial válida, essa requisição pode receber `401`. A API responde com `400` quando a consulta é inválida, `413` ao exceder o limite de histórico e `503` se a consulta ao banco falhar. [Router](../backend/src/modules/Monitoring/monitoring.router.ts) · [Repositório](../backend/src/modules/Monitoring/monitoring.repository.ts)

### `GET /api/monitoring-settings`

Aceita Bearer JWT de `USER` ou `ADMIN` e retorna a configuração da coleta em modo somente leitura. O intervalo vem da constante do coletor. Responde `200` com `Cache-Control: no-store` ou `401` para token inválido ou ausente. O frontend exibe o cartão somente para `ADMIN`. [Registro em app.ts](../backend/src/app.ts)

```json
{
  "collectionIntervalSeconds": 30,
  "discovery": "automatic",
  "editable": false
}
```

## Diagnóstico e últimas leituras em memória

| Método e rota pública | Resposta |
|---|---|
| `GET /health` | `200` com `{"status":"ok"}`. |
| `GET /services` | `{ services, lastUpdatedAt }` com o catálogo descoberto e as coordenadas, quando informadas. |
| `GET /metrics` | `{ metrics }` com leituras recentes mantidas pelo coletor. |
| `GET /metrics/:serviceId` | Leitura recente por identificador externo. `404` com `metrics_missing` ou `503` com `metrics_unavailable`. |

## Recursos persistidos

Os GETs abaixo são públicos. As consultas individuais usam o identificador numérico do banco. Os POSTs exigem Bearer JWT com perfil `ADMIN`, recebem JSON e retornam `201` quando criam o registro. Os controllers de recursos usam `erro` para erros de domínio.

| Recurso | Consultas GET | Criação POST e entrada |
|---|---|---|
| Serviços | `/api/services/all`, `/api/services/loc/:id_location`, `/api/services/:id_service` | `/api/services` · `name_service`, `id_location`, `path_metric`, `active_service` e `metric` quando a criação inclui leitura. |
| Métricas | `/api/metrics/list/:id_service`, `/api/metrics/:id_metric` | `/api/metrics` · `id_service`, `date_houry`, `cpu_metric` (%), `ram_metric`, `hd_metric`, `network_metric` (GB) e `colletion_interval_metric` (s). |
| Intensidade de carbono | `/api/carbons/all`, `/api/carbons/loc/:id_location`, `/api/carbons/:id_carbon` | `/api/carbons` · `id_location`, `date_houry`, `intesity_co2e_kwh_carbon` (g CO₂e/kWh) e `renewable_percent_carbon` (%). |
| Localizações | `/api/locations/all`, `/api/locations/:id_location` | `/api/locations` · `name_location`, `country_location`, `region_location`, `city_location`, `latitude_location` e `longitude_location`. O repositório também suporta criação relacionada via `service` e `carbon`. |

Os nomes e tipos dos campos persistidos estão no [DDL](../database/DDL.sql). Os controllers devolvem registros ou listas conforme a operação. Consulte [Services](../backend/src/modules/Services/), [Metrics](../backend/src/modules/Metrics/), [Carbons](../backend/src/modules/Carbons/) e [Locations](../backend/src/modules/Locations/) para as validações de entrada.

## Indicadores e comparação SQL

Estas rotas são públicas. O dashboard atual usa o snapshot de `/api/monitoring` para suas abas e cálculos de apresentação.

| Método e rota | Consulta e resposta |
|---|---|
| `GET /api/dashboard/summary` | Resumo em memória com `totalServicos`, `servicosAtivos`, `servicosIndisponiveis`, `servicosSemMetricas`, `consumoTotalKwh`, `emissaoTotalCo2e` e `dataHoraUltimaAtualizacao`. |
| `GET /api/dashboard/ranking` | `periodo=1h\|24h\|7d`, padrão `24h`, e `ordenarPor=kwh\|co2e`, padrão `co2e`. Retorna `{ periodo, ordenadoPor, ranking }`. Parâmetro inválido retorna `400`. |
| `GET /api/statistics/summary` | Resumo de estatísticas persistidas. |
| `GET /api/statistics/ranking` | `periodo=1h\|24h\|7d\|30d` e `ordenarPor=kwh\|co2e`, com padrões `24h` e `co2e`. Valores inválidos retornam `400`. |
| `GET /api/statistics/energy` | Estatísticas de energia. Retorna `404` se não houver cálculos. |
| `GET /api/statistics/energy/:nome_service` | Energia por nome do serviço. Retorna `404` se o serviço não for encontrado. |
| `GET /api/statistics/metrics/compare` | `ids` com dois ou mais IDs numéricos positivos distintos, separados por vírgula. `period=week\|month\|year`. Retorna `{ success, period, data }`. Entrada inválida retorna `400`, serviço inexistente `404` e falha interna `500`. |

Exemplo · `GET /api/statistics/metrics/compare?ids=1,2&period=week`. Consulte o [controller de estatísticas](../backend/src/modules/Statistics/statistics.controller.ts) para os formatos de saída de cada consulta.

## Chamadas das integrações externas

| Origem | Chamada do coletor | Contrato usado |
|---|---|---|
| `API_METRIC` | `GET /services` | Catálogo de serviços com identificadores externos únicos, nomes e metadados de região. |
| `API_METRIC` | `GET /metrics/{id}` | Intervalo em segundos e CPU (%), RAM, disco e rede (GB). A coleta valida o intervalo positivo e os limites das métricas. |
| `API_CARBON` | `GET /regions` | `regions` e `total`. Cada região tem código, localização, intensidade e percentual renovável. |

Essas chamadas partem do backend, com timeouts de 10 s para métricas e 5 s para carbono. Os contratos públicos listam rotas adicionais, incluindo `/services/{id}` e `/carbon-intensity/{code}`. O fluxo atual usa as rotas da tabela. [OpenAPI de métricas](https://metrics.unilaunch.org/openapi.json) · [OpenAPI de carbono](https://carbon.unilaunch.org/openapi.json)

Consulte [metrics-api.ts](../backend/src/integrations/metrics-api.ts) e [carbon-api.ts](../backend/src/integrations/carbon-api.ts). `GET /reports/export` consta no backlog e está ausente do registro HTTP.

## Exemplos de verificação

Para o Docker local use a API direta em `http://localhost:3000` ou a origem do frontend em `http://localhost:5173/backend`. Para chamadas Bearer, use o token retornado pelo login de uma conta de teste. O exemplo de login abaixo usa valores ilustrativos.

```http
POST /auth/login
Content-Type: application/json

{"email":"conta@example.test","password":"senha-da-conta-de-teste"}
```

A resposta de sucesso tem o formato `{"token":"<JWT>","tokenType":"Bearer","expiresIn":"1h"}` com o vencimento de exemplo. Para restaurar, faça `GET /auth/session` com o cookie recebido. A resposta contém apenas `token` e `tokenType`. `POST /auth/logout` retorna `{"loggedOut":true}`. Para criar conta, envie a `POST /api/users` um JSON com `name_user`, `email_user` e `password_user`. Use `GET /api/users/1`, `PUT /api/users/1` com os mesmos campos ou `DELETE /api/users/1` com Bearer autorizado e ID de conta de teste. As respostas retornam o ID, nome e e-mail públicos, diretamente. Uma conta em base de teste teria o formato `{"id_user":1,"name_user":"Conta de teste","email_user":"conta@example.test"}`.

```http
GET /health
GET /services
GET /metrics
GET /metrics/checkout-worker
GET /api/dashboard/summary
GET /api/dashboard/ranking?periodo=24h&ordenarPor=co2e
GET /api/statistics/summary
GET /api/statistics/ranking?periodo=7d&ordenarPor=kwh
GET /api/statistics/energy
GET /api/statistics/energy/checkout-worker
GET /api/statistics/metrics/compare?ids=1,2&period=week
```

A resposta de saúde é `{"status":"ok"}`. Ela verifica o processo HTTP. Os resultados em memória dependem de rodadas publicadas desde o início do processo. Os resultados SQL dependem dos registros persistidos. [Testes das rotas de dashboard](../backend/tests/dashboard.routes.test.ts) e [teste de comparação](../backend/tests/statistics.compare.test.ts) registram exemplos de contrato com dados controlados.

Para o catálogo persistido, exemplos de consulta incluem `GET /api/services/all`, `GET /api/services/loc/1`, `GET /api/services/1`, `GET /api/metrics/list/1`, `GET /api/metrics/1`, `GET /api/carbons/all`, `GET /api/carbons/loc/1`, `GET /api/carbons/1`, `GET /api/locations/all` e `GET /api/locations/1`. O ID deve existir na base de teste para verificar a resposta de registro único. Restrições específicas e envelopes são definidos nos controllers vinculados na tabela. Em rotas com `methodNotAllowed`, um verbo incompatível retorna `405` com `Allow`. Uma rota desconhecida recebe `404` e falhas inesperadas capturadas pelo tratador central recebem `500`.

### Escritas de recursos persistidos

Os exemplos usam registros e IDs ilustrativos. Envie JSON com `Content-Type: application/json` e Bearer de `ADMIN`. O sucesso devolve o registro diretamente e `Location` com a URL por ID.

| Chamada | Corpo ilustrativo | Resposta e validação |
|---|---|---|
| `POST /api/services` | `{"id_location":1,"name_service":"checkout-worker","path_metric":"/metrics/checkout-worker","active_service":true}` | `201` com registro `services`. Identificador, nome, caminho e estado são validados no [serviço](../backend/src/modules/Services/services.service.ts). |
| `POST /api/metrics` | `{"id_service":1,"date_houry":"2026-11-20T15:00:00Z","cpu_metric":50,"ram_metric":2,"hd_metric":10,"network_metric":1,"colletion_interval_metric":60}` | `201` com registro `metrics`. A [validação](../backend/src/modules/Metrics/metric.service.ts) exige timestamp válido, intervalo positivo, CPU entre 0 e 100 e demais recursos não negativos. |
| `POST /api/carbons` | `{"id_location":1,"date_houry":"2026-11-20T15:00:00Z","intesity_co2e_kwh_carbon":85,"renewable_percent_carbon":50}` | `201` com registro `carbons`. Intensidade não negativa e renovável de 0 a 100. [Serviço](../backend/src/modules/Carbons/carbon.service.ts) |
| `POST /api/locations` | `{"name_location":"Jacarei","country_location":"Brasil","region_location":"SP","city_location":"Jacarei","latitude_location":-23.3,"longitude_location":-45.97}` | `201` com registro `locations`. Coordenadas finitas e dentro de seus limites. [Serviço](../backend/src/modules/Locations/location.service.ts) |

As escritas podem retornar `400` por entrada inválida ou restrição de referência, `401` por falta de autenticação, `403` por insuficiência de perfil, `409` por duplicidade e `500` em falha interna. As consultas persistidas retornam `200` com registro ou lista, `400` para ID inválido e `404` quando o serviço de domínio exige resultado e não encontra registros. Identificadores persistidos são diferentes dos IDs externos de monitoramento.

### Formatos adicionais de estatísticas

- `GET /api/statistics/summary` retorna `totalServicos`, `consumoTotalKwh`, `emissaoTotalCo2eKg`, `emissaoTotalCo2eG`, `sampleCount`, `coveredEmissionSamples` e `dataHoraUltimaAtualizacao`. As emissões podem ser nulas.
- `GET /api/statistics/ranking` retorna `{ periodo, ordenadoPor, ranking }`. Tanto ranking quanto resumo retornam `500` se a consulta falhar.
- A comparação de estatísticas recebe uma janela de 7 dias, 30 dias ou 12 meses calculada em UTC. Em `data`, cada linha tem `id_service`, `name_service`, `bucket_start`, `bucket_end`, `sample_count`, `energy_kwh` e `emissions_gco2e`. A interface **Comparar** consulta `view=analysis` para períodos ou `view=latest` para últimas amostras. [Tipos e SQL](../backend/src/modules/Statistics/statistics.repository.ts)
