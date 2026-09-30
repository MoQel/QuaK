// Package qasm pins the qasmlsp language server, which setup.sh and the Dockerfile build with `go install tool`.
//
// The imports mirror cmd/qasmlsp/main.go of qasmtools. The license check (.github/workflows/licenses.yml) resolves
// dependencies with `go list -deps ./...`, which does not follow tool directives.
package qasm

import (
	_ "github.com/orangekame3/qasmtools/lsp/server"
	_ "github.com/tliron/commonlog"
	_ "github.com/tliron/commonlog/simple"
)
