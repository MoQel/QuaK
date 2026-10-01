// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { reportUncaughtErrors, type ErrorReport } from './reportUncaughtErrors.ts';

function listen(): { reported: ErrorReport[]; target: EventTarget } {
    const reported: ErrorReport[] = [];
    const target = new EventTarget();
    reportUncaughtErrors((error) => reported.push(error), target);

    return { reported, target };
}

describe('reportUncaughtErrors', () => {
    it('forwards a thrown Error with its stack', () => {
        const { reported, target } = listen();
        const failure = new Error('handler defect');

        target.dispatchEvent(Object.assign(new Event('error'), { error: failure, message: 'handler defect' }));

        expect(reported).toHaveLength(1);
        expect(reported[0].message).toBe('handler defect');
        expect(reported[0].stack).toContain('handler defect');
    });

    it('forwards a rejected promise, which no error boundary ever sees', () => {
        const { reported, target } = listen();

        target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new Error('async defect') }));

        expect(reported).toEqual([expect.objectContaining({ message: 'async defect' })]);
    });

    it('still says something when what was thrown is not an Error', () => {
        const { reported, target } = listen();

        target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'just a string' }));

        expect(reported[0].message).toBe('Unhandled promise rejection');
        expect(reported[0].stack).toBe('just a string');
    });

    it('keeps a thrown object readable instead of stringifying it to [object Object]', () => {
        const { reported, target } = listen();

        target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: { code: 42 } }));

        expect(reported[0].stack).toBe('{"code":42}');
    });
});
