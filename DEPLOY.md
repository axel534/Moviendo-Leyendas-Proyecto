# Deploy Moviendo Leyendas — Vercel + Railway + Supabase

Guía paso a paso para llevar la plataforma a producción.

---

## 0. Lo que ya está hecho

- ✅ Proyecto Supabase creado: `moviendo-leyendas` (ID `bveqesivzblduqlsxmua`, región `us-east-2`)
- ✅ 7 migraciones aplicadas con datos demo
- ✅ Código preparado para deploy (CORS, SSL, env vars)
- ✅ `vercel.json` y `backend/railway.toml` listos
- ✅ PR abierto: https://github.com/axel534/Moviendo-Leyendas-Proyecto/pull/1

---

## 1. Obtener DATABASE_URL de Supabase

1. Entra a https://supabase.com/dashboard/project/bveqesivzblduqlsxmua
2. Settings → Database
3. Sección **Connection string** → tab **Transaction pooler** (puerto 6543, recomendado para serverless)
4. Copia la URL. Se ve así:
   ```
   postgresql://postgres.bveqesivzblduqlsxmua:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
   ```
5. Reemplaza `[PASSWORD]` por la que pusiste al crear el proyecto.
6. Añade `?sslmode=require` al final.

---

## 2. Deploy backend a Railway

1. https://railway.com/new → **Deploy from GitHub repo**
2. Selecciona `axel534/Moviendo-Leyendas-Proyecto`
3. Después del primer fail (no encuentra Dockerfile en raíz):
   - Click en el servicio → **Settings**
   - **Root Directory** → `backend`
   - Railway detectará automáticamente el `Dockerfile` y `railway.toml`
4. Sección **Variables** → añade:

   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `8000` |
   | `LOG_LEVEL` | `info` |
   | `DATABASE_URL` | (la de Supabase, paso 1) |
   | `JWT_SECRET` | (genera uno fuerte abajo) |
   | `JWT_EXPIRES_DAYS` | `7` |
   | `CORS_ORIGIN` | `https://moviendoleyendas.vercel.app,*.vercel.app` (ajusta después) |
   | `ADMIN_TOKEN` | (cualquier string, ya no se usa pero el schema lo pide) |

   Genera JWT_SECRET fuerte:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

5. **Settings → Networking → Public Networking** → Generate Domain
6. Anota la URL: `https://moviendo-api.up.railway.app` (algo así)
7. Verifica health: abre `https://TU-URL.up.railway.app/health` → debe responder `{"status":"ok"}`

---

## 3. Deploy frontend a Vercel

1. https://vercel.com/new → **Import Git Repository**
2. Selecciona `axel534/Moviendo-Leyendas-Proyecto`
3. **Framework Preset:** `Other` (Vercel detectará `vercel.json`)
4. **Root Directory:** déjalo en raíz (el `vercel.json` lo maneja)
5. **Environment Variables:**

   | Variable | Valor |
   |---|---|
   | `VITE_API_BASE_URL` | URL del backend de Railway (paso 2.6, sin `/` final) |

6. **Deploy**
7. Una vez live, copia la URL final (ej: `moviendoleyendas.vercel.app`)

---

## 4. Actualizar CORS en Railway

Después de tener la URL de Vercel:
1. Railway → tu servicio → Variables
2. Actualiza `CORS_ORIGIN`:
   ```
   https://moviendoleyendas.vercel.app,https://*.vercel.app
   ```
3. Railway hace redeploy automático.

---

## 5. Verificación final

Abre el sitio en producción:

- [ ] `/` carga con stats reales del backend
- [ ] `/registro` permite crear cuenta (verifica en Supabase Dashboard que aparece la fila)
- [ ] `/login` con `luis.carrasco@mail.com` entra y muestra dashboard
- [ ] `/admin` con `torres.rivera.axel@gmail.com` / `moviendo2026` (cámbiala en la primera entrada)
- [ ] `/admin/stats` muestra KPIs reales
- [ ] `/admin/equipo` crea nuevo admin
- [ ] `/admin/integraciones` guarda y prueba conexión

---

## 6. Dominio propio (opcional)

### Vercel
1. Settings → Domains → Add → `moviendoleyendas.com`
2. Vercel te da registros DNS (CNAME + A)
3. En cloudns.net (que maneja DNS según el equipo), apunta el dominio

### Railway (opcional, para `api.moviendoleyendas.com`)
1. Settings → Networking → Custom Domain
2. CNAME en cloudns.net

Después actualiza:
- `VITE_API_BASE_URL` en Vercel → `https://api.moviendoleyendas.com`
- `CORS_ORIGIN` en Railway → `https://moviendoleyendas.com`

---

## 7. Cambios post-deploy

### Cambiar contraseña del owner
1. Entra a `/admin` con el demo
2. Equipo → tu fila → opción "Editar" (o directo desde Supabase ejecutando):
   ```sql
   -- Generar hash localmente:
   -- node -e "console.log(require('bcryptjs').hashSync('nueva-contra', 10))"
   update staff set password_hash = '$2b$10$NUEVA_HASH' where email = 'torres.rivera.axel@gmail.com';
   ```

### Borrar admin demo
```sql
delete from staff where email = 'marco@moviendoleyendas.com';
```

### Borrar datos demo de talentos/marcas
```sql
delete from posts_vitrina;
delete from mensajes;
delete from matches;
delete from talentos where email like '%@mail.com';
delete from marcas where contacto_email like '%@%.mx';
```

---

## Troubleshooting

**Frontend muestra error de CORS**
→ Revisa `CORS_ORIGIN` en Railway. Debe incluir el origen exacto de Vercel (con `https://`, sin `/`).

**Login no funciona en prod**
→ Revisa que `JWT_SECRET` esté seteado en Railway. Si no, todos los tokens fallan.

**`/api/v1/...` devuelve 404 en prod**
→ El frontend tiene `VITE_API_BASE_URL` mal seteado. Debe ser la URL completa del backend de Railway.

**Postgres rechaza conexión**
→ La URL de Supabase debe terminar en `?sslmode=require`. Verifica que copiaste del "Transaction pooler" (puerto 6543), no del directo (5432).
