import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl, resolveWebSocketBaseUrl } from './backendUrls';

describe('resolveApiBaseUrl', () => {
    it('uses an explicit API URL', () => {
        expect(resolveApiBaseUrl('https://api.example.test', false)).toBe('https://api.example.test');
    });

    it('uses the local backend during development', () => {
        expect(resolveApiBaseUrl(undefined, true)).toBe('http://localhost:8080');
    });

    it('uses same-origin requests in production', () => {
        expect(resolveApiBaseUrl(undefined, false)).toBe('');
    });
});

describe('resolveWebSocketBaseUrl', () => {
    it('uses and normalizes an explicit WebSocket URL', () => {
        expect(
            resolveWebSocketBaseUrl('wss://lsp.example.test/socket/', false, {
                protocol: 'https:',
                host: 'app.example.test',
            }),
        ).toBe('wss://lsp.example.test/socket');
    });

    it('uses the local backend during development', () => {
        expect(
            resolveWebSocketBaseUrl(undefined, true, {
                protocol: 'http:',
                host: 'localhost:5173',
            }),
        ).toBe('ws://localhost:8080');
    });

    it('derives an unencrypted same-origin URL for HTTP production pages', () => {
        expect(
            resolveWebSocketBaseUrl(undefined, false, {
                protocol: 'http:',
                host: 'app.example.test:8080',
            }),
        ).toBe('ws://app.example.test:8080');
    });

    it('derives a secure same-origin URL for HTTPS production pages', () => {
        expect(
            resolveWebSocketBaseUrl(undefined, false, {
                protocol: 'https:',
                host: 'app.example.test',
            }),
        ).toBe('wss://app.example.test');
    });
});
