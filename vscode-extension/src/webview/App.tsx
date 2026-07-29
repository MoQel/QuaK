import {
    CircuitDragProvider,
    CircuitStoreProvider,
    CircuitToolbar,
    CircuitView,
    CircuitWorkspaceShell,
    LibraryView,
    QuantikzExportButton,
} from '@quak/circuit-editor';
import { DocumentNotice } from './DocumentNotice.tsx';
import { OPERATIONS } from './library.ts';
import { useCircuitDocument } from './useCircuitDocument.ts';
import { vscodeApi } from './vscodeApi.ts';

// Library and circuit share one webview because drag & drop cannot cross webview
// boundaries. The circuit itself is the open .qasm file, parsed.
export function App() {
    const { circuit, setCircuit, status, state, diagnostics, hasDocument } = useCircuitDocument();

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <DocumentNotice
                state={state}
                diagnostics={diagnostics}
                onEditAnyway={() => vscodeApi.postMessage({ type: 'enableEditing' })}
            />

            <div className="flex min-h-0 flex-1">
                <CircuitStoreProvider circuit={circuit} setCircuit={setCircuit}>
                    <CircuitDragProvider>
                        <CircuitWorkspaceShell
                            defaultCollapsed={vscodeApi.getState()?.libraryCollapsed ?? false}
                            onCollapsedChange={(collapsed) =>
                                vscodeApi.setState({ ...vscodeApi.getState(), libraryCollapsed: collapsed })
                            }
                            library={<LibraryView operations={OPERATIONS} onOperationSelect={() => {}} />}
                            editor={
                                <CircuitView
                                    header={
                                        <div className="px-2 py-1">
                                            <CircuitToolbar
                                                start={<QuantikzExportButton circuit={circuit ?? null} />}
                                            />
                                        </div>
                                    }
                                />
                            }
                        />
                    </CircuitDragProvider>
                </CircuitStoreProvider>
            </div>

            <details className="border-t border-border px-3 py-2 text-xs text-text-muted">
                <summary className="cursor-pointer">{hasDocument ? status : 'waiting for the document…'}</summary>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(diagnostics, null, 2)}</pre>
            </details>
        </div>
    );
}
