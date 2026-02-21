import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { buildDefaultLayout, LAYOUT_STORAGE_KEY } from '@/lib/layout/layout-utils';
import type { DockviewApi } from 'dockview-react';
import { getOptimalPosition } from '@/lib/layout/layout-utils';

export type PanelKey = 'file' | 'circuit' | 'code' | 'results' | 'inspector' | 'library';

type DockviewContextType = {
    api: DockviewApi | null;
    setApi: (api: DockviewApi | null) => void;

    openPanels: Set<PanelKey>;
    setOpenPanels: React.Dispatch<React.SetStateAction<Set<PanelKey>>>;

    openPanel: (id: PanelKey) => void;
    closePanel: (id: PanelKey) => void;
    togglePanel: (id: PanelKey) => void;
    resetLayout: () => void;
    isResetting: () => boolean;
};

const DockviewContext = createContext<DockviewContextType | null>(null);

export const useDockview = () => {
    const ctx = useContext(DockviewContext);
    if (!ctx) throw new Error('useDockview must be used within DockviewProvider');
    return ctx;
};
export const useDockviewOptional = () => {
    return useContext(DockviewContext);
};

export const DockviewProvider = ({ children }: { children: React.ReactNode }) => {
    const [api, setApi] = useState<DockviewApi | null>(null);
    const [openPanels, setOpenPanels] = useState<Set<PanelKey>>(new Set());
    const isResettingRef = useRef(false);

    const value = useMemo<DockviewContextType>(() => {
        const openPanel = (id: PanelKey) => {
            if (!api) return;
            if (api.getPanel(id)) return;

            let position = getOptimalPosition(id, api);

            if (!position && api.panels.length > 0) {
                position = { referencePanel: api.panels[0], direction: 'right' };
            }

            api.addPanel({
                id,
                component: id,
                title: id.charAt(0).toUpperCase() + id.slice(1),
                position: position || undefined,
            });

            setOpenPanels((prev) => new Set(prev).add(id));
        };

        const closePanel = (id: PanelKey) => {
            if (!api) return;
            const panel = api.getPanel(id);
            if (!panel) return;
            api.removePanel(panel);
            setOpenPanels((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        };

        const togglePanel = (id: PanelKey) => {
            if (!api) return;
            if (api.getPanel(id)) closePanel(id);
            else openPanel(id);
        };

        const resetLayout = () => {
            if (!api) return;
            isResettingRef.current = true;
            api.clear();
            localStorage.removeItem(LAYOUT_STORAGE_KEY);
            buildDefaultLayout(api);
            setOpenPanels(new Set(api.panels.map((p) => p.id as PanelKey)));
            isResettingRef.current = false;
        };

        return {
            api,
            setApi,
            openPanels,
            setOpenPanels,
            openPanel,
            closePanel,
            togglePanel,
            resetLayout,
            isResetting: () => isResettingRef.current,
        };
    }, [api, openPanels]);

    return <DockviewContext.Provider value={value}>{children}</DockviewContext.Provider>;
};
