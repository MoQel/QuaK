import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { vscodeApi } from './vscodeApi.ts';
import './index.css';

const container = document.getElementById('app');
if (container) {
    createRoot(container).render(
        <StrictMode>
            <ErrorBoundary
                onError={(error, componentStack) =>
                    vscodeApi.postMessage({
                        type: 'webviewError',
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
