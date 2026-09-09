import { useEffect, useRef } from 'react';
import { api } from '@/api/api.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { restoreTabs } from '@/store/tabs/tabsSlice.ts';
import { EditorGroup, Tab } from '@/store/tabs/tabsTypes.ts';

interface EditorStateResponse {
    projectId: string;
    tabsJson: string | null;
}

interface PersistedTabs {
    groups: EditorGroup[];
    activeGroupId: string;
}

const isTab = (value: unknown): value is Tab => {
    if (!value || typeof value !== 'object') return false;
    const tab = value as Tab;
    return typeof tab.id === 'string' && typeof tab.title === 'string' && typeof tab.language === 'string';
};

const isEditorGroup = (value: unknown): value is EditorGroup => {
    if (!value || typeof value !== 'object') return false;
    const group = value as EditorGroup;
    return (
        typeof group.id === 'string' &&
        (group.activeTabId === null || typeof group.activeTabId === 'string') &&
        Array.isArray(group.openTabs) &&
        group.openTabs.every(isTab)
    );
};

const isPersistedTabs = (value: unknown): value is PersistedTabs => {
    if (!value || typeof value !== 'object') return false;
    const persisted = value as PersistedTabs;
    return (
        typeof persisted.activeGroupId === 'string' &&
        Array.isArray(persisted.groups) &&
        persisted.groups.every(isEditorGroup)
    );
};

const parsePersistedTabs = (tabsJson: string | null): PersistedTabs | null => {
    if (!tabsJson) return null;

    try {
        const parsed: unknown = JSON.parse(tabsJson);
        if (isPersistedTabs(parsed)) return parsed;
    } catch (error) {
        console.warn('Failed to parse persisted editor state', error);
    }
    return null;
};

const writeEditorState = (projectId: string, tabs: PersistedTabs) => {
    api.put(`/api/editor-state/${projectId}`, { tabsJson: JSON.stringify(tabs) }).catch((error) =>
        console.warn('Failed to persist editor state', error),
    );
};

/**
 * Persists the open editor/circuit tabs per project and user in the backend and
 * restores them when the project is opened again. The actual contents are not
 * part of the editor state: code files are fetched from the backend and circuit
 * tabs load their circuit from the database (single source of truth).
 */
export function useTabsPersistence(projectId: string | null) {
    const dispatch = useAppDispatch();
    const groups = useAppSelector((state) => state.tabs.groups);
    const activeGroupId = useAppSelector((state) => state.tabs.activeGroupId);

    // Tracks for which project the restore already ran, so saves never
    // overwrite a project's editor state before its tabs were restored.
    const restoredProjectRef = useRef<string | null>(null);
    const latestStateRef = useRef<PersistedTabs>({ groups, activeGroupId });
    latestStateRef.current = { groups, activeGroupId };

    // Restore tabs when entering a project.
    useEffect(() => {
        restoredProjectRef.current = null;
        if (!projectId) return;

        let cancelled = false;
        api.get<EditorStateResponse>(`/api/editor-state/${projectId}`)
            .then((state) => {
                if (cancelled) return;

                // If the user already opened a tab while this request was in flight, don't clobber it
                // with the restored set — otherwise the just-opened tab (and its circuit) would vanish.
                const userAlreadyOpenedTabs = latestStateRef.current.groups.some((group) => group.openTabs.length > 0);
                if (!userAlreadyOpenedTabs) {
                    const persisted = parsePersistedTabs(state.tabsJson);
                    // Restoring an empty state also clears leftover tabs from a previously opened project.
                    dispatch(restoreTabs(persisted ?? { groups: [], activeGroupId: '' }));
                }
                restoredProjectRef.current = projectId;
            })
            .catch((error) => console.error('Failed to load editor state', error));

        return () => {
            cancelled = true;
        };
    }, [projectId, dispatch]);

    // Save tab changes (debounced).
    useEffect(() => {
        if (!projectId || restoredProjectRef.current !== projectId) return;

        const timer = setTimeout(() => writeEditorState(projectId, { groups, activeGroupId }), 800);
        return () => clearTimeout(timer);
    }, [projectId, groups, activeGroupId]);

    // Flush the last rendered state when leaving the project. The editor cleanup
    // resets the store on unmount, but that reset never re-renders this hook, so
    // the ref still holds the tabs as they were while the project was open.
    useEffect(() => {
        if (!projectId) return;

        return () => {
            if (restoredProjectRef.current !== projectId) return;
            writeEditorState(projectId, latestStateRef.current);
        };
    }, [projectId]);
}
