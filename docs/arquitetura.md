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

## Componentes

```mermaid
flowchart LR
    HTTP["Express e tratamento de erros"] --> Auth["Auth e Users"]
    HTTP --> Monitor["Monitoring: snapshot e histórico"]
    HTTP --> Stats["Statistics: ranking e comparação SQL"]
    HTTP --> Cache["Dashboard e rotas em memória"]
    Worker["Worker: disparo inicial e periódico"] --> Collector["Collector: validação e orquestração"]
    Collector --> APIs["Clientes de métricas e carbono"]
    Collector --> Write["Repositório de rodadas"]
    Collector --> Cache
    Auth --> Pool["Pool pg"]
    Monitor --> Pool
    Stats --> Pool
    Write --> Pool
    Pool --> Pg[("PostgreSQL")]
```

[server.ts](../backend/src/server.ts) prepara o banco antes de iniciar o HTTP. [app.ts](../backend/src/app.ts) registra as rotas e o tratador de exceções. A [API](api.md) distingue o monitoramento persistido das rotas de diagnóstico e cache.

## Descoberta, coleta, carbono e persistência

```mermaid
sequenceDiagram
    participant W as Worker
    participant C as Coletor
    participant M as Agregador
    participant A as Serviço de carbono
    participant P as PostgreSQL
    W->>C: Dispara no início e a cada 30 segundos
    C->>M: GET /services
    alt Catálogo válido
        M-->>C: Catálogo atual
    else Descoberta falhou com catálogo em memória
        C->>C: Preserva catálogo em memória e sinaliza indisponibilidade
    else Descoberta falhou sem catálogo
        C-->>W: Encerra a rodada com erro
    end
    opt Rodada pode continuar
        C->>A: GET /regions
        A-->>C: Fatores regionais ou falha
        opt Descoberta bem-sucedida
            C->>M: GET /metrics por serviço em lotes de seis
            M-->>C: Amostra ou erro individual
        end
        C->>P: Persiste catálogo, fatores, métricas e rodada em transação
        alt Commit confirmado
            P-->>C: Confirma gravação
            C->>C: Publica catálogo, leituras e estados no cache
        else Falha de persistência
            C->>P: Rollback quando a transação foi iniciada
            C-->>W: Registra falha e mantém estado anterior
        end
    end
```

O [agendador](../backend/src/modules/Worker/worker.job.ts) ignora ciclos sobrepostos no mesmo processo. O [coletor](../backend/src/modules/Monitoring/collector.ts) valida a amostra e registra falhas por serviço. A [persistência](../backend/src/modules/Monitoring/collection.repository.ts) associa a intensidade pelo código regional. Quando falta fator, a energia continua disponível e a emissão tem cobertura incompleta.

## Snapshot, histórico, comparação e autenticação

```mermaid
sequenceDiagram
    participant U as Navegador
    participant B as API pelo proxy
    participant P as PostgreSQL
    loop Consulta da Visão geral
        U->>B: GET /api/monitoring?view=latest
        B->>P: Busca catálogo e leituras recentes
        B-->>U: Snapshot ou erro
    end
    opt Evolução ou comparação por período
        U->>B: GET /api/monitoring?view=analysis com intervalo
        B->>P: Busca histórico e cobertura da janela
        B-->>U: Série temporal
        U->>U: Prepara gráficos e compara serviços
    end
    opt Login e histórico detalhado
        U->>B: POST /auth/login
        B->>P: Consulta conta
        B-->>U: JWT e cookie HttpOnly, ou erro de login
        U->>B: GET /api/monitoring?view=history com sessão válida
        B->>P: Consulta histórica até o corte
        B-->>U: Leituras e metadados disponíveis
    end
```

A comparação pela última coleta reutiliza o snapshot resumido. O endpoint de comparação SQL atende consumidores da API e tem janela própria. O [adaptador do frontend](../frontend/src/features/monitoring/api/monitoring.ts) valida as respostas. Em falha HTTP, o [provider](../frontend/src/features/monitoring/providers/MonitoringProvider.tsx) pode preservar o snapshot anterior com indicação de indisponibilidade. A Administração usa consulta de configurações e operações da conta autenticada. O [router de autenticação](../backend/src/modules/Auth/auth.router.ts) restaura a sessão pelo cookie, e o [repositório de monitoramento](../backend/src/modules/Monitoring/monitoring.repository.ts) lê o histórico persistido.

## Referências

- [README principal](../README.md)
- [API de Métricas](https://metrics.unilaunch.org/docs)
- [API de Intensidade de Carbono](https://carbon.unilaunch.org/docs)
