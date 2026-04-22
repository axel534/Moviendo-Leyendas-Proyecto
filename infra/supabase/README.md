# infra/supabase

Aqui vive el schema y las migraciones de la base de datos.

## Estructura

```
supabase/
  migrations/    ← archivos .sql numerados (0001_init.sql, 0002_...)
```

## En local (Docker)

El archivo `docker-compose.yml` monta este directorio como
`/docker-entrypoint-initdb.d` dentro del contenedor de Postgres. Eso significa
que **todos los `.sql` aqui se ejecutan automaticamente la primera vez que
arranca el contenedor** (es decir, cuando el volumen `pgdata` esta vacio).

Para reaplicar migraciones desde cero:

```bash
docker compose down -v     # borra el volumen pgdata
docker compose up -d
```

## Cuando migremos a Supabase

Estos mismos archivos se aplican con:

```bash
supabase db push
```

Mas detalle en `docs/ARCHITECTURE.md`.

## Convencion de nombres

```
NNNN_descripcion_corta.sql
```

- `NNNN` — numero secuencial de 4 digitos (0001, 0002, ...)
- Siempre hacia adelante (si te equivocas, crea otra migracion que lo corrija;
  no edites una ya mergeada)
