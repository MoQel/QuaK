# QuaK IDE

[![License](https://img.shields.io/github/license/MoQel/QuaK)](LICENSE) 
[![CI](https://img.shields.io/github/actions/workflow/status/MoQel/QuaK/test_and_build.yml?label=CI)](https://github.com/MoQel/QuaK/actions/workflows/test_and_build.yml)

## About

This repository contains the source code for the Quantum Kit (QuaK) Web IDE.

## Docker Workflows

### Local Passwordless Deployment

For a trusted, single-user installation, start the complete application with:

```bash
docker compose -f docker-compose.local.yaml up --build
```

Then open `http://localhost:8080`. QuaK opens the project dashboard without an
OAuth login; projects can be created and opened in the editor normally. Project
data is persisted in the `local-db` Docker volume.

> [!WARNING]
> Local mode automatically authenticates every request as its single local user.
> The Compose file binds QuaK and MariaDB to `127.0.0.1` for that reason. Do not
> change those bindings or expose a local-profile deployment to an untrusted
> network. Use the production workflow when access control is required.

### Development Workflow (Docker-only)

This ensures a consistent environment. Rebuild the backend image after backend
or LSP dependency changes.

1. **Create the environment file once:**

    ```bash
    cp backend/.env.example backend/.env
    ```

2. **Start Backend & Database:**
    * **Linux/macOS:**

        ```bash
        docker compose -f docker-compose.dev.yaml up --build
        ```

    * **Windows:**

        ```powershell
        docker-compose -f docker-compose.dev.yaml up --build
        ```

    * Runs the Spring Boot backend on port `8080`.
    * Runs MariaDB on port `3306`.
    * *Note:* The backend does **not** serve frontend files in this mode.

3. **Start Frontend:**
    In a new terminal:

    ```bash
    cd frontend
    npm run dev
    ```

### Hybrid Workflow (Debugger-Friendly)

**Recommended for backend development.** This allows you to run the backend in your IDE or via terminal with a debugger while using Docker for the database.

1. **Set up the local language servers and environment once:**

    Follow [`backend/lsp/README.md`](backend/lsp/README.md), including creation
    of `backend/application-local.yaml` and `backend/.env`.

2. **Start Database:**

    ```bash
    docker compose -f docker-compose.dev.yaml up -d database
    ```

3. **Start Backend (with Debugging):**
    You can run the backend in debug mode via terminal. It will listen on port **5005** for a debugger while the API remains on **8080**.

    ```bash
    cd backend
    ./gradlew bootRun -PjvmArgs="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
    ```

    * **Port 8080:** Standard Web/API (Frontend stays connected).
    * **Port 5005:** Debugging (Connect your IDE here via "Remote JVM Debug").

4. **Start Frontend:**

    ```bash
    cd frontend
    npm run dev
    ```

Access the app at `http://localhost:5173`.

### Production Workflow

To run the full application (Backend + Frontend served statically):

1. **Create and configure the environment files once:**

    ```bash
    cp .env.prod.example .env.prod
    cp backend/.env.example backend/.env
    ```

    Set a strong, unique `MARIADB_ROOT_PASSWORD` and the externally visible
    `FRONTEND_URL` in `.env.prod`. The URL must include its scheme and origin,
    without a trailing slash or path. Configure the OAuth credentials in
    `backend/.env`.

2. **Start Application:**

    ```bash
    docker compose --env-file .env.prod -f docker-compose.prod.yaml up --build
    ```

    * Builds the frontend and serves it via the backend.
    * Runs the Spring Boot backend and MariaDB.
    * Access the app at `http://localhost:8080` (or the configured production port).

## Developing

Please have a look at the [developer guidelines](/docs/DEVELOPMENT.md).

## Testing

### Backend Tests

To run the backend tests, execute the following command in the `backend` directory:

```bash
./gradlew test
```

### Frontend Tests

To run the frontend tests, execute the following command in the `frontend` directory:

```bash
npm run test
```

## Deployment

Deployment is managed separately. Pushes to this repository do not deploy automatically.
The workflow builds `backend/Dockerfile` and runs the image behind Traefik. `main` is served at the production domain, any other branch at its own preview domain.

## Legacy Execution (Not Recommended)

*Note: This method is deprecated. Please use the Docker Development Workflow above.*

To run the QuaK editor manually without Docker, run:
`gradlew bootRun`
inside the `backend` directory

### Dependencies

The project requires the following dependencies to be installed on the system:

* Java >= Version 21

### Automatic installation of nodejs

Through the use of the [gradle-node-plugin], the project can automatically install `npm`.
If you want to use this feature, run any gradle-command with the flag `-PdownloadNode` (i.e. `gradlew :bootRun -PdownloadNode`).

If you wish to remove the custom nodejs install, run `gradlew :removeCustomNode`.

[gradle-node-plugin]: https://github.com/node-gradle/gradle-node-plugin

## License

Copyright (c) 2025 MoQel

This project is available under the [MIT License](./LICENSE). The licenses of the third-party packages it ships are listed in [THIRD-PARTY-LICENSES.md](./THIRD-PARTY-LICENSES.md).
