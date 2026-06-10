#!/usr/bin/env bash
# Sets up all configured LSP servers.
# Discovers any language server that provides a setup.sh in its directory.
# Run this once after cloning, or after adding a new language server.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

for command in python3 go; do
    if ! command -v "$command" >/dev/null 2>&1; then
        echo "Missing required command: $command" >&2
        echo "See $SCRIPT_DIR/README.md for local prerequisites." >&2
        exit 1
    fi
done

echo "Setting up all LSP servers..."
echo ""

found=0
for setup_script in "$SCRIPT_DIR/servers/"*/setup.sh; do
    if [ -f "$setup_script" ]; then
        bash "$setup_script"
        echo ""
        found=$((found + 1))
    fi
done

if [ "$found" -eq 0 ]; then
    echo "No language server setup scripts found in $SCRIPT_DIR/servers/"
    exit 1
fi

echo "All $found LSP server(s) ready."
echo ""
echo "Next: from the repository root, copy backend/application-local.example.yaml"
echo "      to backend/application-local.yaml and set the printed binary paths."
