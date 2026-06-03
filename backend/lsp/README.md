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
    servers:
      python:
        command: ["pylsp"]
        workingDirectory: "/var/quak/lsp-workspace"
        environment:
          PYTHONUNBUFFERED: "1"
```

Spring Boot environment variable equivalent:
```bash
QUAK_LSP_SERVERS_PYTHON_COMMAND_0=pylsp
QUAK_LSP_SERVERS_PYTHON_WORKING-DIRECTORY=/var/quak/lsp-workspace
```

---

## Adding a New Language Server

1. Create a directory under `servers/<language>/`
2. Add a `setup.sh` that installs the server binary into a local `venv/` (or equivalent)
3. Add the necessary dependency file (`requirements.txt`, `package.json`, etc.)
4. Run `./setup-all.sh` — it discovers all `setup.sh` scripts automatically
5. Add the server to `application-local.yaml`

No Java code changes required.

---

## Directory Structure

```
lsp/
  setup-all.sh          — runs setup.sh for all language servers
  README.md             — this file
  servers/
    .gitignore          — ignores venv/, node_modules/, etc.
    python/
      setup.sh          — creates venv, installs requirements.txt
      requirements.txt  — pinned dependencies (committed)
      venv/             — gitignored
```
