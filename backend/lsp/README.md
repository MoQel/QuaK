# LSP Server Setup

QuaK embeds language servers as child processes and communicates with them via JSON-RPC over stdio.
Each language server lives in its own subdirectory and is configured independently.

## Local Development

**1. Set up all language servers at once:**
```bash
cd backend/lsp
./setup-all.sh
```
This runs the `setup.sh` for every language server found under `servers/`. The script prints the absolute path to each binary when done.

**2. Create your local config:**
```bash
cp backend/application-local.example.yaml backend/application-local.yaml
```
Fill in the absolute binary paths printed by the setup script. This file is gitignored and never committed.

**3. Run the backend.** On startup, QuaK logs the validation result for each configured server:
```
INFO  LSP [python]: Binary found at '/path/to/venv/bin/pylsp'.
WARN  LSP [python]: Binary not found at '/wrong/path' — server will not be available.
```

---

## Production / Docker

Install language servers globally — no venv or absolute paths needed:

```dockerfile
RUN pip install python-lsp-server
```

In `application-local.yaml` (or via environment variables):
```yaml
quak:
  lsp:
    limits:
      max-processes: 40
      max-processes-per-user: 4
    process:
      termination-timeout-ms: 2000
    servers:
      python:
        command: ["pylsp"]
        workingDirectory: "/var/quak/lsp-workspace"
        environment:
          PYTHONUNBUFFERED: "1"
```

`max-processes` limits all active language-server processes in one backend
instance. `max-processes-per-user` protects capacity from a single user and must
be at least the number of configured languages.

Spring Boot environment variable equivalent:
```bash
QUAK_LSP_SERVERS_PYTHON_COMMAND_0=pylsp
QUAK_LSP_SERVERS_PYTHON_WORKING-DIRECTORY=/var/quak/lsp-workspace
```

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
