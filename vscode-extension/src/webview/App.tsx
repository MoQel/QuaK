import {
    CircuitDragProvider,
    CircuitPortProvider,
    CircuitView,
    CircuitWorkspaceShell,
    LibraryView,
    QuantikzExportButton,
} from '@quak/circuit-editor';
import { DEMO_CIRCUIT, NOOP_PORT } from './demoCircuit.ts';
import { OPERATIONS } from './library.ts';
import { useDocument } from './useDocument.ts';
import { vscodeApi } from './vscodeApi.ts';

// The circuit is fixed until the QASM transformation exists. Library and circuit
// share one webview because drag & drop cannot cross webview boundaries.
export function App() {
    const { snapshot, status } = useDocument();

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <div className="flex min-h-0 flex-1">
                <CircuitPortProvider port={NOOP_PORT}>
                    <CircuitDragProvider>
                        {/* Exports/edits the demo circuit for now; switches to the real one once the QASM transform lands. */}
                        <CircuitWorkspaceShell
                            defaultCollapsed={vscodeApi.getState()?.libraryCollapsed ?? false}
                            onCollapsedChange={(collapsed) =>
                                vscodeApi.setState({ ...vscodeApi.getState(), libraryCollapsed: collapsed })
                            }
                            library={<LibraryView operations={OPERATIONS} onOperationSelect={() => {}} />}
                            editor={
                                <CircuitView
                                    circuit={DEMO_CIRCUIT}
                                    toolbarStart={<QuantikzExportButton circuit={DEMO_CIRCUIT} />}
                                />
                            }
                        />
                    </CircuitDragProvider>
                </CircuitPortProvider>
            </div>

            <details className="border-t border-border px-3 py-2 text-xs text-text-muted">
                <summary className="cursor-pointer">
                    {status} · fixed demo circuit until the QASM transformation lands
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">{snapshot?.text ?? ''}</pre>
            </details>
        </div>
    );
}
