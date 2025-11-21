# QuaK - Docker Compose Setup

This guide explains how to run the QuaK application using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- A `.env` file in the `backend` directory with OIDC configuration

## Quick Start

### 1. Ensure you have the backend `.env` file

Make sure you have a `.env` file in the `backend` directory. You can copy from `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with your actual OIDC credentials:

```env
# OAuth2 / OIDC Configuration
OIDC_CLIENT_ID=your-google-client-id
OIDC_CLIENT_SECRET=your-google-client-secret
OIDC_ISSUER=https://accounts.google.com

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173
```

### 2. Build and Run with Docker Compose

From the project root directory, run:

```bash
docker-compose up --build
```

This will:

- Build the **backend** Docker image from source
- Build the **frontend** Docker image from source
- Start a **MariaDB** database
- Start all services

### 3. Access the Application

Once all services are running:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8080>
- **Database**: localhost:3306 (MariaDB)

## Docker Compose Commands

### Build and start all services

```bash
docker-compose up --build
```

### Start services in detached mode (background)

```bash
docker-compose up -d
```

### Stop all services

```bash
docker-compose down
```

### Stop and remove all volumes (⚠️ This will delete all database data)

```bash
docker-compose down -v
```

### View logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Follow logs in real-time
docker-compose logs -f
```

### Rebuild a specific service

```bash
docker-compose build backend
docker-compose build frontend
```

### Restart a specific service

```bash
docker-compose restart backend
docker-compose restart frontend
```

## Architecture

The Docker Compose setup consists of three services:

### 1. Database (MariaDB)

- **Image**: `mariadb:latest`
- **Port**: 3306
- **Credentials**:
  - Root password: `hello`
  - Database: `quak`
  - User: `root`
- **Volume**: Persistent data storage in `db` volume

### 2. Backend (Spring Boot)

- **Build**: Multi-stage Dockerfile
  - Stage 1: Builds JAR using Gradle
  - Stage 2: Runs JAR using Amazon Corretto
- **Port**: 8080
- **Environment**:
  - Database connection configured via environment variables
  - OIDC configuration loaded from `backend/.env`
- **Dependencies**: Waits for database health check

### 3. Frontend (React + Vite)

- **Build**: Multi-stage Dockerfile
  - Stage 1: Builds static files using Node.js
  - Stage 2: Serves files using http-server
- **Port**: 5173
- **Environment**: API URL configured to point to backend
- **Dependencies**: Waits for backend to start

## Network

All services are connected via a custom bridge network named `quak-network`, allowing services to communicate using service names as hostnames (e.g., `backend`, `database`).

## Troubleshooting

### Backend not connecting to database

- Check database health: `docker-compose ps`
- View database logs: `docker-compose logs database`
- Ensure database is healthy before backend starts

### Frontend can't reach backend

- Verify backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Ensure port 8080 is accessible

### Build fails

- Clear Docker cache: `docker-compose build --no-cache`
- Remove all containers and rebuild: `docker-compose down && docker-compose up --build`

### Port already in use

If you get a "port already allocated" error:

```bash
# Check what's using the port
netstat -ano | findstr :8080   # Windows
lsof -i :8080                  # macOS/Linux

# Stop the conflicting service or change the port in docker-compose.yaml
```

## Development Notes

- **Hot reload**: For development, you may want to mount source code as volumes for hot reloading
- **Database persistence**: Data is stored in a Docker volume and persists between restarts
- **Environment variables**: Keep your `.env` file secure and never commit sensitive credentials

## Production Deployment

For production deployment, consider:

1. Using production-ready database credentials
2. Enabling HTTPS/TLS
3. Using environment-specific configuration
4. Implementing proper logging and monitoring
5. Setting resource limits for containers
6. Using orchestration tools like Kubernetes for scaling
