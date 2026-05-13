-- 0006_staff.sql
-- Tabla de staff del backoffice (owner | admin).
-- Reemplaza el ADMIN_TOKEN único por accesos por persona con bcrypt.

create type staff_rol as enum ('owner', 'admin');

create table if not exists staff (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique,
  password_hash text not null,
  nombre        text not null,
  rol           staff_rol not null,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- Owner inicial (Axel) — password: moviendo2026 (cambiar en producción)
insert into staff (email, password_hash, nombre, rol) values
  ('torres.rivera.axel@gmail.com', '$2b$10$OKBcl5iekNWSEhYNZ43MLeViRsfXBbzErLYg1TzE/VvumSbixq8Bm', 'Carlos Axel Torres', 'owner');

-- Admin demo (Marco) — password: admin2026
insert into staff (email, password_hash, nombre, rol) values
  ('marco@moviendoleyendas.com', '$2b$10$UnxENucf17o4kPstZQ.1dO9feG9wIFPxBpc2eBdyx/S44kZEvnMJK', 'Marco', 'admin');
