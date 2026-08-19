import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { reportUncaughtErrors, type ErrorReport } from './lib/reportUncaughtErrors.ts';
import { vscodeApi } from './vscodeApi.ts';
import './index.css';

const postError = (error: ErrorReport): void => vscodeApi.postMessage({ type: 'webviewError', ...error });

// Armed before the first render: a failure while mounting is the one worth seeing most.
reportUncaughtErrors(postError);

const container = document.getElementById('app');
if (container) {
    createRoot(container).render(
        <StrictMode>
            <ErrorBoundary
                onError={(error, componentStack) =>
                    postError({
                        message: error.message,
                        stack: `${error.stack ?? error.message}${componentStack ?? ''}`,
                    })
                }
            >
                <App />
            </ErrorBoundary>
        </StrictMode>,
    );
}
