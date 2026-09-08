import { describe, expect, it } from 'vitest';
import { Orientation, type DockviewApi, type SerializedDockview } from 'dockview-react';

import { getSavedPanelPlacement, resolveSavedPanelPlacement } from './layout-utils.ts';

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
        const placement = getSavedPanelPlacement(layout(leaf('left-group', ['file', 'library'])), 'library');

        expect(placement).toEqual({
            position: {
                referenceGroup: 'left-group',
                direction: 'within',
                index: 1,
            },
        });
    });

    it('restores a single-panel group next to its previous sibling', () => {
        const placement = getSavedPanelPlacement(
            layout(branch([leaf('left-group', ['file'], 350), leaf('right-group', ['circuit'])])),
            'file',
        );

        expect(placement).toEqual({
            position: {
                referencePanel: 'circuit',
                direction: 'left',
            },
            initialWidth: 350,
        });
    });

    it('drops saved placement when the reference no longer exists', () => {
        const placement = getSavedPanelPlacement(layout(leaf('left-group', ['file', 'library'])), 'library');
        const api = {
            getGroup: () => undefined,
        } as unknown as DockviewApi;

        expect(placement && resolveSavedPanelPlacement(placement, api)).toBeNull();
    });
});
