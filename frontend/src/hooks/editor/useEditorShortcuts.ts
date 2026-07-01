import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { requestSave } from '@/store/tabs/tabsSlice.ts';
import { safeCloseTab } from '@/store/tabs/tabsThunks.ts';

export function useEditorShortcuts(activeFileId: string | null, activeGroupId: string, isReadOnly = false) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                // Read-only tabs (e.g. the formal editor) have nothing to save.
                if (activeFileId && !isReadOnly) {
                    dispatch(requestSave(activeFileId));
                }
            }

            // macOS has this symbol on option + w: ∑
            // therefore we must also accept KeyW
            if (e.altKey && (e.key.toLowerCase() === 'w' || e.code === 'KeyW')) {
                e.preventDefault();
                if (activeFileId) {
                    dispatch(safeCloseTab({ tabId: activeFileId, groupId: activeGroupId }));
                }
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [activeFileId, activeGroupId, isReadOnly, dispatch]);
}
