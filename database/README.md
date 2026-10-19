# 🗄️ Camada de Persistência — PostgreSQL Nativo

Este repositório contém a modelagem de dados relacional, os scripts DDL de criação de tabelas e as orientações de gerenciamento do banco PostgreSQL da plataforma **EcoByteMetrics**.

---

### 📌 Diretrizes Técnicas e de Engenharia (RP03)
* **SQL Nativo Explícito:** A estrutura e as manipulações de dados são executadas estritamente por instruções SQL puras em DDL e DML.
* **Proibição de ORMs:** Veto total ao uso de frameworks como Prisma, TypeORM ou Sequelize.
* **Consultas Parametrizadas:** Toda comunicação dinâmica utiliza *placeholders* (`$1`, `$2`) para impedir vulnerabilidades de *SQL Injection*.

---

### 📂 Estrutura da Pasta

```bash
database/
├── README.md       # Orientações para restauração, DML e volume Docker
└── DDL.sql      # Script DDL oficial de criação das tabelas e chaves
```

---

### 🛠️ Restaurando o Banco de Dados em um Ambiente Limpo

Para aplicar a estrutura oficial em um container PostgreSQL vazio, execute o comando abaixo no terminal:

```bash
docker exec -i greener_postgres psql -U greener_user -d greener_db < database/DDL.sql
```

---

### 🗃️ Modelo DDL Oficial (`database/schema.sql`)

O script `database/schema.sql` define a estrutura física relacional do sistema:

```sql
CREATE TABLE Users (
	id_user INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_user VARCHAR(50) NOT NULL,
	email_user VARCHAR(50) NOT NULL,
	password_user VARCHAR(25) NOT NULL,
	token_user VARCHAR(255) NOT NULL
);

CREATE TABLE Locations (
	id_location INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_location VARCHAR(50) NOT NULL,
	county_location VARCHAR(50),
	region_location VARCHAR(50),
	city_location VARCHAR(50),
	latitude_location DOUBLE PRECISION NOT NULL,
	logitude_location DOUBLE PRECISION NOT NULL
);

CREATE TABLE Services (
	id_service INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location INT,
	name_service VARCHAR(50),
	CONSTRAINT fk_service_location 
		FOREIGN KEY (id_location)
		REFERENCES Locations(id_location)
);

CREATE TABLE Metrics (
	id_metric INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_service INT,
	date_houry TIMESTAMP NOT NULL,
	path_metric VARCHAR(50) NOT NULL,
	colletion_interval_metric INT NOT NULL,
	cpu_metric NUMERIC NOT NULL,
	ram_metric NUMERIC NOT NULL,
	hd_metric NUMERIC NOT NULL,
	network_metric NUMERIC NOT NULL,
	CONSTRAINT fk_metric_service
		FOREIGN KEY (id_service)
		REFERENCES Services(id_service)
);

CREATE TABLE Cabons (
	id_carbon INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_location INT,
	date_houry TIMESTAMP NOT NULL,
	intesity_co2e_kwh_carbon INT NOT NULL,
	renewable_percent_carbon INT NOT NULL,
	CONSTRAINT fk_carbon_location
		FOREIGN KEY (id_location)
		REFERENCES Locations(id_location)
);
```

---

### 🔍 Localização das Consultas DML na Aplicação

As operações DML de manipulação de dados ficam isoladas nos repositórios do backend (`backend/src/modules/`):

#### 1. Inserção na Tabela `Metrics` (`metrics.repository.ts`)
```sql
INSERT INTO Metrics (
  id_service, date_houry, path_metric, colletion_interval_metric,
  cpu_metric, ram_metric, hd_metric, network_metric
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
```

#### 2. Consulta de Histórico Temporal de Amostragens (`collections.repository.ts`)
```sql
SELECT id_metric, id_service, date_houry, cpu_metric, ram_metric, hd_metric, network_metric
FROM Metrics
WHERE id_service = $1
ORDER BY date_houry DESC
LIMIT $2;
```

---

### 📊 Consulta para Análise e Agregação de Resultados

Query SQL utilizada pelo backend para consolidar os rankings de consumo e emissão por período:

```sql
SELECT 
    s.id_service,
    s.name_service,
    l.name_location,
    l.region_location,
    AVG(m.cpu_metric) AS media_cpu,
    AVG(m.ram_metric) AS media_ram,
    COUNT(m.id_metric) AS total_coletas
FROM Services s
JOIN Locations l ON s.id_location = l.id_location
JOIN Metrics m ON s.id_service = m.id_service
WHERE m.date_houry BETWEEN $1 AND $2
GROUP BY s.id_service, s.name_service, l.name_location, l.region_location
ORDER BY media_cpu DESC;
```

---

### 💾 Persistência de Dados em Container Docker

A preservação dos registros após a reinicialização dos containers é garantida pelo volume nomeado `pgdata` configurado no arquivo `compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: greener_postgres
    environment:
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```
