// Package qasm pins the qasmlsp language server, a tool of this module that setup.sh and the Dockerfile build with
// `go install tool`.
package qasm

// The license check (.github/workflows/licenses.yml) only follows modules this module imports, not its tools.
import _ "github.com/orangekame3/qasmtools/lsp/server"
