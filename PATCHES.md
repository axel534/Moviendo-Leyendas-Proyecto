# 🩹 Parches pendientes

Correcciones menores detectadas durante la validacion del scaffold.
Aplicalas **antes del primer push a GitHub** (o en el primer PR,
como prefieras).

---

## 1. `backend/src/test-setup.ts` — valores invalidos vs. schema Zod

### Sintoma

Al correr `npm test` en `backend/`, Vitest falla con:

```
❌ Invalid environment variables:
{
  PORT: [ 'Number must be greater than 0' ],
  LOG_LEVEL: [ "Invalid enum value. Expected 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal', received 'silent'" ]
}
```

### Causa

El archivo de setup de tests inyecta `PORT=0` y `LOG_LEVEL=silent`, pero el
schema de Zod en `backend/src/config.ts` no acepta esos valores.

### Solucion

Abri `backend/src/test-setup.ts` y dejalo EXACTAMENTE asi:

```ts
/**
 * Setup global de tests.
 *
 * Se ejecuta ANTES de cargar cualquier archivo del proyecto, asi que
 * podemos inyectar variables de entorno antes de que `config.ts` las valide.
 *
 * Registrado en `vitest.config.ts` via `setupFiles`.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '8000';
process.env.HOST = process.env.HOST ?? '127.0.0.1';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
```

Cambios respecto al original:

- `PORT = '0'` → `PORT = '8000'` (Zod exige `> 0`)
- `LOG_LEVEL = 'silent'` → `LOG_LEVEL = 'error'` (`silent` no esta en el enum)

### Verificacion

```bash
cd backend
npm test
```

Debe pasar sin errores.

---

## 2. (opcional) Si al correr tests NO se carga `test-setup.ts`

### Sintoma

`npm test` sigue fallando con `DATABASE_URL: Required` aunque el
setup file existe.

### Causa

Falta `vitest.config.ts` o no tiene `setupFiles` registrado.

### Solucion

Asegurate de que `backend/vitest.config.ts` exista con este contenido:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
});
```

---

## 3. Reemplazar placeholders del equipo

### En `README.md`

- [ ] Reemplazar `USUARIO/REPO` o `OWNER/REPO` por los reales
- [ ] Agregar los nombres de los tres integrantes en la seccion de equipo

### En `.github/ISSUE_TEMPLATE/config.yml`

- [ ] Reemplazar `OWNER/REPO` por los reales en el link de Discussions
      (o borrar esa entrada si no vamos a usar Discussions)

### En `docs/CONTRIBUTING.md`

- [ ] Confirmar los dias/horarios de sync (Mon/Wed/Fri) o ajustarlos
      al equipo

---

## ✅ Como marcar esto como "hecho"

Cuando apliques los parches:

1. Hace un commit separado:
   ```bash
   git add backend/src/test-setup.ts
   git commit -m "fix(backend): corregir valores invalidos en test-setup"
   ```

2. Borra este archivo:
   ```bash
   git rm PATCHES.md
   git commit -m "chore: remover PATCHES.md tras aplicar parches"
   ```

3. Pushea y listo.
