# 🤝 Cómo contribuimos

Este documento define cómo trabajamos los 3 en este repo. **Cambios propuestos a estas reglas requieren consenso del equipo.**

## 🌿 Estrategia de ramas

Usamos un modelo similar a GitHub Flow con una rama `develop` intermedia:

```
main        ← producción (protegida)
  ↑
develop     ← integración (protegida)
  ↑
feature/*   ← trabajo diario
```

### Reglas
- **Nadie hace push directo a `main` ni a `develop`**
- Todo cambio entra vía **Pull Request**
- Los PRs a `develop` requieren **mínimo 1 review** de otro del equipo
- Los PRs a `main` requieren **review + CI verde**
- Un PR = una responsabilidad. PRs gigantes se rechazan, se piden más pequeños.

### Nombres de ramas

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad | `feature/user-profile` |
| `fix/` | Corrección de bug | `fix/login-crash` |
| `chore/` | Tareas de mantenimiento | `chore/update-deps` |
| `docs/` | Solo documentación | `docs/update-readme` |
| `refactor/` | Refactor sin cambio funcional | `refactor/extract-auth-lib` |

## 📝 Commits

Usamos **Conventional Commits**. Formato:

```
<tipo>(<ámbito opcional>): <descripción en español, imperativo>

[cuerpo opcional con más detalle]

[footer opcional: Closes #42]
```

### Tipos
- `feat` — nueva funcionalidad
- `fix` — corrección de bug
- `docs` — solo documentación
- `style` — formato, espacios (sin cambios de código)
- `refactor` — refactor sin cambio funcional
- `test` — agregar o ajustar tests
- `chore` — tareas de mantenimiento, dependencias, configs

### Ejemplos buenos
```
feat(auth): agregar login con email y password
fix(api): corregir timeout en endpoint /users
docs: actualizar guía de setup
refactor(db): extraer queries de usuario a repo
chore(deps): actualizar fastify a 4.28.1
```

### Ejemplos malos
```
arreglos                        ❌ vago
fix: stuff                      ❌ sin información
WIP                             ❌ commits WIP no se mergean
Actualización varios archivos   ❌ no dice qué hiciste
```

## 🔀 Pull Requests

### Checklist antes de abrir PR
- [ ] El código compila (`npm run build`)
- [ ] Los tests pasan (`npm test`)
- [ ] El linter no se queja (`npm run lint`)
- [ ] Agregué tests si introduje lógica nueva
- [ ] Actualicé la documentación si cambié comportamiento público
- [ ] Mi PR está asociado a un Issue

### Al abrir el PR
- Describe **qué** cambió y **por qué** (no el cómo — eso se ve en el diff)
- Incluye capturas/GIFs si es un cambio visual
- Menciona el Issue relacionado: `Closes #42`
- Marca como "Draft" si aún no está listo para review

### Durante el review
- Responde a los comentarios, no solo los marques como resueltos
- Si hay desacuerdo, discútelo en el PR (queda documentado)
- No merges tu propio PR — tiene que aprobarlo otro

### Después del merge
- Borra la rama de feature (GitHub lo ofrece automático)
- Cierra el Issue asociado si no se cerró solo

## 🎯 Issues

Todo trabajo empieza como un Issue. **Nada de código sin Issue.**

### Tipos (labels)
- `feature` — nueva funcionalidad
- `bug` — algo está roto
- `chore` — mantenimiento / deuda técnica
- `docs` — documentación
- `question` — discusión pendiente

### Áreas (labels)
- `frontend`, `backend`, `infra`, `design`, `db`

### Plantillas
Usa las plantillas de `.github/ISSUE_TEMPLATE/`. Te piden:
- Contexto / problema
- Propuesta de solución
- Criterios de aceptación
- Consideraciones técnicas

## 🗂️ GitHub Projects (tablero Kanban)

Columnas:
- **📋 Backlog** — ideas y tareas futuras
- **🎯 Sprint actual** — lo que trabajamos esta semana
- **🚧 En progreso** — alguien está trabajando en ello
- **👀 En review** — PR abierto, esperando revisión
- **✅ Hecho** — mergeado a `develop`

Regla: **cada persona tiene máximo 2 cards en "En progreso"** a la vez.

## 📅 Ritmo del equipo

| Día | Actividad | Duración |
|---|---|---|
| Lunes | Planning (qué toma cada uno esta semana) | 30 min |
| Miércoles | Sync corto (bloqueos, ajustes) | 15 min |
| Viernes | Demo + retro (mostrar avances, mejorar proceso) | 30 min |

## 🎨 Estándares de código

### TypeScript (frontend y backend)
- Strict mode activado, no usar `any` (usar `unknown` si no sabes el tipo)
- Preferir funciones sobre clases, salvo cuando hay estado evidente
- Un archivo = una responsabilidad
- Tests en el mismo directorio que el código: `foo.ts` + `foo.test.ts`

### Naming
- `camelCase` para variables y funciones
- `PascalCase` para componentes React y tipos/interfaces
- `SCREAMING_SNAKE_CASE` solo para constantes de módulo
- Nombres descriptivos en inglés para código, comentarios en español están ok

### Imports
Orden: (1) librerías externas, (2) módulos internos absolutos, (3) relativos. Línea en blanco entre grupos.

```ts
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '@/lib/api';

import { Button } from './Button';
```

## 🔒 Seguridad

- **NUNCA commitear secretos.** Si accidentalmente subes uno, avisa al equipo y rota la credencial.
- **NUNCA hardcodear URLs, claves o tokens.** Todo va en variables de entorno.
- Si agregas una dependencia nueva, explica por qué en el PR.

## 📞 Comunicación

- **Urgente / bloqueo:** Slack/Discord (canal del equipo)
- **Discusión técnica:** GitHub Discussions o comentarios en Issues
- **Decisión importante:** queda escrita en `docs/ARCHITECTURE.md` o en un ADR

## 🙋 ¿Dudas?

Si algo no está claro o esta guía se queda corta, abre una discusión o pregunta en el canal. Estas reglas están para servirnos — si no lo hacen, las cambiamos.
