import { DockviewApi } from 'dockview-react';

export const LAYOUT_STORAGE_KEY = 'ide-dockview-layout-v1';

/**
 * Smart placement logic to determine where a new panel should appear
 * based on existing neighbors.
 */
export const getOptimalPosition = (panelId: string, api: DockviewApi) => {
    const exists = (id: string) => !!api.getPanel(id);

    const tryPos = (neighborId: string, direction: 'above' | 'below' | 'left' | 'right') => {
        if (exists(neighborId)) {
            return { referencePanel: api.getPanel(neighborId)!, direction };
        }
        return null;
    };

    switch (panelId) {
        case 'file':
            return (
                tryPos('circuit', 'left') ||
                tryPos('code', 'left') ||
                tryPos('library', 'above') ||
                tryPos('inspector', 'above')
            );

        case 'circuit':
            return (
                tryPos('file', 'right') ||
                tryPos('code', 'left') ||
                tryPos('inspector', 'above') ||
                tryPos('library', 'right')
            );

        case 'code':
            return (
                tryPos('circuit', 'right') ||
                tryPos('file', 'right') ||
                tryPos('results', 'above') ||
                tryPos('inspector', 'above')
            );

        case 'library':
            return (
                tryPos('inspector', 'left') ||
                tryPos('results', 'left') ||
                tryPos('file', 'below') ||
                tryPos('circuit', 'below')
            );

        case 'inspector':
            return (
                tryPos('library', 'right') ||
                tryPos('results', 'left') ||
                tryPos('circuit', 'below') ||
                tryPos('file', 'below')
            );

        case 'results':
            return (
                tryPos('inspector', 'right') ||
                tryPos('library', 'right') ||
                tryPos('code', 'below') ||
                tryPos('circuit', 'below')
            );

        default:
            return null;
    }
};

/**
 * Builds the firm, predefined layout programmatically.
 */
export const buildDefaultLayout = (api: DockviewApi) => {
    api.clear();

    const LEFT_W = 400;
    const RIGHT_W = 520;
    const BOTTOM_H = 350;

    // 1. Top-row anchor
    const circuit = api.addPanel({
        id: 'circuit',
        component: 'circuit',
        title: 'Circuit',
    });

    // 2. Bottom-row anchor
    // Note: Split vertically first for a continuous horizontal splitter.
    const inspector = api.addPanel({
        id: 'inspector',
        component: 'inspector',
        title: 'Inspector',
        position: { referencePanel: circuit, direction: 'below' },
        initialHeight: BOTTOM_H,
    });

    // 3. Fill top row (left / right of circuit)
    api.addPanel({
        id: 'file',
        component: 'file',
        title: 'Project',
        position: { referencePanel: circuit, direction: 'left' },
        initialWidth: LEFT_W,
    });

    api.addPanel({
        id: 'code',
        component: 'code',
        title: 'Code Editor',
        position: { referencePanel: circuit, direction: 'right' },
        initialWidth: RIGHT_W,
    });

    // 4. Fill bottom row (left / right of inspector)
    api.addPanel({
        id: 'library',
        component: 'library',
        title: 'Library',
        position: { referencePanel: inspector, direction: 'left' },
        initialWidth: LEFT_W,
    });

    api.addPanel({
        id: 'results',
        component: 'results',
        title: 'Results',
        position: { referencePanel: inspector, direction: 'right' },
        initialWidth: RIGHT_W,
    });
};
