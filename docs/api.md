# API REST do EcoByteMetrics

Os caminhos abaixo são do Express. No Docker, a interface usa o proxy Nginx e acrescenta o prefixo `/backend`. As rotas são definidas em [app.ts](../backend/src/app.ts) e nos [módulos](../backend/src/modules/).

## Autenticação e contas

| Método e rota | Entrada e acesso | Resposta |
|---|---|---|
| `POST /auth/login` | JSON com `email` e `password`. | `200` com `token`, `tokenType` e cookie de sessão. `400` para entrada inválida, `401` para credenciais inválidas. |
| `GET /auth/session` | Cookie `ecobyte_session`. | `200` com `token` e `tokenType`, `401` quando a sessão não é válida, `503` se a conta não pôde ser consultada. |
| `POST /auth/logout` | Limpa o cookie da sessão. | `200` com `loggedOut: true`. |
| `POST /api/users` | Público. JSON com `name_user`, `email_user` e `password_user`. | `201` com a conta criada. |
| `GET /api/users/:id_user` | Bearer JWT. A própria conta ou perfil `ADMIN`. | `200` com os dados da conta. |
| `PUT /api/users/:id_user` | Mesmo acesso da consulta. Envie nome, e-mail e nova senha. | `200` com a conta atualizada. |
| `DELETE /api/users/:id_user` | Mesmo acesso da consulta. | `200` após excluir a conta. |

O cadastro cria uma conta `USER`. Cadastro e edição rejeitam campos de perfil. O nome deve ter até 50 caracteres, o e-mail até 254, e a senha entre oito caracteres e 72 bytes. O middleware retorna `401` para JWT ausente ou inválido e `403` quando o perfil ou a conta não permite a operação. As rotas de conta podem retornar `400` por entrada inválida, `404` quando não encontram a conta e `409` por e-mail em uso. O cookie é HttpOnly. `/auth/session` consulta o cookie mesmo quando o cliente envia um cabeçalho Bearer. Consulte os [controllers de Auth](../backend/src/modules/Auth/auth.controller.ts) e [Users](../backend/src/modules/Users/user.controller.ts).

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

Cada leitura histórica traz `serviceId`, `collectedAt`, `firstCollectedAt`, `energyKwh`, `emissionsG`, contagens de amostras e duração. A energia é expressa em kWh e as emissões em gramas de CO₂e. `null` indica indisponibilidade, e zero é um valor válido. Aplicações sem coordenadas permanecem nas listas, sem marcador no mapa. A resposta também pode trazer observações, eventos de coleta e avisos de cobertura. A API responde com `400` quando a consulta é inválida, `413` ao exceder o limite de histórico e `503` se a consulta ao banco falhar. [Router](../backend/src/modules/Monitoring/monitoring.router.ts) · [Repositório](../backend/src/modules/Monitoring/monitoring.repository.ts)

### `GET /api/monitoring-settings`

Exige Bearer JWT e retorna a configuração da coleta em modo somente leitura. O intervalo vem da configuração do coletor.

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
| `GET /api/dashboard/summary` | Resumo do catálogo e das últimas leituras. |
| `GET /api/dashboard/ranking` | `periodo=1h\|24h\|7d`, padrão `24h`, e `ordenarPor=kwh\|co2e`, padrão `co2e`. Parâmetro inválido retorna `400`. |
| `GET /api/statistics/summary` | Resumo de estatísticas persistidas. |
| `GET /api/statistics/ranking` | `periodo=1h\|24h\|7d\|30d` e `ordenarPor=kwh\|co2e`, com padrões `24h` e `co2e`. Valores inválidos retornam `400`. |
| `GET /api/statistics/energy` | Estatísticas de energia. Retorna `404` se não houver cálculos. |
| `GET /api/statistics/energy/:nome_service` | Energia por nome do serviço. Retorna `404` se o serviço não for encontrado. |
| `GET /api/statistics/metrics/compare` | `ids` com dois ou mais IDs numéricos positivos distintos, separados por vírgula. `period=week\|month\|year`. Retorna `{ success, period, data }`. Entrada inválida retorna `400`. |

Exemplo · `GET /api/statistics/metrics/compare?ids=1,2&period=week`. Consulte o [controller de estatísticas](../backend/src/modules/Statistics/statistics.controller.ts) para os formatos de saída de cada consulta.
