# LSP Server Setup

QuaK embeds language servers as child processes and communicates with them via JSON-RPC over stdio.
Each language server lives in its own subdirectory and is configured independently.

## Local Development

Prerequisites:

- Java 21 for the backend
- Python 3.10 or newer with the `venv` module
- Go 1.24.4 or newer

Run all commands in this section from the repository root.

**1. Set up all language servers at once:**
```bash
./backend/lsp/setup-all.sh
```
This runs the `setup.sh` for every language server found under `servers/`. The script prints the absolute path to each binary when done.

**2. Create your local config:**
```bash
cp backend/application-local.example.yaml backend/application-local.yaml
```
Fill in the absolute binary paths printed by the setup script. This file is gitignored and never committed.

**3. Create the local environment file if it does not exist:**
```bash
cp backend/.env.example backend/.env
```
Replace the placeholder authentication values when the corresponding login
providers are needed.

**4. Start the database, backend and frontend as described in the repository
README.** For example, the debugger-friendly backend workflow uses:

```bash
docker compose -f docker-compose.dev.yaml up -d database
cd backend
./gradlew bootRun
```

On startup, QuaK logs the validation result for each configured server:
```
INFO  LSP [python]: Binary found at '/path/to/venv/bin/pylsp'.
WARN  LSP [python]: Binary not found at '/wrong/path' — server will not be available.
```

The Docker-only development workflow does not use `application-local.yaml`.
Its image already contains both language servers and
`docker-compose.dev.yaml` supplies their container paths.

---

## Production / Docker

The repository's production image builds both language servers in dedicated
stages:

- `pylsp` is installed from the pinned Python requirements into
  `/opt/lsp/python`.
- `qasmlsp` is compiled as a static binary and copied to `/opt/lsp/qasm`.
- The application runs as the non-root user `quak` (UID/GID `10001`).

Build the same image used by CI:

```bash
docker build --build-arg SKIP_FRONTEND=false \
  --tag quak-production \
  --file backend/Dockerfile .
```

The build requires Docker and internet access to download the pinned build
tools and dependencies. It does not require Java, Python, Go or Node.js on the
host.

The Dockerfile does not call `setup-all.sh`. That script creates host-local
development installations, while Docker builds equivalent isolated artifacts
directly from the pinned requirements and QASM version.

`docker-compose.prod.yaml` configures both server commands and mounts
`/var/lib/quak/lsp-workspace` as a private temporary filesystem. Session
directories and their contents therefore disappear when the container stops.

Create the environment file once, replace its placeholder secrets, and start
the stack:

```bash
cp backend/.env.example backend/.env
QUAK_LSP_MAX_PROCESSES=40
QUAK_LSP_MAX_PROCESSES_PER_USER=4
docker compose -f docker-compose.prod.yaml up --build
```

`max-processes-per-user` must be at least the number of configured languages.
The defaults and process termination timeout remain in
`src/main/resources/application.yaml`.

The Python dependency versions, pip version, QASM server version and Gradle
wrapper version are pinned. Base-image tags, operating-system packages and npm
registry artifacts are not locked by digest, so builds are operationally
repeatable but not guaranteed to be byte-for-byte identical.

---

## Adding a New Language Server

### Backend

1. Create a directory under `servers/<language>/`
2. Add a `setup.sh` that installs the server binary into a local subdirectory (e.g. `go/bin/`, `venv/bin/`, `node_modules/.bin/`)
3. Add the necessary dependency file (`requirements.txt`, `package.json`, `go.mod`, etc.)
4. Run `./setup-all.sh` — it discovers all `setup.sh` scripts automatically
5. Add the server to `application-local.yaml`:

No Java code changes required.

### Frontend

6. Register the language in [`frontend/src/views/text-editor-view/languages/languages.ts`](../../frontend/src/views/text-editor-view/languages/languages.ts):
   ```
   new Language('<language>', '<ext>', '<Display Name>', '<language>'),
   ```
   Optionally pass a Monarch tokenizer as the fifth argument for syntax highlighting.

7. Add the language server to [`frontend/src/hooks/editor/useLSPSetup.ts`](../../frontend/src/hooks/editor/useLSPSetup.ts):
   ```
   { languageId: '<language>', wsUrl: `${wsBase}/lsp/<language>` },
   ```

The LSP client automatically negotiates capabilities on connect — no further frontend changes are needed.

---

## Directory Structure

```
lsp/
  setup-all.sh          — runs setup.sh for all language servers
  README.md             — this file
  servers/
    .gitignore          — ignores venv/, node_modules/, go/bin/, go/pkg/, etc.
    python/
      setup.sh          — creates venv, installs requirements.txt
      requirements.txt  — pinned dependencies (committed)
      venv/             — gitignored
    qasm/
      setup.sh          — installs qasmlsp via go install into go/bin/
      go/bin/           — gitignored
      go/pkg/           — gitignored (module cache)
```
