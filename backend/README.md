# ⚙️ Backend — EcoByteMetrics (GreenER)

O backend do **EcoByteMetrics** é uma API REST desenvolvida em **Node.js com TypeScript**, estruturada modularmente para realizar a descoberta automática de serviços, a coleta periódica de telemetria, o processamento de indicadores ambientais (kWh e CO₂e) e a persistência relacional no PostgreSQL.

---

### 🏗️ Arquitetura e Organização Modular

A aplicação adota uma divisão modular por recursos e domínios de negócio, separando as responsabilidades em **Routes**, **Controller**, **Service** e **Repository**:

```bash
backend/
├── README.md                 # Guia técnico do backend
├── Dockerfile                # Dockerfile para containerização do backend
├── package.json              # Dependências e scripts do projeto Node.js
└── src/
    ├── app.ts                # Configuração do Express e middlewares
    ├── server.ts             # Boot e inicialização do servidor HTTP
    ├── db/
    │   └── connection.ts     # Configuração da conexão com o PostgreSQL via driver nativo 'pg'
    ├── integrations/         # Clientes de consumo das APIs auxiliares
    │   ├── api.types.ts      # Fica todos os tipos de interface usada no APIs auxiliares
    │   ├── metrics-api.ts    # Cliente do Agregador de Métricas
    │   ├── services-api.ts   # Cliente do Agregador de Services
    │   └── carbon-api.ts     # Cliente do Serviço de Intensidade de Carbono
    └── modules/              # Módulos organizados por recursos REST
        ├── Auth/             # Gerencia login de usuarios
        │   ├── Auth.routes.ts
        │   ├── Auth.controller.ts
        │   ├── Auth.service.ts
        │   ├── Auth.service.ts
        │   └── Auth.middlewere.ts
        │   └── userAccess.middleware.ts
        │
        ├── Services/         # Cadastra, atualiza e visualiza serviços
        │   ├── services.routes.ts
        │   ├── services.controller.ts
        │   ├── services.service.ts
        │   └── services.repository.ts
        ├── Metrics/          # Amostragem de recursos de hardware
        ├── Locations/        # Cadastra, atualiza e visualiza localização
        ├── Statistics/       # calcula o rank de dos serviços que emitiram CO2 e kwl e mostra o total somado de todos os serviços
        ├── Worker/           # Descoberta e monitoramento dinâmico de serviços e metricas
        ├── Carbon/           # Cadastra, atualiza e visualiza fatores ambientais de emissão regional
        └── Users/            # Autenticação e gestão de acessos com JWT
   
```

#### Atribuição das Camadas
* **Routes:** Mapeia as URLs baseadas em recursos (`/services`, `/collections`) e associa aos verbos HTTP correspondentes (`GET`, `POST`, `PUT`, `DELETE`).
* **Controllers:** Processa os dados da requisição HTTP (`params`, `query`, `body`), repassa ao serviço correspondente e devolve respostas JSON com códigos de status coerentes (`200`, `201`, `400`, `404`, `500`,`502`).
* **Services:** Executa as regras de negócio, os algoritmos de conversão energética e o orquestramento de chamadas.
* **Repositories:** Concentra as consultas DML diretamente no PostgreSQL utilizando SQL nativo e parametrizado (`$1`, `$2`), sem o uso de ORM.

---

### 🔌 Integração com APIs Auxiliares

O backend conecta-se a dois serviços externos para simular o ambiente corporativo e obter os fatores ambientais:

1. **Agregador de Métricas (`metrics-api.ts` e `services-api.ts`):**
   * `GET /services`: Realiza a descoberta dos microsserviços ativos no ambiente.
   * `GET /services/{id_servico}`: Realiza a descoberta do microsserviço especifico ativos no ambiente.
   * `GET /metrics/{id_servico}`: Coleta amostras de consumo de CPU, memória, disco e rede (`cpu_metric`, `ram_metric`, `hd_metric`, `network_metric`).
2. **Serviço de Intensidade de Carbono (`carbon-api.ts`):**
   * `GET /carbon-intensity/{code}`: Obtém a intensidade de carbono em gCO₂e/kWh e a porcentagem de energia renovável da região.

---

### 🗄️ Conexão e Persistência no PostgreSQL (Sem ORM)

A comunicação com o banco PostgreSQL é mantida pelo driver nativo `pg`. Todas as inserções e seleções utilizam *placeholders* para prevenir vulnerabilidades de *SQL Injection*:

```typescript
// Exemplo em src/modules/metrics/metrics.repository.ts
import { dbClient } from '../../db/connection';

export class MetricsRepository {
  async insertMetric(
    serviceId: number,
    path: string,
    interval: number,
    cpu: number,
    ram: number,
    hd: number,
    network: number
  ): Promise<void> {
    const query = `
      INSERT INTO Metrics (
        id_service, date_houry, path_metric, colletion_interval_metric,
        cpu_metric, ram_metric, hd_metric, network_metric
      )
      VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7);
    `;
    await dbClient.query(query, [serviceId, path, interval, cpu, ram, hd, network]);
  }
}
```

---

### ⚙️ Variáveis de Ambiente (`.env`)

```env
#Variaveis de ambiente  do database
DB_HOST=postgres
DB_PORT=5432
DB_USER=greener_user
DB_PASSWORD=greener_pass
DB_NAME=greener_db

#Varieveis de ambiente do backend
PORT=3000
PORT_CONTEINER=3000
API_METRIC="https://metrics.unilaunch.org"
API_CARBON="https://carbon.unilaunch.org"
JWT_SECRET=sua_chave_secreta_jwt
DEFAULT_EXPIRES_IN_SECONDS=3600

#Variaveis do ambiente do frontend
FRONT_PORT=8080
PGPORT=80
```

---

### 🚀 Instruções de Execução

#### Comfiguração .env
   *Copie o arquivo .env acima e coloque ele na area que esta o arquivo de exemplo do .env.example

#### Modo Containerizado (Docker Compose)
  *No modo de Containerizão o usuario precisa ter instalado na maquina o Dorker.
  Para build de todos do conteiner use o comando abaixo:
  
```bash
docker compose up backend --build -d
```
  *O paramentro -d é para execultar dos conteiners em segundo plano, sendo assim não mostrar os logs dos conteiners no terminal.

  *Para executar somente um conteiner o codigo é este:
```bash
docker compose up -d nome_do_servico
```
  *Caso queira parar e deletar os conteiners user este comando:
```bash
docker compose down 
```
  *O paramentro -v representa o volume do compose, sendo para, deleta, e exclui o volume do conteiner.
```bash
docker compose down -v
```