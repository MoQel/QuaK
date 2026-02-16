import { useRef, useEffect, useCallback } from 'react';
import { DockviewApi, DockviewReadyEvent } from 'dockview-react';

import { useLayout, PanelKey } from '@/hooks/use-layout'; // Your Redux hook
import { LAYOUT_STORAGE_KEY, buildDefaultLayout, getOptimalPosition } from '@/lib/layout/layout-utils';

export const useDockviewLogic = () => {
    const { visiblePanels, onTogglePanel, layoutResetVersion } = useLayout();

    const apiRef = useRef<DockviewApi | null>(null);
    const isResettingRef = useRef(false);
    const lastResetVersionRef = useRef(layoutResetVersion);

    // Keep refs synced for event listeners to avoid stale closures
    const visiblePanelsRef = useRef(visiblePanels);
    const onTogglePanelRef = useRef(onTogglePanel);

    useEffect(() => {
        visiblePanelsRef.current = visiblePanels;
    }, [visiblePanels]);
    useEffect(() => {
        onTogglePanelRef.current = onTogglePanel;
    }, [onTogglePanel]);

    // --- 1. The Safe Reset Function (with the 50ms fix) ---
    const handleReset = useCallback((api: DockviewApi) => {
        isResettingRef.current = true;
        api.clear();
        localStorage.removeItem(LAYOUT_STORAGE_KEY);

        setTimeout(() => {
            if (!api) return;
            buildDefaultLayout(api);
            setTimeout(() => {
                isResettingRef.current = false;
            }, 100);
        }, 50);
    }, []);

    // --- 2. Effect: Handle Redux Reset Command ---
    useEffect(() => {
        if (layoutResetVersion > lastResetVersionRef.current) {
            if (apiRef.current) {
                handleReset(apiRef.current);
            }
            lastResetVersionRef.current = layoutResetVersion;
        }
    }, [layoutResetVersion, handleReset]);

    // --- 3. Effect: Sync Redux Visibility -> Dockview ---
    useEffect(() => {
        const api = apiRef.current;
        // Guard: Don't mess with panels if we are in the middle of a reset
        if (!api || isResettingRef.current || layoutResetVersion > lastResetVersionRef.current) return;

        (Object.keys(visiblePanels) as PanelKey[]).forEach((key) => {
            const shouldBeVisible = visiblePanels[key];
            const panel = api.getPanel(key);

            if (shouldBeVisible && !panel) {
                let position = getOptimalPosition(key, api);

                // Fallback if grid is empty
                if (!position && api.panels.length > 0) {
                    position = { referencePanel: api.panels[0], direction: 'right' };
                }

                api.addPanel({
                    id: key,
                    component: key,
                    title: key.charAt(0).toUpperCase() + key.slice(1),
                    position: position || undefined,
                });
            } else if (!shouldBeVisible && panel) {
                api.removePanel(panel);
            }
        });
    }, [visiblePanels, layoutResetVersion]);

    // --- 4. The onReady Handler ---
    const onReady = useCallback(
        (event: DockviewReadyEvent) => {
            const api = event.api;
            apiRef.current = api;

            // A. Attach Close Listener (updates Redux when user closes X)
            api.onDidRemovePanel((e) => {
                if (isResettingRef.current) return;
                const id = e.id as PanelKey;
                if (visiblePanelsRef.current[id]) {
                    onTogglePanelRef.current(id);
                }
            });

            // B. Load Layout (Storage -> Default)
            const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
            let success = false;

            if (savedLayout) {
                try {
                    isResettingRef.current = true;
                    api.fromJSON(JSON.parse(savedLayout));
                    success = true;
                    setTimeout(() => {
                        isResettingRef.current = false;
                    }, 200);
                } catch (err) {
                    console.error('Layout load error', err);
                    localStorage.removeItem(LAYOUT_STORAGE_KEY);
                    isResettingRef.current = false;
                }
            }

            if (!success) {
                // Use the utility to build default
                handleReset(api);
            }

            // C. Auto-save Listener
            let debounceTimer: ReturnType<typeof setTimeout>;
            api.onDidLayoutChange(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (isResettingRef.current) return;
                    try {
                        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(api.toJSON()));
                    } catch (e) {
                        console.warn('Layout save failed', e);
                    }
                }, 500);
            });
        },
        [handleReset],
    );

    return { onReady };
};
