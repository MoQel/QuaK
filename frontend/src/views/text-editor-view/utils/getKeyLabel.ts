const isMac = typeof globalThis !== 'undefined' && navigator.userAgent.includes('Mac');

export const getKeyLabel = () => {
    return isMac ? '⌘' : 'Ctrl';
};

export const getOptionKeyLabel = () => {
    return isMac ? '⌥' : 'Alt';
};
