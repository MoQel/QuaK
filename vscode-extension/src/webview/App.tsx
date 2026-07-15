import { useDocument } from './useDocument.ts';

// Still a text mirror, but rendered by React now. The circuit editor replaces the
// body of this component once it is a shared package.
export function App() {
    const { snapshot, status, requestEdit } = useDocument();

    return (
        <>
            <header>
                <h1>QuaK Circuit Editor</h1>
                <p id="status">{status}</p>
                <div id="actions">
                    <button type="button" onClick={() => requestEdit(`${snapshot?.text.trimEnd() ?? ''}\nx q[0];\n`)}>
                        Append x q[0];
                    </button>
                </div>
            </header>
            <pre id="root">{snapshot?.text ?? ''}</pre>
        </>
    );
}
