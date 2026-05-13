-- 0007_integraciones.sql
-- Configuración de integraciones externas. Solo accesible por staff con rol owner.
-- IMPORTANTE: los valores sensibles (tokens, claves) viven en `config jsonb`.
-- En producción evaluar encriptar con pgcrypto o mover a un KMS.

create table if not exists integraciones (
  slug              text primary key,
  nombre            text not null,
  config            jsonb not null default '{}'::jsonb,
  activa            boolean not null default false,
  last_test_at      timestamptz,
  last_test_ok      boolean,
  last_test_error   text,
  updated_at        timestamptz not null default now()
);

-- Seed con las 3 integraciones vacías
insert into integraciones (slug, nombre, config) values
  ('railway',     'Railway',           '{"api_token": "", "project_id": ""}'::jsonb),
  ('secureshell', 'SecureShell (SSH)', '{"host": "", "port": 22, "user": "", "auth_type": "key", "private_key": "", "password": ""}'::jsonb),
  ('whapi',       'Whapi (WhatsApp)',  '{"api_token": "", "channel_id": "", "base_url": "https://gate.whapi.cloud"}'::jsonb)
on conflict (slug) do nothing;
