-- 0002_marketplace.sql
-- Tablas principales del marketplace Moviendo Leyendas: talentos y marcas.
-- Cada registro nace en estado 'pendiente' hasta que admin lo aprueba/rechaza.

create type estado_registro as enum ('pendiente', 'aprobado', 'rechazado');

create table if not exists talentos (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  disciplina      text not null,
  ciudad          text,
  edad            int,
  bio             text,
  foto_url        text,
  email           text not null unique,
  telefono        text,
  redes_seguidores int default 0,
  estado          estado_registro not null default 'pendiente',
  created_at      timestamptz not null default now(),
  decidido_at     timestamptz
);

create table if not exists marcas (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  industria       text not null,
  pais            text default 'México',
  sitio_web       text,
  contacto_nombre text not null,
  contacto_email  text not null unique,
  presupuesto_mxn int,
  estado          estado_registro not null default 'pendiente',
  created_at      timestamptz not null default now(),
  decidido_at     timestamptz
);

create index if not exists talentos_estado_idx on talentos(estado);
create index if not exists marcas_estado_idx on marcas(estado);
