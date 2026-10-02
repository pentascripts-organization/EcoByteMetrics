/* 
Instruções DDL para criar as tabelas, chaves, relacionamentos e restrições. 
Se houver evolução do esquema, a equipe pode utilizar scripts SQL numerados 
em vez de um único arquivo. 
*/
/* Este é um banco de dados de exemplo */
DROP TABLE IF EXISTS usuario;

CREATE TABLE IF NOT EXISTS usuario(
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

INSERT INTO usuario (nome)
VALUES ('EcoByteMetric');