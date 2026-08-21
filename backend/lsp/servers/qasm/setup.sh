#!/usr/bin/env bash
# Installs the qasmlsp language server binary into backend/lsp/servers/qasm/go/bin/.
# Uses a dedicated GOPATH so it stays isolated from the system Go environment.
# Run from any directory — paths are always resolved relative to this script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GOPATH_DIR="$SCRIPT_DIR/go"
BINARY="$GOPATH_DIR/bin/qasmlsp"
QASMLSP_VERSION="v0.2.17"

echo "[qasm-lsp] Installing qasmlsp..."
GOPATH="$GOPATH_DIR" go install "github.com/orangekame3/qasmtools/cmd/qasmlsp@$QASMLSP_VERSION"

echo "[qasm-lsp] Setup complete."
echo "[qasm-lsp] Binary: $BINARY"
