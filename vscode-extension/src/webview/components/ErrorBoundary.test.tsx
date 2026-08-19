// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary.tsx';

function Boom(): ReactNode {
    throw new Error('render defect');
}

function render(children: ReactNode, onError: (error: Error, componentStack: string | null) => void): HTMLElement {
    const container = document.createElement('div');
    document.body.append(container);

    act(() => {
        createRoot(container).render(<ErrorBoundary onError={onError}>{children}</ErrorBoundary>);
    });

    return container;
}

describe('ErrorBoundary', () => {
    // React reports a caught render error on the console; the test asserts on the boundary, not on that.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    afterEach(() => {
        document.body.replaceChildren();
        consoleError.mockClear();
    });

    it('stays out of the way while nothing throws', () => {
        const container = render(<p>circuit</p>, () => {});

        expect(container.textContent).toContain('circuit');
    });

    it('puts something on screen instead of leaving an empty panel', () => {
        const container = render(<Boom />, () => {});

        expect(container.textContent).toContain('stopped working');
    });

    it('hands the crash to the host, which is the only place it can be read', () => {
        const reported: { error: Error; componentStack: string | null }[] = [];

        render(<Boom />, (error, componentStack) => reported.push({ error, componentStack }));

        expect(reported).toHaveLength(1);
        expect(reported[0].error.message).toBe('render defect');
        expect(reported[0].componentStack).toContain('Boom');
    });
});
