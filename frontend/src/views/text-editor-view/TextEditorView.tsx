import { Card, CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/QLPEditor.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TextEditorTabBar } from '@/views/text-editor-view/TextEditorTabBar.tsx';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LANG } from '@/views/text-editor-view/languages/languages.ts';
import { closeAll } from '@/store/slices/tabsSlice.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useEditorShortcuts } from '@/hooks/editor/useEditorShortcuts.ts';

export function TextEditorView() {
    const activeFileId = useAppSelector((state) => state.tabs.activeTabId);
    const [currentLangId, setCurrentLangId] = useState(DEFAULT_LANG);
    const dispatch = useAppDispatch();
    useEditorShortcuts(activeFileId);

    // Cleanup close all tabs
    useEffect(() => {
        return () => {
            dispatch(closeAll());
        };
    }, [dispatch]);

    const handleLanguageChange = useCallback((langId: string) => {
        setCurrentLangId(langId);
    }, []);

    return (
        <Card className="h-full flex flex-col p-0 border-none rounded-none">
            <TextEditorTabBar currentLangId={currentLangId} />

            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                <QLPEditor activeFileId={activeFileId} setCurrentLangId={handleLanguageChange} />
            </CardContent>
        </Card>
    );
}
