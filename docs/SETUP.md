# 🛠️ Guía de setup

Sigue estos pasos para tener el proyecto corriendo en tu máquina.

## 1. Requisitos previos

| Herramienta | Versión mínima | Cómo instalar |
|---|---|---|
| Git | 2.30+ | https://git-scm.com |
| Docker Desktop | 24+ | https://docs.docker.com/get-docker/ |
| Node.js | 20 LTS | https://nodejs.org (solo si corres sin Docker) |

Verifica:
```bash
git --version
docker --version
docker compose version
node --version  # opcional
```

## 2. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd cowork-project
```

## 3. Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` por defecto ya funciona para desarrollo local. Solo hay que tocarlo si vas a usar Supabase remoto o GCP.

## 4. Levantar el ambiente

### Opción A — Todo con Docker (recomendada)

```bash
docker compose up
```

Esto levanta:
- **Postgres** en `localhost:5432`
- **Backend** en `http://localhost:8000`
- **Frontend** en `http://localhost:5173`

Para arrancar en background:
```bash
docker compose up -d
```

Para ver logs:
```bash
docker compose logs -f              # todos
docker compose logs -f backend      # solo uno
```

### Opción B — Sin Docker (para debugging avanzado)

Necesitas Postgres corriendo localmente (por Homebrew, instalador, etc.).

```bash
# Terminal 1: backend
cd backend
npm install
npm run dev

# Terminal 2: frontend
cd frontend
npm install
npm run dev
```

## 5. Verificar que todo funciona

Abre:
- http://localhost:5173 → debe mostrar la app
- http://localhost:8000/health → debe devolver `{"status":"ok"}`
- http://localhost:8000/health/ready → debe decir que la BD está conectada
- http://localhost:8000/api/v1/hello → saludo desde el backend

Si el frontend muestra los datos del backend, todo está bien.

## 6. Comandos útiles

### Docker
```bash
docker compose up                # levantar
docker compose down              # parar
docker compose down -v           # parar + borrar volúmenes (resetea BD)
docker compose restart backend   # reiniciar un servicio
docker compose exec backend sh   # shell dentro del contenedor
```

### Backend (`cd backend`)
```bash
npm run dev        # modo desarrollo con hot reload
npm test           # correr tests
npm run lint       # linter
npm run typecheck  # solo verificar tipos
npm run build      # compilar a dist/
```

### Frontend (`cd frontend`)
```bash
npm run dev        # modo desarrollo
npm test           # correr tests
npm run lint       # linter
npm run build      # build de producción
npm run preview    # servir el build
```

### Base de datos
```bash
# Conectarse con psql
docker compose exec postgres psql -U cowork -d cowork_dev

# Hacer un backup
docker compose exec postgres pg_dump -U cowork cowork_dev > backup.sql

# Restaurar un backup
cat backup.sql | docker compose exec -T postgres psql -U cowork -d cowork_dev
```

## 7. Problemas comunes

### "Port already in use"
Algún servicio ya está usando el puerto. Para averiguar:
```bash
lsof -i :5173   # Mac/Linux
netstat -ano | findstr :5173   # Windows
```
Mata el proceso o cambia el puerto en `docker-compose.yml`.

### El backend no se conecta a Postgres
- Asegúrate de que el contenedor de Postgres esté corriendo: `docker compose ps`
- Espera unos segundos: Postgres tarda ~5s en estar listo
- Revisa que `DATABASE_URL` en `.env` coincida con las credenciales de `docker-compose.yml`

### Los cambios en el código no se reflejan
- Para backend/frontend: los volúmenes montados deberían hacerlo automático. Si no, reinicia con `docker compose restart`.
- Si cambiaste `package.json`: reconstruye con `docker compose up --build`.

### "Cannot find module" en Docker
El volumen anónimo de `node_modules` puede estar corrupto. Reinicia limpio:
```bash
docker compose down -v
docker compose up --build
```

## 8. Siguientes pasos

- Lee [ARCHITECTURE.md](ARCHITECTURE.md) para entender el diseño del sistema
- Lee [CONTRIBUTING.md](CONTRIBUTING.md) para saber cómo colaborar con el equipo
- Toma tu primer Issue del tablero de GitHub Projects 🚀
