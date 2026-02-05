---
description: Restart the full development environment (Shutdown and then Start)
---

This workflow first shuts down the running development environment (DB, backend, and frontend) and then starts it all up again.

## Shutdown Phase

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

## Start Phase

### 1. Start Database Container
Starts the MariaDB database defined in `docker-compose.dev.yaml` in detached mode.
// turbo
```bash
docker-compose -f docker-compose.dev.yaml up -d database
```

### 2. Start Backend
Starts the backend service using Gradle. It will be available at `http://localhost:8080`.
// turbo
```bash
cd backend && ./gradlew bootRun -Dspring.profiles.active=dev
```

### 3. Start Frontend
Starts the frontend development server. It will be available at `http://localhost:5173`.
// turbo
```bash
cd frontend && npm run dev
```
