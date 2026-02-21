import { useCallback } from 'react';
import { useDockview, PanelKey } from '@/contexts/DockviewContext';
import { DockviewReadyEvent } from 'dockview-react';

import { LAYOUT_STORAGE_KEY } from '@/lib/layout/layout-utils';

export const useDockviewLogic = () => {
    const { setApi, setOpenPanels, isResetting, resetLayout } = useDockview();

    const syncOpenPanelsFromApi = useCallback(
        (api: DockviewReadyEvent['api']) => {
            setOpenPanels(new Set(api.panels.map((p) => p.id as PanelKey)));
        },
        [setOpenPanels],
    );

    const onReady = useCallback(
        (event: DockviewReadyEvent) => {
            const api = event.api;
            setApi(api);

            api.onDidRemovePanel((e) => {
                if (isResetting()) return;
                setOpenPanels((prev) => {
                    const next = new Set(prev);
                    next.delete(e.id as PanelKey);
                    return next;
                });
            });

            const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
            let success = false;

            if (savedLayout) {
                try {
                    api.fromJSON(JSON.parse(savedLayout));
                    syncOpenPanelsFromApi(api);
                    success = true;
                } catch (err) {
                    console.error('Layout load error', err);
                    localStorage.removeItem(LAYOUT_STORAGE_KEY);
                }
            }

            if (!success) {
                resetLayout();
            }

            let debounceTimer: ReturnType<typeof setTimeout>;
            api.onDidLayoutChange(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (isResetting()) return;
                    try {
                        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(api.toJSON()));
                    } catch (e) {
                        console.warn('Layout save failed', e);
                    }
                }, 500);
            });
        },
        [resetLayout, setApi, setOpenPanels, syncOpenPanelsFromApi, isResetting],
    );

    return { onReady };
};
