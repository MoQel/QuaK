import { Card, CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/QLPEditor.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TabBar } from '@/views/text-editor-view/TabBar.tsx';
import { useEffect, useState } from 'react';
import { DEFAULT_LANG } from '@/views/text-editor-view/languages/languages.ts';
import { closeAll, requestSave } from '@/store/slices/tabsSlice.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

export function TextEditorView() {
    const activeFileId = useAppSelector((state) => state.tabs.activeTabId);
    const [currentLangId, setCurrentLangId] = useState(DEFAULT_LANG);
    const dispatch = useAppDispatch();

    // Cleanup close all tabs
    useEffect(() => {
        return () => {
            dispatch(closeAll());
        };
    }, [dispatch]);

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

    return (
        <Card className="h-full flex flex-col p-0 border-none rounded-none">
            <TabBar currentLangId={currentLangId} />

            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                <QLPEditor activeFileId={activeFileId} setCurrentLangId={setCurrentLangId} />
            </CardContent>
        </Card>
    );
}
