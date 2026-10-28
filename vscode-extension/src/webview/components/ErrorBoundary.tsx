import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    onError: (error: Error, componentStack: string | null) => void;
}

interface ErrorBoundaryState {
    failed: boolean;
}

/**
 * Hands a render crash to the host's log and shows a fallback instead of an empty panel. A class, because React has no
 * hook form of an error boundary.
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
