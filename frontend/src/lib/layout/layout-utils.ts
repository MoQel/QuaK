import type { AddPanelPositionOptions, DockviewApi, SerializedDockview } from 'dockview-react';

export const LAYOUT_STORAGE_KEY = 'ide-dockview-layout-v2';

export const PANELS = {
    circuit: 'circuit',
    code: 'code',
    file: 'file',
    inspector: 'inspector',
    results: 'results',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

export const getDefaultSizes = (api: Pick<DockviewApi, 'width' | 'height'>) => ({
    left: clamp(api.width * 0.15, 180, 320),
    right: clamp(api.width * 0.3, 360, 600),
    bottom: clamp(api.height * 0.32, 240, 420),
});

/**
 * The default arrangement as rows of panels. Reopening a panel restores it into *this* shape rather
 * than next to whatever happens to be open, so toggling panels can never reshuffle the grid.
 * Keep in sync with `buildDefaultLayout` below.
 */
export const DEFAULT_GRID: string[][] = [
    [PANELS.file, PANELS.circuit, PANELS.code],
    [PANELS.inspector, PANELS.results],
];

/** The sizes `buildDefaultLayout` hands out, reused when a panel is reopened. */
const getPanelWidths = (api: DockviewApi): Record<string, number> => {
    const { left, right } = getDefaultSizes(api);
    const half = Math.round(api.width / 2);
    return { [PANELS.file]: left, [PANELS.code]: right, [PANELS.inspector]: half, [PANELS.results]: half };
};

/** Where a panel sits in the default arrangement, or null for one that is not part of it. */
const gridPosition = (panelId: string): { row: number; column: number } | null => {
    for (const [row, panels] of DEFAULT_GRID.entries()) {
        const column = panels.indexOf(panelId);
        if (column >= 0) return { row, column };
    }
    return null;
};

/**
 * Where a reopened panel belongs, derived from the default arrangement: it rejoins its own row next
 * to the nearest neighbour still open there.
 */
export const getDefaultPlacement = (panelId: string, api: DockviewApi): PanelPlacement | null => {
    const home = gridPosition(panelId);
    if (!home) return null;

    const isOpen = (id: string) => !!api.getPanel(id);
    const row = DEFAULT_GRID[home.row];
    const width = getPanelWidths(api)[panelId];
    const size = width ? { initialWidth: width } : {};

    const nextInRow = row.slice(home.column + 1).find(isOpen);
    if (nextInRow) return { position: { referencePanel: nextInRow, direction: 'left' }, ...size };

    const previousInRow = row.slice(0, home.column).reverse().find(isOpen);
    if (previousInRow) return { position: { referencePanel: previousInRow, direction: 'right' }, ...size };

    // Its whole row is closed, so the row itself has to come back. That is an absolute position:
    // naming a reference panel would split *that panel's cell* instead of adding a row, which is
    // exactly how a reopened panel used to end up stacked inside a neighbour's column.
    const rowHeight = home.row === DEFAULT_GRID.length - 1 ? { initialHeight: getDefaultSizes(api).bottom } : {};

    if (DEFAULT_GRID.slice(0, home.row).flat().some(isOpen)) {
        return { position: { direction: 'below' }, ...rowHeight };
    }
    if (
        DEFAULT_GRID.slice(home.row + 1)
            .flat()
            .some(isOpen)
    ) {
        return { position: { direction: 'above' }, ...rowHeight };
    }

    // Nothing is open at all: the panel becomes the first one and needs no position.
    return null;
};

/**
 * Builds the firm, predefined layout programmatically.
 */
export const buildDefaultLayout = (api: DockviewApi) => {
    api.clear();
    const sizes = getDefaultSizes(api);

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
        initialHeight: sizes.bottom,
    });

    // 3. Fill top row (left / right of circuit)
    api.addPanel({
        id: PANELS.file,
        component: PANELS.file,
        title: 'Project',
        position: { referencePanel: circuit, direction: 'left' },
        initialWidth: sizes.left,
    });

    api.addPanel({
        id: PANELS.code,
        component: PANELS.code,
        title: 'Code Editor',
        position: { referencePanel: circuit, direction: 'right' },
        initialWidth: sizes.right,
    });

    // 4. Fill bottom row (right of inspector)
    api.addPanel({
        id: PANELS.results,
        component: PANELS.results,
        title: 'Results',
        position: { referencePanel: inspector, direction: 'right' },
        initialWidth: Math.round(api.width / 2),
    });
};

export const PANEL_TITLES: Record<string, string> = {
    circuit: 'Circuit',
    code: 'Code Editor',
    file: 'Project',
    inspector: 'Inspector',
    results: 'Results',
};

type SerializedGridNode = SerializedDockview['grid']['root'];

type SerializedDockviewGroup = {
    id: string;
    views: string[];
    activeView?: string;
};

export type PanelPlacement = {
    position?: AddPanelPositionOptions;
    initialWidth?: number;
    initialHeight?: number;
};

/** The serialized group a panel sits in, or null when the layout does not hold it. */
const findGroupContaining = (node: SerializedGridNode, panelId: string): SerializedDockviewGroup | null => {
    if (node.type === 'leaf') {
        const group = node.data as SerializedDockviewGroup;
        return group.views.includes(panelId) ? group : null;
    }

    for (const child of node.data as SerializedGridNode[]) {
        const group = findGroupContaining(child, panelId);
        if (group) return group;
    }

    return null;
};

/**
 * What is worth remembering about a closed panel: only the tab group it shared with others. Neither
 * its grid position nor its size is, because both only describe what happened to be true at the
 * moment of closing — restoring them once the neighbours are back puts the panel in the wrong column
 * at the wrong width. Both come from the default arrangement instead.
 */
export const getSavedPanelPlacement = (layout: SerializedDockview, panelId: string): PanelPlacement | null => {
    const group = findGroupContaining(layout.grid.root, panelId);
    if (!group) return null;

    // A panel that had its group to itself leaves nothing worth restoring: its place in the grid is
    // decided by the default arrangement when it comes back.
    const sharesTabGroup = group.views.some((view) => view !== panelId);
    if (!sharesTabGroup) return null;

    return { position: { referenceGroup: group.id, direction: 'within', index: group.views.indexOf(panelId) } };
};

export const resolveSavedPanelPlacement = (placement: PanelPlacement, api: DockviewApi): PanelPlacement | null => {
    if (!placement.position) return placement;

    if ('referenceGroup' in placement.position) {
        const { referenceGroup } = placement.position;
        const groupId = typeof referenceGroup === 'string' ? referenceGroup : referenceGroup.id;
        return api.getGroup(groupId) ? placement : null;
    }

    return placement;
};

/**
 * Where a reopened panel goes: back into its tab group while that still exists, otherwise into its
 * home in the default arrangement.
 */
export const restorePlacement = (
    panelId: string,
    api: DockviewApi,
    saved: PanelPlacement | undefined,
): PanelPlacement => {
    const tabGroup = saved ? resolveSavedPanelPlacement(saved, api) : null;
    if (tabGroup?.position) return { position: tabGroup.position };

    return getDefaultPlacement(panelId, api) ?? {};
};

/**
 * Puts a row back to its default column widths. Dockview spreads a closed panel's space across its
 * neighbours and does not hand it back when the panel returns, so without this the two rows end up
 * with their splitters in different places.
 */
export const applyDefaultRowSizes = (api: DockviewApi, panelId: string) => {
    const home = gridPosition(panelId);
    if (!home) return;

    const row = DEFAULT_GRID[home.row];
    const groupOf = (id: string) => api.getPanel(id)?.group;
    const widths = getPanelWidths(api);

    for (const id of row) {
        const width = widths[id];
        const group = groupOf(id);
        if (width && group) group.api.setSize({ width });
    }

    // A row rebuilt from scratch splits the canvas evenly with the other one, so the bottom row is
    // put back to the strip the default layout gives it.
    if (home.row === DEFAULT_GRID.length - 1) {
        const anyGroupInRow = row.map(groupOf).find(Boolean);
        anyGroupInRow?.api.setSize({ height: getDefaultSizes(api).bottom });
    }
};

const PRIMARY_PANELS = new Set([PANELS.circuit, PANELS.code]);

export const applyGroupType = (api: DockviewApi, id: string) => {
    const panel = api.getPanel(id);
    if (!panel) return;
    panel.group.element.dataset.groupType = PRIMARY_PANELS.has(id) ? 'primary' : 'secondary';
};
