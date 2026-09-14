import { Orientation, type AddPanelPositionOptions, type DockviewApi, type SerializedDockview } from 'dockview-react';

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
        case PANELS.file:
            return (
                tryPos(PANELS.circuit, 'left') ||
                tryPos(PANELS.code, 'left') ||
                tryPos(PANELS.library, 'above') ||
                tryPos('inspector', 'above')
            );

        case PANELS.circuit:
            return (
                tryPos(PANELS.file, 'right') ||
                tryPos(PANELS.code, 'left') ||
                tryPos(PANELS.inspector, 'above') ||
                tryPos(PANELS.library, 'right')
            );

        case PANELS.code:
            return (
                tryPos(PANELS.circuit, 'right') ||
                tryPos(PANELS.file, 'right') ||
                tryPos(PANELS.results, 'above') ||
                tryPos(PANELS.inspector, 'above')
            );

        case PANELS.library:
            return (
                tryPos(PANELS.inspector, 'left') ||
                tryPos(PANELS.results, 'left') ||
                tryPos(PANELS.file, 'below') ||
                tryPos(PANELS.circuit, 'below')
            );

        case PANELS.inspector:
            return (
                tryPos(PANELS.library, 'right') ||
                tryPos(PANELS.results, 'left') ||
                tryPos(PANELS.circuit, 'below') ||
                tryPos(PANELS.file, 'below')
            );

        case PANELS.results:
            return (
                tryPos(PANELS.inspector, 'right') ||
                tryPos(PANELS.library, 'right') ||
                tryPos(PANELS.code, 'below') ||
                tryPos(PANELS.circuit, 'below')
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
        initialHeight: BOTTOM_H,
    });

    // 3. Fill top row (left / right of circuit)
    api.addPanel({
        id: PANELS.file,
        component: PANELS.file,
        title: 'Project',
        position: { referencePanel: circuit, direction: 'left' },
        initialWidth: LEFT_W,
    });

    api.addPanel({
        id: PANELS.code,
        component: PANELS.code,
        title: 'Code Editor',
        position: { referencePanel: circuit, direction: 'right' },
        initialWidth: RIGHT_W,
    });

    // 4. Fill bottom row (left / right of inspector)
    api.addPanel({
        id: PANELS.library,
        component: PANELS.library,
        title: 'Library',
        position: { referencePanel: inspector, direction: 'left' },
        initialWidth: LEFT_W,
    });

    api.addPanel({
        id: PANELS.results,
        component: PANELS.results,
        title: 'Results',
        position: { referencePanel: inspector, direction: 'right' },
        initialWidth: RIGHT_W,
    });
};

export const PANELS = {
    circuit: 'circuit',
    code: 'code',
    file: 'file',
    inspector: 'inspector',
    library: 'library',
    results: 'results',
};

export const PANEL_TITLES: Record<string, string> = {
    circuit: 'Circuit',
    code: 'Code Editor',
    file: 'Project',
    inspector: 'Inspector',
    library: 'Library',
    results: 'Results',
};

type SerializedGridNode = SerializedDockview['grid']['root'];

type SerializedDockviewGroup = {
    id: string;
    views: string[];
    activeView?: string;
};

type PanelLeafMatch = {
    group: SerializedDockviewGroup;
    node: SerializedGridNode;
    parent?: {
        children: SerializedGridNode[];
        childIndex: number;
        orientation: SerializedDockview['grid']['orientation'];
    };
};

export type SavedPanelPlacement = {
    position: AddPanelPositionOptions;
    initialWidth?: number;
    initialHeight?: number;
};

const oppositeOrientation = (orientation: SerializedDockview['grid']['orientation']) =>
    orientation === Orientation.HORIZONTAL ? Orientation.VERTICAL : Orientation.HORIZONTAL;

const findPanelLeaf = (
    node: SerializedGridNode,
    panelId: string,
    orientation: SerializedDockview['grid']['orientation'],
    parent?: PanelLeafMatch['parent'],
): PanelLeafMatch | null => {
    if (node.type === 'leaf') {
        const group = node.data as SerializedDockviewGroup;
        return group.views.includes(panelId) ? { group, node, parent } : null;
    }

    const children = node.data as SerializedGridNode[];
    for (const [childIndex, child] of children.entries()) {
        const match = findPanelLeaf(child, panelId, oppositeOrientation(orientation), {
            children,
            childIndex,
            orientation,
        });
        if (match) return match;
    }

    return null;
};

const findReferencePanelId = (node: SerializedGridNode, edge: 'start' | 'end'): string | null => {
    if (node.type === 'leaf') {
        const group = node.data as SerializedDockviewGroup;
        return group.views[0] ?? null;
    }

    const children = node.data as SerializedGridNode[];
    const child = edge === 'start' ? children[0] : children.at(-1);
    return child ? findReferencePanelId(child, edge) : null;
};

const savedSize = (
    node: SerializedGridNode,
    orientation?: SerializedDockview['grid']['orientation'],
): Pick<SavedPanelPlacement, 'initialWidth' | 'initialHeight'> => {
    if (!orientation || typeof node.size !== 'number') return {};
    return orientation === Orientation.HORIZONTAL ? { initialWidth: node.size } : { initialHeight: node.size };
};

export const getSavedPanelPlacement = (layout: SerializedDockview, panelId: string): SavedPanelPlacement | null => {
    const match = findPanelLeaf(layout.grid.root, panelId, layout.grid.orientation);
    if (!match) return null;

    const index = match.group.views.indexOf(panelId);
    const remainingTabs = match.group.views.filter((view) => view !== panelId);

    if (remainingTabs.length > 0) {
        return {
            position: {
                referenceGroup: match.group.id,
                direction: 'within',
                index,
            },
        };
    }

    if (!match.parent) return null;

    const { children, childIndex, orientation } = match.parent;
    const nextReferencePanelId = children[childIndex + 1]
        ? findReferencePanelId(children[childIndex + 1], 'start')
        : null;

    if (nextReferencePanelId) {
        return {
            position: {
                referencePanel: nextReferencePanelId,
                direction: orientation === Orientation.HORIZONTAL ? 'left' : 'above',
            },
            ...savedSize(match.node, orientation),
        };
    }

    const previousReferencePanelId = children[childIndex - 1]
        ? findReferencePanelId(children[childIndex - 1], 'end')
        : null;

    if (previousReferencePanelId) {
        return {
            position: {
                referencePanel: previousReferencePanelId,
                direction: orientation === Orientation.HORIZONTAL ? 'right' : 'below',
            },
            ...savedSize(match.node, orientation),
        };
    }

    return null;
};

export const resolveSavedPanelPlacement = (
    placement: SavedPanelPlacement,
    api: DockviewApi,
): SavedPanelPlacement | null => {
    if ('referenceGroup' in placement.position) {
        return api.getGroup(String(placement.position.referenceGroup)) ? placement : null;
    }

    if ('referencePanel' in placement.position) {
        return api.getPanel(String(placement.position.referencePanel)) ? placement : null;
    }

    return placement;
};
const PRIMARY_PANELS = new Set([PANELS.circuit, PANELS.code]);

export const applyGroupType = (api: DockviewApi, id: string) => {
    const panel = api.getPanel(id);
    if (!panel) return;
    panel.group.element.dataset.groupType = PRIMARY_PANELS.has(id) ? 'primary' : 'secondary';
};
