import { describe, expect, it } from 'vitest';
import { Orientation, type DockviewApi, type SerializedDockview } from 'dockview-react';

import {
    getDefaultPlacement,
    getSavedPanelPlacement,
    resolveSavedPanelPlacement,
    restorePlacement,
} from './layout-utils.ts';

const layout = (root: SerializedDockview['grid']['root']): SerializedDockview =>
    ({
        grid: {
            root,
            width: 1200,
            height: 800,
            orientation: Orientation.HORIZONTAL,
        },
        panels: {},
    }) as SerializedDockview;

const leaf = (id: string, views: string[], size = 400): SerializedDockview['grid']['root'] =>
    ({
        type: 'leaf',
        size,
        data: {
            id,
            views,
            activeView: views[0],
        },
    }) as SerializedDockview['grid']['root'];

const branch = (children: SerializedDockview['grid']['root'][]): SerializedDockview['grid']['root'] =>
    ({
        type: 'branch',
        size: 900,
        data: children,
    }) as SerializedDockview['grid']['root'];

describe('layout-utils panel placement', () => {
    it('restores a panel inside its previous tab group when possible', () => {
        const placement = getSavedPanelPlacement(layout(leaf('bottom-group', ['inspector', 'results'])), 'results');

        expect(placement).toEqual({
            position: {
                referenceGroup: 'bottom-group',
                direction: 'within',
                index: 1,
            },
        });
    });

    it('remembers nothing about a panel that had its group to itself', () => {
        // Its neighbour and its width only describe the moment of closing: restoring either puts the
        // panel in the wrong column at the wrong size once the other panels are back.
        const placement = getSavedPanelPlacement(
            layout(branch([leaf('left-group', ['file'], 350), leaf('right-group', ['circuit'])])),
            'file',
        );

        expect(placement).toBeNull();
    });

    it('drops saved placement when the reference no longer exists', () => {
        const placement = getSavedPanelPlacement(layout(leaf('bottom-group', ['inspector', 'results'])), 'results');
        const api = {
            getGroup: () => undefined,
        } as unknown as DockviewApi;

        expect(placement && resolveSavedPanelPlacement(placement, api)).toBeNull();
    });
});

/** A DockviewApi that only knows which panels are currently open. */
const apiWithOpen = (...openIds: string[]): DockviewApi =>
    ({
        getPanel: (id: string) => (openIds.includes(id) ? { id } : undefined),
    }) as unknown as DockviewApi;

describe('layout-utils default placement', () => {
    it('puts a panel left of the nearest open neighbour to its right', () => {
        // file sits left of circuit and code in the default top row.
        expect(getDefaultPlacement('file', apiWithOpen('code'))).toEqual({
            position: { referencePanel: 'code', direction: 'left' },
            initialWidth: 400,
        });
    });

    it('falls back to the nearest open neighbour on its left', () => {
        expect(getDefaultPlacement('results', apiWithOpen('inspector'))).toEqual({
            position: { referencePanel: 'inspector', direction: 'right' },
            initialWidth: 520,
        });
    });

    it('recreates a fully closed row as a row of the grid, not inside a neighbour', () => {
        // Nothing from the bottom row is open, so naming a top-row panel would split its cell.
        expect(getDefaultPlacement('inspector', apiWithOpen('file', 'circuit', 'code'))).toEqual({
            position: { direction: 'below' },
            initialHeight: 350,
        });
    });

    it('adds a closed top row above the bottom one', () => {
        expect(getDefaultPlacement('circuit', apiWithOpen('inspector', 'results'))).toEqual({
            position: { direction: 'above' },
        });
    });

    it('gives the first panel no position at all', () => {
        expect(getDefaultPlacement('circuit', apiWithOpen())).toBeNull();
    });

    it('never remembers a neighbour from the other row', () => {
        // The bottom row is down to `results`, whose only sibling is the whole top row. Remembering
        // "below code" would split the code cell once the bottom row came back.
        const placement = getSavedPanelPlacement(
            layout(branch([leaf('top', ['file', 'circuit', 'code']), leaf('bottom', ['results'], 350)])),
            'results',
        );

        expect(placement).toBeNull();
    });
});

describe('layout-utils restorePlacement', () => {
    it('uses the default home when nothing was remembered', () => {
        expect(restorePlacement('file', apiWithOpen('circuit'), undefined)).toEqual({
            position: { referencePanel: 'circuit', direction: 'left' },
            initialWidth: 400,
        });
    });

    it('restores a remembered tab group that still exists', () => {
        const api = {
            getPanel: (id: string) => (id === 'circuit' ? { id } : undefined),
            getGroup: () => ({ id: 'bottom-group' }),
        } as unknown as DockviewApi;
        const saved = { position: { referenceGroup: 'bottom-group', direction: 'within' as const, index: 1 } };

        expect(restorePlacement('results', api, saved)).toEqual({ position: saved.position });
    });

    it('ignores a remembered tab group whose group is gone', () => {
        const api = {
            getPanel: (id: string) => (id === 'circuit' ? { id } : undefined),
            getGroup: () => undefined,
        } as unknown as DockviewApi;
        const saved = { position: { referenceGroup: 'old-group', direction: 'within' as const, index: 1 } };

        expect(restorePlacement('file', api, saved)).toEqual({
            position: { referencePanel: 'circuit', direction: 'left' },
            initialWidth: 400,
        });
    });
});
