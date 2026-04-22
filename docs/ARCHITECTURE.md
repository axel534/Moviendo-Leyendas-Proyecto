# 🏗️ Arquitectura del sistema

## Principios rectores

1. **Portabilidad ante todo.** Ninguna decisión nos debe amarrar a un proveedor. Si hoy estamos en Supabase y mañana decidimos mover la BD a Cloud SQL, el costo debe ser de horas, no de semanas.
2. **Todo en Docker.** Si no corre en un contenedor, no sirve. Local = staging = producción (mismo artefacto).
3. **Código, infra y configuración versionados en Git.** La única fuente de verdad.
4. **Fail fast, fail loud.** El sistema avisa temprano si algo está mal (validación de env vars al arranque, healthchecks, CI bloqueante).

## Diagrama general

```
┌──────────────────────────────────────────────────────┐
│                      USUARIOS                        │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                  FRONTEND (Vite + React)             │
│                   servido por nginx                  │
└──────────────────────────┬───────────────────────────┘
                           │ HTTPS / JSON
                           ↓
┌──────────────────────────────────────────────────────┐
│              BACKEND (Fastify + TypeScript)          │
│                                                      │
│   ┌────────────────────────────────────────────┐     │
│   │  lib/db       lib/auth       lib/storage   │     │
│   │  ↓            ↓              ↓             │     │
│   └──┼────────────┼──────────────┼─────────────┘     │
└──────┼────────────┼──────────────┼───────────────────┘
       ↓            ↓              ↓
   Postgres     Auth provider   Storage provider
   (local /     (Supabase       (Supabase
    Supabase)    Auth hoy)       Storage hoy)
```

## Fases de despliegue

### Fase 1 — Local (actual)
Todo corre en docker-compose en la máquina de cada dev. BD = Postgres 16 local.

### Fase 2 — Staging en GCP + Supabase
- Frontend en **Cloud Run** (imagen con nginx)
- Backend en **Cloud Run** (imagen Node)
- BD en **Supabase** (proyecto `staging`)
- Imágenes Docker almacenadas en **Google Artifact Registry**

### Fase 3 — Producción
Igual que staging pero con proyecto Supabase separado y dominios propios.

## Capas abstraídas (claves para la portabilidad)

Estas carpetas dentro de `backend/src/lib/` encapsulan dependencias externas. **Ninguna ruta ni servicio de negocio puede importar directamente el SDK de Supabase, `pg`, etc.** Siempre pasan por estas capas.

### `lib/db`
Acceso a Postgres. Hoy usa el driver `pg`. Si un día quisieran cambiar a Prisma o a otra BD, solo se reemplaza esta capa.

### `lib/auth`
Verificación de tokens y lectura de usuarios. Interfaz neutral — hoy se implementa con Supabase Auth, mañana puede ser Auth0, Firebase o JWT propios.

### `lib/storage`
Upload/download de archivos. Hoy Supabase Storage, mañana Google Cloud Storage o S3. **Guardamos solo paths relativos en la BD, nunca URLs completas.**

## Base de datos

### Desarrollo local
Postgres 16 corriendo en Docker. Datos en un volumen `postgres_data`. Las migraciones SQL viven en `infra/supabase/migrations/` y se aplican al arrancar (están montadas en `/docker-entrypoint-initdb.d`).

### Staging / producción
Supabase — que es un Postgres gestionado con extras (Auth, Storage, Realtime). Las **mismas migraciones SQL** se aplican en todos los ambientes usando el [Supabase CLI](https://supabase.com/docs/guides/cli).

### Reglas sobre el esquema
- ✅ Usar features estándar de Postgres (constraints, índices, funciones SQL)
- ✅ Row Level Security (RLS) de Supabase está bien, documentarlo en el SQL
- ❌ No usar webhooks de Supabase para lógica crítica (son propietarios)
- ❌ No depender de `auth.users` de Supabase en foreign keys sin abstracción
- ✅ Toda migración va numerada: `001_initial.sql`, `002_add_users.sql`, etc.

## Variables de entorno

| Lugar | Qué vive ahí |
|---|---|
| `.env.example` | Plantilla con todas las variables necesarias (sin valores reales) |
| `.env` | Valores locales de cada dev (**no se sube a Git**) |
| GitHub Secrets | Claves para CI/CD y despliegue |
| GCP Secret Manager | Secretos de staging y producción |

La validación de variables está centralizada en `backend/src/config.ts` con Zod. Si falta una variable, el servidor **no arranca** — preferimos fallar al inicio que en runtime.

## CI/CD (GitHub Actions)

```
Push a cualquier rama
        ↓
   Job: lint + typecheck + tests
        ↓
PR a develop / main
        ↓
   Job: build imagen Docker (backend y frontend)
        ↓
[Futuro] Push a Artifact Registry + deploy a Cloud Run
```

Ver `.github/workflows/ci.yml`.

## Seguridad

- `helmet` activado en el backend (headers seguros)
- CORS restringido a orígenes conocidos en staging/prod
- Contenedores corren como usuario no-root
- Secretos nunca en el repo — siempre en env vars o Secret Manager
- Dependencias auditadas por CI (`npm audit` futuro)
- `main` protegida: nadie hace push directo, mínimo 1 review en PR

## Observabilidad

- **Logs estructurados:** `pino` en el backend, formato JSON en producción
- **Healthchecks:** `/health` (liveness) y `/health/ready` (readiness con check de BD)
- **Futuro:** Cloud Logging + Cloud Monitoring en GCP

## Decisiones técnicas (ADRs breves)

### ¿Por qué monorepo?
Frontend y backend evolucionan juntos; cambios cross-cutting van en un solo PR.

### ¿Por qué Fastify y no Express?
Más rápido, schema validation integrada, TypeScript-first, y plugins modernos.

### ¿Por qué Vite y no Next.js?
Queremos un SPA simple con backend separado. Next agregaría complejidad innecesaria.

### ¿Por qué Supabase y no Cloud SQL desde el inicio?
Supabase da Postgres + Auth + Storage + dashboard por cero configuración. Si un día crecemos o el costo no convence, migrar a Cloud SQL es trivial porque respetamos las reglas de portabilidad.

### ¿Por qué Cloud Run y no GKE / App Engine?
Pay-per-use, escalado a cero, despliegue desde una imagen Docker. Para un equipo de 3, GKE sería matar una mosca con un cañón.

## Roadmap técnico

- [ ] Fase 1: proyecto corre en local con docker-compose ✅
- [ ] Fase 2: deploy manual a Cloud Run staging
- [ ] Fase 3: CI/CD automático a staging
- [ ] Fase 4: Supabase en staging (Auth + Storage integrados)
- [ ] Fase 5: producción en GCP + dominio propio
- [ ] Fase 6: monitoring y alertas
