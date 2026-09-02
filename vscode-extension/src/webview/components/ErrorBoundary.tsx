import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    onError: (error: Error, componentStack: string | null) => void;
}

interface ErrorBoundaryState {
    failed: boolean;
}

/**
 * Keeps a render crash from leaving an empty panel.
 *
 * React unmounts the whole tree when a render throws, and a webview has nowhere to
 * report that: no console anyone reads, no stack in the extension log. So the crash
 * is handed to the host and something is put on screen in place of the editor.
 *
 * A class is not a style choice here. There is no hook form of this.
 */
export class ErrorBoundary extends Component<Readonly<ErrorBoundaryProps>, ErrorBoundaryState> {
    public override state: ErrorBoundaryState = { failed: false };

    public static getDerivedStateFromError(): ErrorBoundaryState {
        return { failed: true };
    }

    public override componentDidCatch(error: Error, info: ErrorInfo): void {
        this.props.onError(error, info.componentStack ?? null);
    }

    public override render(): ReactNode {
        if (!this.state.failed) {
            return this.props.children;
        }

        return (
            <div className="flex h-screen flex-col items-center justify-center gap-2 bg-bg p-6 text-center text-text">
                <p className="font-medium">The circuit editor stopped working.</p>
                <p className="text-xs text-text-muted">
                    Close this editor and open the file again. The details are in the QuaK output channel; your file has
                    not been changed.
                </p>
            </div>
        );
    }
}
