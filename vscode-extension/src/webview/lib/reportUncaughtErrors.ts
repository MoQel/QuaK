import type { WebviewErrorMessage } from '../../shared/protocol.ts';

/** What the host needs to log a webview failure. */
export type ErrorReport = Omit<WebviewErrorMessage, 'type'>;

/**
 * Everything the ErrorBoundary cannot see.
 *
 * A boundary only catches what throws during render. A failing event handler, timer
 * or promise lands on the webview console instead, which nobody opens, so these are
 * forwarded to the host as well.
 */
export function reportUncaughtErrors(report: (error: ErrorReport) => void, target: EventTarget = window): void {
    target.addEventListener('error', (event) => {
        const { error, message } = event as ErrorEvent;
        report(describe(error, message));
    });

    target.addEventListener('unhandledrejection', (event) => {
        const { reason } = event as PromiseRejectionEvent;
        report(describe(reason, 'Unhandled promise rejection'));
    });
}

/** `fallback` carries the browser's own wording for whatever was thrown that is not an Error. */
function describe(thrown: unknown, fallback: string): ErrorReport {
    if (thrown instanceof Error) {
        return { message: thrown.message, stack: thrown.stack };
    }

    return { message: fallback, stack: stringify(thrown) };
}

function stringify(thrown: unknown): string | undefined {
    if (thrown === undefined) return undefined;
    if (typeof thrown === 'string') return thrown;

    try {
        return JSON.stringify(thrown) ?? Object.prototype.toString.call(thrown);
    } catch {
        return Object.prototype.toString.call(thrown);
    }
}
