import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {}, // deprecated
        removeListener: () => {}, // deprecated
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});

// Mock IntersectionObserver
const noop = () => undefined;

global.IntersectionObserver = class IntersectionObserver {
    disconnect = noop;
    observe = noop;
    takeRecords = () => [];
    unobserve = noop;
} as unknown as typeof IntersectionObserver;

// Global hack for Recharts (ResponsiveContainer)
// JSDOM does not have a ResizeObserver, simulate it here
global.ResizeObserver = class ResizeObserver {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
};
