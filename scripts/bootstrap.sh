#!/usr/bin/env bash
#
# bootstrap.sh
# Primer arranque del proyecto. Corre esto UNA VEZ despues de clonar el repo.
#
# Uso:
#   ./scripts/bootstrap.sh
#
# Que hace:
#   1. Verifica prerequisitos (docker, node, git)
#   2. Crea .env desde .env.example si no existe
#   3. Instala dependencias de backend y frontend
#   4. Levanta docker-compose y espera a que postgres este sano
#   5. Corre los tests para confirmar que todo quedo bien
#
# Idempotente: se puede correr varias veces sin romper nada.

set -euo pipefail

# ---------- colores ----------
if [ -t 1 ]; then
  BOLD=$(tput bold); RED=$(tput setaf 1); GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3); BLUE=$(tput setaf 4); RESET=$(tput sgr0)
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; BLUE=""; RESET=""
fi

step() { echo ""; echo "${BOLD}${BLUE}==>${RESET} ${BOLD}$*${RESET}"; }
ok()   { echo "  ${GREEN}✓${RESET} $*"; }
warn() { echo "  ${YELLOW}!${RESET} $*"; }
err()  { echo "  ${RED}✗${RESET} $*" >&2; }

# ---------- ir a la raiz del repo ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# ---------- 1. prerequisitos ----------
step "Verificando prerequisitos"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "$1 no esta instalado. $2"
    exit 1
  fi
  ok "$1 $(${1} --version 2>&1 | head -1)"
}

need docker "Instalalo desde https://docs.docker.com/get-docker/"
need node   "Necesitas Node 20+. Instalalo desde https://nodejs.org o con nvm."
need npm    "Viene con Node."
need git    "Instalalo con tu gestor de paquetes."

# docker compose v2 viene como subcomando
if ! docker compose version >/dev/null 2>&1; then
  err "docker compose v2 no disponible. Actualiza Docker Desktop o instala el plugin."
  exit 1
fi
ok "docker compose $(docker compose version --short 2>/dev/null || echo '?')"

# node >= 20
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Necesitas Node >= 20 (tenes $NODE_MAJOR)."
  exit 1
fi

# ---------- 2. .env ----------
step "Configurando .env"

if [ ! -f .env ]; then
  cp .env.example .env
  ok "Cree .env a partir de .env.example"
  warn "Revisa .env y ajusta valores si es necesario (passwords, URLs, etc.)"
else
  ok ".env ya existe, no lo toco"
fi

# ---------- 3. dependencias ----------
step "Instalando dependencias del backend"
(cd backend && npm install --no-audit --no-fund)
ok "backend/node_modules listo"

step "Instalando dependencias del frontend"
(cd frontend && npm install --no-audit --no-fund)
ok "frontend/node_modules listo"

# ---------- 4. docker-compose ----------
step "Levantando servicios con docker compose"
docker compose up -d --build
ok "Servicios iniciados"

step "Esperando a que postgres este sano"
ATTEMPTS=30
for i in $(seq 1 $ATTEMPTS); do
  if docker compose ps postgres --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
    ok "postgres healthy"
    break
  fi
  if [ "$i" -eq "$ATTEMPTS" ]; then
    err "postgres no llego a healthy despues de ${ATTEMPTS}s. Revisa: docker compose logs postgres"
    exit 1
  fi
  printf "."
  sleep 1
done

# ---------- 5. tests ----------
step "Corriendo tests del backend"
if (cd backend && npm test --silent); then
  ok "backend tests: PASS"
else
  warn "backend tests fallaron. Revisa los logs arriba."
fi

step "Corriendo tests del frontend"
if (cd frontend && npm test --silent); then
  ok "frontend tests: PASS"
else
  warn "frontend tests fallaron. Revisa los logs arriba."
fi

# ---------- listo ----------
echo ""
echo "${BOLD}${GREEN}🎉 Bootstrap completo${RESET}"
echo ""
echo "Servicios disponibles:"
echo "  • Frontend:    http://localhost:5173"
echo "  • Backend API: http://localhost:8000"
echo "  • Postgres:    localhost:5432 (user/pass en .env)"
echo ""
echo "Comandos utiles:"
echo "  docker compose logs -f           # ver logs en vivo"
echo "  docker compose down              # parar servicios"
echo "  docker compose down -v           # parar + borrar datos de db"
echo "  docker compose restart backend   # reiniciar un servicio"
echo ""
echo "Siguiente paso: abre QUICKSTART.md para el checklist de primer dia."
