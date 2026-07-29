import {
    CircuitDragProvider,
    CircuitStoreProvider,
    CircuitToolbar,
    CircuitView,
    CircuitWorkspaceShell,
    LibraryView,
    QuantikzExportButton,
} from '@quak/circuit-editor';
import type { CircuitResponse } from '@quak/circuit-core';
import { useState } from 'react';
import { DEMO_CIRCUIT } from './demoCircuit.ts';
import { OPERATIONS } from './library.ts';
import { useDocument } from './useDocument.ts';
import { vscodeApi } from './vscodeApi.ts';

// The circuit is fixed until the QASM transformation exists. Library and circuit
// share one webview because drag & drop cannot cross webview boundaries.
export function App() {
    const { snapshot, status } = useDocument();

    // Local only: edits change the circuit inside the webview but are not written
    // back to the document yet. That needs circuit→QASM (packages/qasm-transform),
    // after which setCircuit becomes "generate, then requestEdit".
    const [circuit, setCircuit] = useState<CircuitResponse | undefined>(DEMO_CIRCUIT);

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
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
                <summary className="cursor-pointer">
                    {status} · fixed demo circuit until the QASM transformation lands
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">{snapshot?.text ?? ''}</pre>
            </details>
        </div>
    );
}
