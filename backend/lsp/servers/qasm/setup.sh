#!/usr/bin/env bash
# Installs the qasmlsp language server binary into backend/lsp/servers/qasm/go/bin/.
# Uses a dedicated GOPATH so it stays isolated from the system Go environment.
# The version is pinned in go.mod next to this script.
# Run from any directory — paths are always resolved relative to this script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GOPATH_DIR="$SCRIPT_DIR/go"
BINARY="$GOPATH_DIR/bin/qasmlsp"

echo "[qasm-lsp] Installing qasmlsp..."
(cd "$SCRIPT_DIR" && GOPATH="$GOPATH_DIR" GOBIN="$GOPATH_DIR/bin" go install tool)

echo "[qasm-lsp] Setup complete."
echo "[qasm-lsp] Binary: $BINARY"
