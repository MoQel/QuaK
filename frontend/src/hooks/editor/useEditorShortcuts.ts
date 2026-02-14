import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { requestSave } from '@/store/slices/tabsSlice.ts';

export function useEditorShortcuts(activeFileId: string | null) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (activeFileId) {
                    dispatch(requestSave(activeFileId));
                }
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [activeFileId, dispatch]);
}
