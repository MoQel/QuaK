import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
    buildDefaultLayout,
    LAYOUT_STORAGE_KEY,
    applyDefaultRowSizes,
    applyGroupType,
    PANEL_TITLES,
    PANELS,
    getSavedPanelPlacement,
    restorePlacement,
    type PanelPlacement,
} from '@/lib/layout/layout-utils';
import type { DockviewApi } from 'dockview-react';
type PanelKey = keyof typeof PANELS;

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
    const savedPanelPlacementsRef = useRef<Map<PanelKey, PanelPlacement>>(new Map());
    const isResettingRef = useRef(false);

    const value = useMemo<DockviewContextType>(() => {
        const syncOpenPanelsFromApi = (apiInstance: DockviewApi) => {
            setOpenPanels(new Set(apiInstance.panels.map((p) => p.id as PanelKey)));
        };

        const openPanel = (id: PanelKey) => {
            if (!api) return;
            if (api.getPanel(id)) return;

            api.addPanel({
                id,
                component: id,
                title: PANEL_TITLES[id],
                ...restorePlacement(id, api, savedPanelPlacementsRef.current.get(id)),
            });
            applyDefaultRowSizes(api, id);

            setOpenPanels((prev) => new Set(prev).add(id));
        };

        const closePanel = (id: PanelKey) => {
            if (!api) return;
            const panel = api.getPanel(id);
            if (!panel) return;
            const placement = getSavedPanelPlacement(api.toJSON(), id);
            if (placement) savedPanelPlacementsRef.current.set(id, placement);
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
            savedPanelPlacementsRef.current.clear();
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
