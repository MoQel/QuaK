---
description: Start the full development environment (DB in Docker, Backend and Frontend locally)
---

This workflow starts the database service using Docker Compose, then runs the Spring Boot backend and the Vite frontend locally.

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
