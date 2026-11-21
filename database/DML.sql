-- Carga inicial de usuários padrão (ADMIN e USER).
-- As senhas são fornecidas por variáveis de ambiente e armazenadas como Bcrypt.
-- Não coloque senhas em texto puro neste arquivo ou no controle de versão.
--
-- Variáveis obrigatórias:
-- ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD
-- USER_SEED_NAME, USER_SEED_EMAIL, USER_SEED_PASSWORD

\set ON_ERROR_STOP on

\getenv admin_seed_name ADMIN_SEED_NAME
\getenv admin_seed_email ADMIN_SEED_EMAIL
\getenv admin_seed_password ADMIN_SEED_PASSWORD
\getenv user_seed_name USER_SEED_NAME
\getenv user_seed_email USER_SEED_EMAIL
\getenv user_seed_password USER_SEED_PASSWORD

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- crypt(..., gen_salt('bf', 10)) gera hashes Bcrypt compatíveis com bcryptjs.
-- ON CONFLICT mantém a carga idempotente e não sobrescreve contas existentes.
INSERT INTO Users (name_user, email_user, password_user, role_user)
VALUES (
    :'admin_seed_name',
    lower(trim(:'admin_seed_email')),
    CASE
        WHEN octet_length(:'admin_seed_password') BETWEEN 8 AND 72
        THEN crypt(:'admin_seed_password', gen_salt('bf', 10))
        ELSE NULL
    END,
    'ADMIN'
)
ON CONFLICT (email_user) DO NOTHING;

INSERT INTO Users (name_user, email_user, password_user, role_user)
VALUES (
    :'user_seed_name',
    lower(trim(:'user_seed_email')),
    CASE
        WHEN octet_length(:'user_seed_password') BETWEEN 8 AND 72
        THEN crypt(:'user_seed_password', gen_salt('bf', 10))
        ELSE NULL
    END,
    'USER'
)
ON CONFLICT (email_user) DO NOTHING;
