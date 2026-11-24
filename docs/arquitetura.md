# Arquitetura e fluxos de dados — EcoByteMetrics

## Contexto C4

```mermaid
flowchart LR
    U["Pessoa usuária"] --> E["EcoByteMetrics"]
    E --> M["Agregador de Métricas"]
    E --> C["Serviço de Intensidade de Carbono"]
```

O EcoByteMetrics estima energia e emissões a partir de métricas operacionais e fatores regionais. As APIs auxiliares são serviços externos. O backend preserva leituras gravadas quando uma coleta posterior falha.

## Containers C4

```mermaid
flowchart LR
    U["Navegador"] --> F["Frontend React e TypeScript<br/>Nginx"]
    F -->|Proxy /backend| B["Backend Express e TypeScript"]
    B -->|SQL parametrizado| P[("PostgreSQL")]
    B --> M["API de métricas"]
    B --> C["API de carbono"]
```

O [Compose](../compose.yaml) executa frontend, backend e PostgreSQL. O navegador acessa a API por meio do proxy. A aplicação usa SQL parametrizado no PostgreSQL, sem ORM.

## Arquitetura lógica do backend

```mermaid
flowchart LR
    App["app.ts · Express"] --> Auth["Auth · JWT e controle de acesso"]
    App --> R["Routers, controllers e serviços"]
    R --> Q["Repositórios de consulta"]
    W["worker.job.ts · agendamento"] --> Col["collector.ts · coleta"]
    Col --> Ext["Integrações HTTP externas"]
    Q --> Pool["db/connection.ts · pool"]
    Col --> Pool
    Pool --> Pg[("PostgreSQL")]
```

[server.ts](../backend/src/server.ts) executa as migrations antes de iniciar o servidor e o agendamento. [worker.job.ts](../backend/src/modules/Worker/worker.job.ts) evita rodadas concorrentes, e [collector.ts](../backend/src/modules/Monitoring/collector.ts) integra as fontes externas e persiste a rodada. O catálogo em memória atende as rotas de últimas leituras. As consultas analíticas usam dados persistidos.

## Coleta e persistência

```mermaid
sequenceDiagram
    participant W as Agendador
    participant C as Coletor
    participant A as APIs externas
    participant P as PostgreSQL
    W->>C: Dispara coleta periódica
    C->>A: Consulta catálogo, métricas e fatores regionais
    A-->>C: Leituras e fatores disponíveis
    C->>P: Persiste serviços, localizações, fatores, métricas e rodada
    P-->>C: Confirma a transação
    C-->>W: Atualiza o estado publicado da rodada
```

A rodada registra o catálogo e as falhas de coleta em `monitoring_collections`. A leitura guarda a intensidade disponível naquele momento. Leituras sem fator têm cobertura de emissões incompleta. O [DDL](../database/DDL.sql) estrutura a instalação nova, e as [migrations](../database/migrations/) adaptam bancos anteriores antes do uso.

## Consulta do dashboard e sessão

```mermaid
sequenceDiagram
    participant U as Navegador
    participant B as Backend
    participant P as PostgreSQL
    U->>B: POST /auth/login
    B->>P: Consulta a conta
    B-->>U: JWT e cookie HttpOnly
    U->>B: GET /api/monitoring com view e período
    opt Histórico detalhado
        B->>B: Valida o JWT por Bearer ou cookie
    end
    B->>P: Consulta catálogo e histórico persistido
    B-->>U: Snapshot com serviços, leituras e cobertura
```

A Visão geral usa `view=latest`. Evolução e Comparar usam `view=analysis`. O histórico detalhado exige autenticação. O adaptador [monitoring.ts](../frontend/src/features/monitoring/api/monitoring.ts) valida e normaliza o snapshot. A Administração consulta as configurações da coleta em modo somente leitura e usa as rotas de conta autenticadas. As permissões e os parâmetros estão na [documentação da API](api.md).

## Referências

- [README principal](../README.md)
- [API de Métricas](https://metrics.unilaunch.org/docs)
- [API de Intensidade de Carbono](https://carbon.unilaunch.org/docs)
