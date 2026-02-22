import { useCallback } from 'react';
import { useDockview } from '@/contexts/DockviewContext';
import { DockviewReadyEvent } from 'dockview-react';

import { LAYOUT_STORAGE_KEY, buildDefaultLayout } from '@/lib/layout/layout-utils';

export const useDockviewLogic = () => {
    const { setApi, isResetting, resetLayout, syncOpenPanelsFromApi } = useDockview();

    const onReady = useCallback(
        (event: DockviewReadyEvent) => {
            const api = event.api;
            setApi(api);

            api.onDidRemovePanel(() => {
                if (isResetting()) return;
                syncOpenPanelsFromApi(api);
            });

            const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);

            if (savedLayout) {
                try {
                    api.fromJSON(JSON.parse(savedLayout));
                    syncOpenPanelsFromApi(api);
                } catch (err) {
                    console.error('Layout load error', err);
                    localStorage.removeItem(LAYOUT_STORAGE_KEY);

                    // fallback to default
                    buildDefaultLayout(api);
                    syncOpenPanelsFromApi(api);
                }
            } else {
                // first-time load (no browser data)
                buildDefaultLayout(api);
                syncOpenPanelsFromApi(api);
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
        [resetLayout, setApi, isResetting, syncOpenPanelsFromApi],
    );

    return { onReady };
};
