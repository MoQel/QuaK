import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { buildDefaultLayout, LAYOUT_STORAGE_KEY, getOptimalPosition, applyGroupType } from '@/lib/layout/layout-utils';
import type { DockviewApi } from 'dockview-react';

export type PanelKey = 'file' | 'circuit' | 'code' | 'results' | 'inspector' | 'library';

type DockviewContextType = {
    api: DockviewApi | null;
    setApi: (api: DockviewApi | null) => void;

    openPanels: Set<PanelKey>;
    syncOpenPanelsFromApi: (api: DockviewApi) => void;

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

//this is for the navbar because it appears all the time not only in the IDE
export const useDockviewOptional = () => {
    return useContext(DockviewContext);
};

export const DockviewProvider = ({ children }: { children: React.ReactNode }) => {
    const [api, _setApi] = useState<DockviewApi | null>(null);
    // Ensure group type is set
    const setApi = (newApi: DockviewApi | null) => {
        if (newApi) {
            newApi.onDidAddPanel((panel) => {
                requestAnimationFrame(() => applyGroupType(newApi, panel.id));
            });

            newApi.onDidMovePanel((_) => {
                requestAnimationFrame(() => {
                    for (const p of newApi.panels) {
                        applyGroupType(newApi, p.id);
                    }
                });
            });
        }
        _setApi(newApi);
    };

    const [openPanels, setOpenPanels] = useState<Set<PanelKey>>(new Set());
    const isResettingRef = useRef(false);

    const value = useMemo<DockviewContextType>(() => {
        const syncOpenPanelsFromApi = (apiInstance: DockviewApi) => {
            setOpenPanels(new Set(apiInstance.panels.map((p) => p.id as PanelKey)));
        };

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
            syncOpenPanelsFromApi(api);
            isResettingRef.current = false;
        };

        return {
            api,
            setApi,
            openPanels,
            syncOpenPanelsFromApi,
            openPanel,
            closePanel,
            togglePanel,
            resetLayout,
            isResetting: () => isResettingRef.current,
        };
    }, [api, openPanels]);

    return <DockviewContext.Provider value={value}>{children}</DockviewContext.Provider>;
};
