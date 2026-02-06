import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { requestSave } from '@/store/slices/tabsSlice';

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

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeFileId, dispatch]);
}
