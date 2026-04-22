# 🚀 Quickstart — primer dia del equipo

Este es el camino **mas corto** desde "acabo de clonar el repo" hasta
"estoy laburando en un feature". Si algo falla, mira `docs/SETUP.md`
(tiene troubleshooting).

## 📋 Checklist de AT (owner del repo) — 1 sola vez

Antes de que entren los otros dos, AT hace esto:

- [ ] **Crear el repo en GitHub**
  - Nombre sugerido: `cowork-app` (o el que elijan entre los tres)
  - Privado (al menos hasta decidir licencia publica)
  - Sin README / .gitignore / LICENSE (ya los traemos nosotros)

- [ ] **Subir el codigo**
  ```bash
  cd cowork-project
  git init -b main
  git add .
  git commit -m "chore: initial scaffold"
  git remote add origin git@github.com:USUARIO/REPO.git
  git push -u origin main
  ```

- [ ] **Crear la rama `develop` y hacerla la por defecto**
  ```bash
  git checkout -b develop
  git push -u origin develop
  ```
  En GitHub → Settings → Branches → Default branch → `develop`.

- [ ] **Proteger `main` y `develop`**
  Settings → Branches → Add branch protection rule:
  - Require pull request before merging (1 aprobacion minimo)
  - Require status checks to pass (marcar `backend`, `frontend`, `docker`)
  - Include administrators (recomendado)

- [ ] **Invitar a los otros dos al repo**
  Settings → Collaborators → Add people.
  Rol sugerido: `Maintain` (pueden mergear PRs pero no borrar el repo).

- [ ] **Crear el GitHub Project**
  Projects → New project → Board.
  Columnas (de `docs/CONTRIBUTING.md`): **Backlog → Sprint → In Progress → Review → Done**.
  Linkearlo al repo.

- [ ] **Crear labels**
  Issues → Labels → New label. Minimo:
  - `feature` (verde), `bug` (rojo), `chore` (gris), `docs` (azul)
  - `frontend`, `backend`, `infra`, `design` (color libre)
  - `blocked` (negro), `good first issue` (amarillo)

- [ ] **Definir el primer milestone**
  Issues → Milestones → New: "v0.1 — MVP interno" con fecha tentativa.

- [ ] **Actualizar el README**
  Reemplazar `USUARIO/REPO` por los reales en los badges y el link de clone.

- [ ] **Editar `.github/ISSUE_TEMPLATE/config.yml`**
  Reemplazar `OWNER/REPO` en el link de Discussions.

---

## 💻 Checklist de cada miembro — al clonar

Cada uno de los tres corre esto:

- [ ] **Clonar y entrar**
  ```bash
  git clone git@github.com:USUARIO/REPO.git cowork-app
  cd cowork-app
  git checkout develop
  ```

- [ ] **Correr el bootstrap**
  ```bash
  ./scripts/bootstrap.sh
  ```
  Si lo anterior se completa sin errores, el ambiente esta listo.

- [ ] **Verificar que todo sube**
  - http://localhost:5173 → frontend muestra "Hello from backend"
  - http://localhost:8000/health → `{"status":"ok"}`
  - http://localhost:8000/api/v1/hello → `{"message":"..."}`

- [ ] **Configurar Git con tu identidad** (si no lo tenias)
  ```bash
  git config user.name "Tu Nombre"
  git config user.email "tu@email.com"
  ```

- [ ] **Leer los 3 docs clave** (20 min)
  - `docs/ARCHITECTURE.md` — como esta armado
  - `docs/CONTRIBUTING.md` — como trabajamos
  - `.github/PULL_REQUEST_TEMPLATE.md` — como se ve un PR

---

## 🎯 Primera semana — acciones concretas

**Dia 1 (todos juntos, 1h):**
- [ ] Kickoff: repasar `docs/ARCHITECTURE.md` en voz alta
- [ ] Dividir roles provisorios (frontend / backend / infra-diseño)
- [ ] Cada uno crea su primer Issue usando los templates
- [ ] Asignar primer milestone

**Dia 2-3:**
- [ ] Cada uno crea su rama `feature/...` desde `develop`
- [ ] Primer PR pequeño (aunque sea agregar su nombre a `README.md`) — solo para
      probar el flujo completo: rama → commit → push → PR → review → merge

**Dia 4-5:**
- [ ] Primera sync call (Miercoles — ver CONTRIBUTING.md)
- [ ] Ajustar lo que haya que ajustar del flujo
- [ ] Primera demo el Viernes (aunque sea de 5 min)

---

## 🆘 Si algo falla

1. Mira `docs/SETUP.md` seccion "Problemas comunes"
2. Busca el error en issues del repo (alguien quizas ya lo paso)
3. Si es nuevo, abre un issue con template `bug_report.md`
4. Menciona a los otros dos en el canal de comunicacion acordado

---

## ⚠️ Parches pendientes

Hay un archivo `PATCHES.md` en la raiz con una correccion menor que AT
(o quien haga el primer PR) debe aplicar para que los tests del backend
corran sin warnings. Es un cambio de 4 lineas.
