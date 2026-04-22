# infra/terraform

Infraestructura como codigo para GCP (Cloud Run + Cloud SQL + Artifact Registry
+ bucket en GCS).

## Estado actual

**Placeholder.** Todavia no escribimos nada aqui. Lo haremos cuando estemos
listos para el primer deploy a GCP — mientras tanto trabajamos 100% en local
con `docker compose`.

## Cuando empecemos

Estructura sugerida:

```
terraform/
  main.tf             ← providers y backend remoto
  variables.tf        ← project_id, region, environment
  cloud_run.tf        ← servicios backend y frontend
  cloud_sql.tf        ← instancia de Postgres
  artifact_registry.tf← repo de imagenes Docker
  storage.tf          ← bucket GCS para uploads
  iam.tf              ← cuentas de servicio y permisos
  outputs.tf
  envs/
    staging.tfvars
    prod.tfvars
```

Ver `docs/ARCHITECTURE.md` para el plan de migracion a GCP.
