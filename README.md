# 🤝 Cowork Project

Proyecto colaborativo entre 3 desarrolladores. Aplicación web con frontend y backend separados, todo portable vía Docker, diseñado para correr en local hoy y en Google Cloud Platform mañana.

## 🏗️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vite + React 18 + React Router |
| Backend | Node.js 20 + TypeScript + Fastify |
| Base de datos | Postgres 16 (local) / Supabase (staging + prod) |
| Contenedores | Docker + docker-compose |
| CI | GitHub Actions |
| Hosting futuro | Google Cloud Run + Cloud SQL o Supabase |

## 🚀 Quickstart (5 minutos)

### Requisitos previos
- [Docker](https://docs.docker.com/get-docker/) y Docker Compose
- [Node.js 20+](https://nodejs.org/) (opcional, solo si quieres correr sin Docker)
- [Git](https://git-scm.com/)

### Pasos

```bash
# 1. Clonar el repo
git clone <URL_DEL_REPO>
cd cowork-project

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todo (postgres + backend + frontend)
docker compose up

# 4. Abrir en el navegador
#    Frontend: http://localhost:5173
#    Backend:  http://localhost:8000/health
```

Los tres servicios arrancan juntos con hot-reload. Los cambios en el código se reflejan automáticamente sin reconstruir.

## 📁 Estructura del repo

```
cowork-project/
├── frontend/              Vite + React + React Router
├── backend/               Fastify + TypeScript
│   └── src/lib/           capas abstraídas (db, auth, storage)
├── infra/
│   ├── terraform/         definición de GCP (para futuro)
│   └── supabase/
│       └── migrations/    SQL versionado
├── docs/                  documentación del equipo
├── docker-compose.yml     ambiente local unificado
└── .github/workflows/     CI/CD
```

## 📚 Documentación

- [SETUP.md](docs/SETUP.md) — guía detallada de instalación y primera ejecución
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — diseño del sistema y decisiones técnicas
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) — cómo trabajamos en equipo (branches, PRs, commits)

## 🧪 Comandos útiles

```bash
# Desarrollo
docker compose up                    # levantar todo
docker compose up -d                 # levantar en background
docker compose logs -f backend       # ver logs del backend
docker compose down                  # parar todo
docker compose down -v               # parar y borrar BD (¡cuidado!)

# Backend (desde /backend)
npm run dev                          # modo desarrollo
npm test                             # correr tests
npm run lint                         # linter
npm run build                        # compilar

# Frontend (desde /frontend)
npm run dev                          # modo desarrollo
npm test                             # correr tests
npm run build                        # build de producción
```

## 👥 Equipo y roles

| Persona | Rol principal | Área |
|---|---|---|
| Dev 1 | Frontend / UX | `frontend/` + diseño |
| Dev 2 | Backend / API | `backend/` + BD |
| Dev 3 | DevOps / Full-stack | `infra/`, CI/CD, integración |

Ver [CONTRIBUTING.md](docs/CONTRIBUTING.md) para detalles del flujo de trabajo.

## 🌿 Ramas

- `main` → producción (protegida, solo merge vía PR)
- `develop` → integración de features
- `feature/<nombre>` → una rama por tarea

## 📦 Despliegue

Hoy: local. Mañana: GCP Cloud Run. La arquitectura está diseñada para que la migración sea directa — ver [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 📝 Licencia

TBD
