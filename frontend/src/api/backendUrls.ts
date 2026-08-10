type BrowserLocation = Pick<Location, 'protocol' | 'host'>;

export function resolveApiBaseUrl(configuredUrl: string | undefined, isDevelopment: boolean): string {
    return configuredUrl ?? (isDevelopment ? 'http://localhost:8080' : '');
}

export function resolveWebSocketBaseUrl(
    configuredUrl: string | undefined,
    isDevelopment: boolean,
    location: BrowserLocation,
): string {
    if (configuredUrl) {
        return configuredUrl.replace(/\/+$/, '');
    }

    if (isDevelopment) {
        return 'ws://localhost:8080';
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}`;
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.DEV);

export const WS_BASE_URL = resolveWebSocketBaseUrl(
    import.meta.env.VITE_WS_URL,
    import.meta.env.DEV,
    globalThis.location,
);
