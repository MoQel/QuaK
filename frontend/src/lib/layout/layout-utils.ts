import { DockviewApi } from 'dockview-react';

export const LAYOUT_STORAGE_KEY = 'ide-dockview-layout-v2';

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
        case PANELS.file:
            return tryPos(PANELS.circuit, 'left') || tryPos(PANELS.code, 'left') || tryPos('inspector', 'above');

        case PANELS.circuit:
            return tryPos(PANELS.file, 'right') || tryPos(PANELS.code, 'left') || tryPos(PANELS.inspector, 'above');

        case PANELS.code:
            return (
                tryPos(PANELS.circuit, 'right') ||
                tryPos(PANELS.file, 'right') ||
                tryPos(PANELS.results, 'above') ||
                tryPos(PANELS.inspector, 'above')
            );

        case PANELS.inspector:
            return tryPos(PANELS.results, 'left') || tryPos(PANELS.circuit, 'below') || tryPos(PANELS.file, 'below');

        case PANELS.results:
            return tryPos(PANELS.inspector, 'right') || tryPos(PANELS.code, 'below') || tryPos(PANELS.circuit, 'below');

        default:
            return null;
    }
};

/**
 * Builds the firm, predefined layout programmatically.
 */
export const buildDefaultLayout = (api: DockviewApi) => {
    api.clear();

    const layoutWidth = api.width || 1200;
    const projectWidth = Math.round(layoutWidth * 0.15);
    const codeEditorWidth = Math.round(layoutWidth * 0.3);
    const bottomPanelWidth = Math.round(layoutWidth * 0.5);
    const bottomPanelHeight = 300;

    // 1. Top-row anchor
    const circuit = api.addPanel({
        id: PANELS.circuit,
        component: PANELS.circuit,
        title: 'Circuit',
    });

    // 2. Bottom-row anchor
    // Note: Split vertically first for a continuous horizontal splitter.
    const inspector = api.addPanel({
        id: PANELS.inspector,
        component: PANELS.inspector,
        title: 'Inspector',
        position: { referencePanel: circuit, direction: 'below' },
        initialHeight: bottomPanelHeight,
    });

    // 3. Fill top row (left / right of circuit)
    api.addPanel({
        id: PANELS.file,
        component: PANELS.file,
        title: 'Project',
        position: { referencePanel: circuit, direction: 'left' },
        initialWidth: projectWidth,
    });

    api.addPanel({
        id: PANELS.code,
        component: PANELS.code,
        title: 'Code Editor',
        position: { referencePanel: circuit, direction: 'right' },
        initialWidth: codeEditorWidth,
    });

    // 4. Fill the remaining bottom row
    api.addPanel({
        id: PANELS.results,
        component: PANELS.results,
        title: 'Results',
        position: { referencePanel: inspector, direction: 'right' },
        initialWidth: bottomPanelWidth,
    });
};

export const PANELS = {
    circuit: 'circuit',
    code: 'code',
    file: 'file',
    inspector: 'inspector',
    results: 'results',
};

export const PANEL_TITLES: Record<string, string> = {
    circuit: 'Circuit',
    code: 'Code Editor',
    file: 'Project',
    inspector: 'Inspector',
    results: 'Results',
};
const PRIMARY_PANELS = new Set([PANELS.circuit, PANELS.code]);

export const applyGroupType = (api: DockviewApi, id: string) => {
    const panel = api.getPanel(id);
    if (!panel) return;
    panel.group.element.dataset.groupType = PRIMARY_PANELS.has(id) ? 'primary' : 'secondary';
};
