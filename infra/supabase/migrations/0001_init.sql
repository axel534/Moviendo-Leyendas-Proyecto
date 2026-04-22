-- 0001_init.sql
-- Migracion inicial. Se aplica automaticamente en el contenedor local
-- (docker-compose monta este directorio en /docker-entrypoint-initdb.d)
-- y tambien es compatible con `supabase db push` cuando migremos a Supabase.

-- Extensiones comunes
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabla de ejemplo. Borrarla cuando exista el primer modelo real.
create table if not exists example_items (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz not null default now()
);
