## Summary

This PR prepares QuaK for deployment while keeping infrastructure-specific configuration outside the application repository.

## Changes

- improve the production Docker Compose configuration:
  - use configurable database credentials
  - correct the MariaDB data directory
  - improve the database health check
- correct the MariaDB volume path in the development Compose configuration
- support forwarded headers when QuaK runs behind a reverse proxy
- include the OpenTelemetry Java agent for optional activation by the deployment environment
- support a configurable `VITE_API_URL` and same-origin API requests in production
- split large frontend dependencies into separate build chunks
- upgrade Recharts and adapt the affected chart typings
- remove the legacy Dokku deployment workflow

## Database migration

The development Compose volume previously mounted `db` at `/var/lib/data`, while MariaDB stores its database files in `/var/lib/mysql`. Existing data may therefore be stored only in the current container's writable layer.

Updating the Compose configuration can recreate the database container and start with an empty database. Back up installations containing important data before updating or recreating the container:

```bash
docker compose -f docker-compose.dev.yaml exec -T database \
  sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --all-databases --single-transaction --routines --events' \
  > quak-database-backup.sql
```

After updating and starting the new database container, restore the backup:

```bash
docker compose -f docker-compose.dev.yaml exec -T database \
  sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"' \
  < quak-database-backup.sql
```

Do not remove or recreate the existing database container before creating the backup.

## Verification

- frontend tests pass
- production frontend build succeeds
- Docker Compose configurations are valid

Related to #125
