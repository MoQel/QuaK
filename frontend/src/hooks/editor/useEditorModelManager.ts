// hooks/editor/useEditorModelManager.ts
import { useEffect, useRef, useState } from 'react';
import { editor, Uri } from 'monaco-editor';
import { toast } from 'sonner';
import { fetchFileContent } from '@/views/text-editor-view/util/fileService';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages';
import { getModelId, savedVersionIds } from '@/views/text-editor-view/util/editorUtils';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setFileDirty, Tab } from '@/store/slices/tabsSlice';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { Monaco } from '@monaco-editor/react';

export function useEditorModelManager(
    monaco: Monaco,
    editorInstance: editor.IStandaloneCodeEditor | null,
    activeFileId: string | null,
    openTabs: Tab[],
    setCurrentLangId: (id: string) => void,
) {
    const [isReadOnly, setIsReadOnly] = useState(true);
    const dispatch = useAppDispatch();
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);
    const isCurrentFileDirty = activeFileId ? dirtyFiles.includes(activeFileId) : false;
    const isDirtyRef = useRef(isCurrentFileDirty);

    const syncDirtyState = (model: editor.ITextModel, shouldDispatch = true) => {
        const saved = savedVersionIds.get(model);
        const isDirty = saved !== undefined && model.getAlternativeVersionId() !== saved;
        isDirtyRef.current = isDirty;

        if (shouldDispatch) {
            if (isDirty !== isCurrentFileDirty) {
                dispatch(setFileDirty({ fileId: getModelId(model), isDirty }));
            }
        }
    };

    useEffect(() => {
        isDirtyRef.current = isCurrentFileDirty;
    }, [isCurrentFileDirty]);

    // 1. Garbage Collection
    useEffect(() => {
        if (!monaco) return;
        const openTabIds = new Set(openTabs.map((t) => t.id));

        monaco.editor.getModels().forEach((model: editor.ITextModel) => {
            const modelId = getModelId(model);
            if (modelId !== activeFileId && !openTabIds.has(modelId)) {
                model.dispose();
            }
        });
    }, [openTabs, monaco, activeFileId]);

    useEffect(() => {
        if (!monaco || !editorInstance) return;

        if (!activeFileId) {
            editorInstance.setModel(null);
            setIsReadOnly(true);
            return;
        }

        const modelUri = Uri.file(activeFileId);
        let model = monaco.editor.getModel(modelUri);

        // Model with content exists (Hit)
        if (model && !model.isDisposed()) {
            editorInstance.setModel(model);
            syncDirtyState(model, false);
            setCurrentLangId(model.getLanguageId());
            setIsReadOnly(false);
            return;
        }

        // Fetch content (Miss)
        setIsReadOnly(true);
        let isCancelled = false;

        fetchFileContent(activeFileId)
            .then((data) => {
                if (isCancelled || !data || !editorInstance || !monaco) return;

                // Has someone else created it in the meantime?
                model = monaco.editor.getModel(modelUri);

                if (!model || model.isDisposed()) {
                    const langMatch = languages.find((l) => l.fileExtension === data.ext);
                    const langId = langMatch ? langMatch.id : DEFAULT_LANG;

                    model = monaco.editor.createModel(data.content, langId, modelUri);
                    savedVersionIds.set(model, model.getAlternativeVersionId());
                }

                editorInstance.setModel(model);
                setCurrentLangId(model.getLanguageId());
                syncDirtyState(model);
                setIsReadOnly(false);
            })
            .catch((err) => {
                console.error('Failed to load file', err);
                toast.error('File loading failed');
            });

        return () => {
            isCancelled = true;
        };
    }, [activeFileId, monaco, editorInstance]);

    return { isReadOnly, isDirtyRef };
}
