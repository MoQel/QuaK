import { CircuitDragProvider, CircuitPortProvider, CircuitView, LibraryView } from '@quak/circuit-editor';
import { DEMO_CIRCUIT, NOOP_PORT } from './demoCircuit.ts';
import { OPERATIONS } from './library.ts';
import { useDocument } from './useDocument.ts';

// The circuit is fixed until the QASM transformation exists. Library and circuit
// share one webview because drag & drop cannot cross webview boundaries.
export function App() {
    const { snapshot, status } = useDocument();

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <div className="flex min-h-0 flex-1">
                <CircuitPortProvider port={NOOP_PORT}>
                    <CircuitDragProvider>
                        <aside className="w-56 shrink-0 overflow-y-auto border-r border-border">
                            <LibraryView operations={OPERATIONS} onOperationSelect={() => {}} />
                        </aside>
                        <div className="min-w-0 flex-1">
                            <CircuitView circuit={DEMO_CIRCUIT} />
                        </div>
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
