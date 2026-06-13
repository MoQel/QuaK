// Garbage Collection
import { useEffect, useRef } from 'react';
import { getModelId, savedVersionIds } from '@/views/text-editor-view/utils/editorUtils.ts';
import { useMonaco } from '@monaco-editor/react';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { closeAll } from '@/store/tabs/tabsSlice.ts';
import { editor } from 'monaco-editor';

export function useMonacoGarbageCollector() {
    const monaco = useMonaco();
    const groups = useAppSelector((state) => state.tabs.groups);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!monaco) return;

        const allOpenFiles = new Set<string>();
        groups.forEach((g) => g.openTabs.forEach((t) => allOpenFiles.add(t.id)));
        monaco.editor.getModels().forEach((model: editor.ITextModel) => {
            if (model.uri.scheme !== 'file') return;
            const modelId = getModelId(model);
            if (!allOpenFiles.has(modelId)) {
                savedVersionIds.delete(model);
                model.dispose();
            }
        });
    }, [groups, monaco]);

    // Keep the latest monaco instance in a ref so the unmount cleanup can dispose models
    // without depending on `monaco`. Depending on it would make this cleanup fire whenever
    // monaco changes (notably null -> instance right after load), which would dispatch
    // closeAll() mid-session and wipe tabs that were just restored.
    const monacoRef = useRef(monaco);
    monacoRef.current = monaco;

    useEffect(() => {
        return () => {
            // Runs only on unmount (leaving the IDE): reset tab state and dispose models.
            dispatch(closeAll());

            // Hard dispose all models to prevent memory leaks in global Monaco instance
            monacoRef.current?.editor.getModels().forEach((model) => {
                savedVersionIds.delete(model);
                model.dispose();
            });
        };
    }, [dispatch]);
}
