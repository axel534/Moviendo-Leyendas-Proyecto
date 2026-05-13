-- 0004_v1_schema.sql
-- Extiende el modelo de datos para soportar la V1 navegable de la plataforma.
-- Mantiene las tablas talentos/marcas existentes para el panel admin.
-- Agrega: matches, mensajes, posts_vitrina.

create type plan_tipo as enum ('free', 'pro', 'premium');
create type match_estado as enum ('nuevo', 'solicitado', 'conectado', 'rechazado');

-- Plan y puntuación en talentos
alter table talentos
  add column if not exists plan plan_tipo default 'free',
  add column if not exists puntuacion int default 50;

alter table marcas
  add column if not exists plan plan_tipo default 'free',
  add column if not exists puntuacion int default 50;

create table if not exists matches (
  id              uuid primary key default uuid_generate_v4(),
  talento_id      uuid references talentos(id) on delete cascade,
  marca_id        uuid references marcas(id) on delete cascade,
  porcentaje      int check (porcentaje between 0 and 100),
  razones         jsonb,
  estado          match_estado not null default 'nuevo',
  iniciado_por    text check (iniciado_por in ('talento', 'marca')),
  created_at      timestamptz not null default now()
);

create index if not exists matches_talento_idx on matches(talento_id);
create index if not exists matches_marca_idx on matches(marca_id);

create table if not exists mensajes (
  id          uuid primary key default uuid_generate_v4(),
  match_id    uuid references matches(id) on delete cascade,
  autor_tipo  text check (autor_tipo in ('talento', 'marca', 'ia')),
  texto       text not null,
  tipo_ia     text,
  created_at  timestamptz not null default now()
);

create index if not exists mensajes_match_idx on mensajes(match_id);

create table if not exists posts_vitrina (
  id          uuid primary key default uuid_generate_v4(),
  autor_id    uuid references talentos(id) on delete cascade,
  texto       text,
  imagen_url  text,
  tipo        text default 'general' check (tipo in ('logro', 'acuerdo', 'competencia', 'general')),
  likes       int default 0,
  hashtags    text,
  created_at  timestamptz not null default now()
);

create index if not exists posts_autor_idx on posts_vitrina(autor_id);
