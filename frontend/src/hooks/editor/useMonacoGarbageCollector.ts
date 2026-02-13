// Garbage Collection
import { useEffect } from 'react';
import { getModelId, savedVersionIds } from '@/views/text-editor-view/util/editorUtils.ts';
import { useMonaco } from '@monaco-editor/react';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { closeAll } from '@/store/slices/tabsSlice.ts';
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

    useEffect(() => {
        return () => {
            // Reset Redux state
            dispatch(closeAll());

            // Hard dispose all models to prevent memory leaks in global Monaco instance
            if (monaco) {
                monaco.editor.getModels().forEach((model) => {
                    savedVersionIds.delete(model);
                    model.dispose();
                });
            }
        };
    }, [dispatch, monaco]);
}
