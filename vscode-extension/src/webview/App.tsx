import { useDocument } from './useDocument.ts';

// Still a text mirror, rendered by React and styled with Tailwind against
// VSCode's theme variables. The circuit editor replaces the body of this
// component once it is a shared package.
export function App() {
    const { snapshot, status, requestEdit } = useDocument();

    return (
        <div className="min-h-screen bg-vscode-bg p-3 font-vscode text-vscode-fg">
            <header className="mb-3 border-b border-vscode-border pb-2">
                <h1 className="m-0 text-sm font-semibold text-vscode-accent">QuaK Circuit Editor</h1>
                <p className="mt-1 mb-0 text-xs text-vscode-muted">{status}</p>
                <div className="mt-2 flex gap-2">
                    <button
                        type="button"
                        className="cursor-pointer rounded-sm border-none bg-vscode-button px-2.5 py-1 text-xs text-vscode-button-fg hover:bg-vscode-button-hover"
                        onClick={() => requestEdit(`${snapshot?.text.trimEnd() ?? ''}\nx q[0];\n`)}
                    >
                        Append x q[0];
                    </button>
                </div>
            </header>
            <pre className="m-0 whitespace-pre-wrap">{snapshot?.text ?? ''}</pre>
        </div>
    );
}
