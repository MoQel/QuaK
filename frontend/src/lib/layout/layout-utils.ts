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
                tryPos('inspector', 'left') ||
                tryPos('library', 'above') ||
                tryPos('code', 'left')
            );

        case 'code':
            return (
                tryPos('circuit', 'right') ||
                tryPos('inspector', 'right') ||
                tryPos('results', 'above') ||
                tryPos('file', 'right')
            );

        case 'circuit':
            return (
                tryPos('file', 'right') ||
                tryPos('code', 'left') ||
                tryPos('inspector', 'above') ||
                tryPos('library', 'right')
            );

        // --- BOTTOM ROW PANELS (Anchor to Top Sibling First) ---
        case 'library':
            return tryPos('file', 'below') || tryPos('inspector', 'left') || tryPos('circuit', 'left');

        case 'inspector':
            return tryPos('circuit', 'below') || tryPos('library', 'right') || tryPos('results', 'left');

        case 'results':
            return tryPos('code', 'below') || tryPos('inspector', 'right') || tryPos('circuit', 'right');

        default:
            return null;
    }
};

/**
 * Builds the firm, predefined layout programmatically.
 */
export const buildDefaultLayout = (api: DockviewApi) => {
    api.clear();

    // Tune these
    const LEFT_W = 400;
    const RIGHT_W = 520;
    const BOTTOM_H = 350;

    // 1) Top row
    const circuit = api.addPanel({
        id: 'circuit',
        component: 'circuit',
        title: 'Circuit',
    });

    const file = api.addPanel({
        id: 'file',
        component: 'file',
        title: 'Project',
        position: { referencePanel: circuit, direction: 'left' },
        initialWidth: LEFT_W,
    });

    const code = api.addPanel({
        id: 'code',
        component: 'code',
        title: 'Code Editor',
        position: { referencePanel: circuit, direction: 'right' },
        initialWidth: RIGHT_W,
    });

    // 2) Bottom row (give bottoms a height so tops stay larger)
    api.addPanel({
        id: 'library',
        component: 'library',
        title: 'Library',
        position: { referencePanel: file, direction: 'below' },
        initialHeight: BOTTOM_H,
    });

    api.addPanel({
        id: 'inspector',
        component: 'inspector',
        title: 'Inspector',
        position: { referencePanel: circuit, direction: 'below' },
        initialHeight: BOTTOM_H,
    });

    api.addPanel({
        id: 'results',
        component: 'results',
        title: 'Results',
        position: { referencePanel: code, direction: 'below' },
        initialHeight: BOTTOM_H,
    });
};
