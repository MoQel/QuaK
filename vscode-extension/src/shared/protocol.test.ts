import { describe, expect, it } from 'vitest';
import { isHostMessage, isWebviewMessage } from './protocol.ts';

// postMessage delivers `unknown`. Dispatching on a field that is not there would be a
// silent no-op at best and a crash in a message handler at worst.
describe('isWebviewMessage', () => {
    it.each([
        ['ready', { type: 'ready' }],
        ['enableEditing', { type: 'enableEditing' }],
        ['webviewError', { type: 'webviewError', message: 'boom' }],
        ['applyEdit', { type: 'applyEdit', requestId: 'r1', baseVersion: 3, content: { registers: [], layers: [] } }],
    ])('accepts a well-formed %s', (_name, message) => {
        expect(isWebviewMessage(message)).toBe(true);
    });

    it.each([
        ['nothing', undefined],
        ['a string', 'ready'],
        ['an unknown type', { type: 'reload' }],
        ['a host message', { type: 'documentChanged', version: 1, state: 'editable' }],
        ['an applyEdit without a version', { type: 'applyEdit', requestId: 'r1', content: {} }],
        ['an applyEdit without content', { type: 'applyEdit', requestId: 'r1', baseVersion: 3 }],
        ['a webviewError without a message', { type: 'webviewError' }],
    ])('refuses %s', (_name, message) => {
        expect(isWebviewMessage(message)).toBe(false);
    });
});

describe('isHostMessage', () => {
    it.each([
        [
            'documentChanged',
            { type: 'documentChanged', circuit: null, version: 1, state: 'readOnly', classification: null },
        ],
        ['editApplied', { type: 'editApplied', requestId: 'r1', version: 2 }],
        ['editRejected', { type: 'editRejected', requestId: 'r1', reason: 'stale', currentVersion: 2 }],
    ])('accepts a well-formed %s', (_name, message) => {
        expect(isHostMessage(message)).toBe(true);
    });

    it.each([
        ['nothing', null],
        ['a webview message', { type: 'ready' }],
        ['a documentChanged without a version', { type: 'documentChanged', state: 'editable' }],
        ['an editRejected without a request id', { type: 'editRejected', reason: 'stale', currentVersion: 2 }],
    ])('refuses %s', (_name, message) => {
        expect(isHostMessage(message)).toBe(false);
    });
});
