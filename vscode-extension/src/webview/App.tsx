import { CircuitDragProvider, CircuitPortProvider, CircuitView } from '@quak/circuit-editor';
import { DEMO_CIRCUIT, NOOP_PORT } from './demoCircuit.ts';
import { useDocument } from './useDocument.ts';

// The circuit here is fixed, not derived from the open document: turning QASM
// text into a circuit needs the transformation, which does not exist yet.
// Everything around it — the document sync, the theme, the editor itself — is real.
export function App() {
    const { snapshot, status } = useDocument();

    return (
        <div className="flex h-screen flex-col bg-bg text-text">
            <div className="min-h-0 flex-1">
                <CircuitPortProvider port={NOOP_PORT}>
                    <CircuitDragProvider>
                        <CircuitView circuit={DEMO_CIRCUIT} />
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
