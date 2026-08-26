import {
    CircuitDragProvider,
    CircuitStoreProvider,
    CircuitToolbar,
    CircuitView,
    CircuitWorkspaceShell,
    LibraryView,
    QuantikzExportButton,
} from '@quak/circuit-editor';
import { DocumentNotice } from './components/DocumentNotice.tsx';
import { OPERATIONS } from '../shared/operations.ts';
import { useCircuitDocument } from './hooks/useCircuitDocument.ts';
import { vscodeApi } from './vscodeApi.ts';

/** Root React component for the VSCode webview circuit editor. */
export function App() {
    const { circuit, setCircuit, state, classification } = useCircuitDocument();
    const initialLibraryCollapsed = vscodeApi.getState()?.libraryCollapsed ?? false;

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <DocumentNotice
                state={state}
                classification={classification}
                hasCircuit={circuit !== undefined}
                onEditAnyway={() => vscodeApi.postMessage({ type: 'enableEditing' })}
            />

            <div className="flex min-h-0 flex-1">
                <CircuitStoreProvider circuit={circuit} setCircuit={setCircuit}>
                    <CircuitDragProvider>
                        <CircuitWorkspaceShell
                            defaultCollapsed={initialLibraryCollapsed}
                            onCollapsedChange={(libraryCollapsed) =>
                                vscodeApi.setState({ ...vscodeApi.getState(), libraryCollapsed })
                            }
                            library={<LibraryView operations={OPERATIONS} />}
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
        </div>
    );
}
