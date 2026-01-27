---
description: Stop the development environment (DB, Backend, and Frontend)
---

This workflow stops the database container and kills the running backend and frontend processes.

### 1. Stop Database Container
Stops and removes the MariaDB container.
// turbo
```bash
docker-compose -f docker-compose.dev.yaml stop database
```

### 2. Stop Backend
Kills the process running on port 8080.
// turbo
```bash
lsof -ti :8080 | xargs kill -9
```

### 3. Stop Frontend
Kills the process running on port 5173.
// turbo
```bash
lsof -ti :5173 | xargs kill -9
```
