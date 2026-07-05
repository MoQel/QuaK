#!/usr/bin/env bash
# Sets up the Python LSP server in an isolated virtual environment.
# Run from any directory — the venv is always created relative to this script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"
PIP_VERSION="26.1.2"

echo "[python-lsp] Creating virtual environment..."
python3 -m venv "$VENV_DIR"

echo "[python-lsp] Installing dependencies..."
"$VENV_DIR/bin/pip" install "pip==$PIP_VERSION" --quiet
"$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/requirements.txt" --quiet

echo "[python-lsp] Setup complete."
echo "[python-lsp] Binary: $VENV_DIR/bin/pylsp"
