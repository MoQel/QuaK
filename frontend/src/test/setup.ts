import '@testing-library/jest-dom'; // Global availability

// Global hack for Recharts (ResponsiveContainer)
// JSDOM does not have a ResizeObserver, simulate it here
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};