import { useEffect, useRef, useState } from 'react';
import { editor, Uri } from 'monaco-editor';
import { toast } from 'sonner';
import { fetchFileContent } from '@/views/text-editor-view/utils/fileService';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages';
import { getModelId, savedVersionIds } from '@/views/text-editor-view/utils/editorUtils';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setFileDirty } from '@/store/tabs/tabsSlice.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { Monaco } from '@monaco-editor/react';
import { lspManager } from '@/lsp/LSPClientManager';

export function useEditorModelManager(
    monaco: Monaco,
    editorInstance: editor.IStandaloneCodeEditor | null,
    groupId: string,
) {
    const [isReadOnly, setIsReadOnly] = useState(true);
    const dispatch = useAppDispatch();
    const groups = useAppSelector((state) => state.tabs.groups);
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);
    const activeFileId = useAppSelector(
        (state) => state.tabs.groups.find((g) => g.id === groupId)?.activeTabId ?? null,
    );
    const activeTab =
        useAppSelector((state) =>
            state.tabs.groups.find((g) => g.id === groupId)?.openTabs.find((t) => t.id === activeFileId),
        ) ?? null;
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

    const getTechnicalId = (logicalId: string) => {
        const langConfig = languages.find((l) => l.id === logicalId);
        return langConfig ? langConfig.languageId : logicalId;
    };

    useEffect(() => {
        isDirtyRef.current = isCurrentFileDirty;
    }, [isCurrentFileDirty]);

    useEffect(() => {
        if (!monaco || !editorInstance) return;

        if (!activeFileId) {
            editorInstance.setModel(null);
            setIsReadOnly(true);
            return;
        }

        let activeModel: editor.ITextModel | null = null;
        let isCancelled = false;
        const fileName = activeTab?.title || 'untitled.txt';
        const modelUri = Uri.file(`${activeFileId}/${fileName}`);
        const findModel = () =>
            monaco.editor.getModel(modelUri) ??
            monaco.editor.getModels().find((candidate: editor.ITextModel) => getModelId(candidate) === activeFileId) ??
            null;
        let model = findModel();

        const showModel = (nextModel: editor.ITextModel, shouldDispatchDirtyState: boolean) => {
            if (isCancelled || nextModel.isDisposed()) return;

            activeModel = nextModel;
            editorInstance.setModel(nextModel);
            syncDirtyState(nextModel, shouldDispatchDirtyState);
            setIsReadOnly(false);
            lspManager.onDocumentOpen(groupId, nextModel);
        };

        if (model && !model.isDisposed()) {
            showModel(model, false);
        } else {
            // Prevent re-fetching if the tab was just closed but the effect runs once more with the old id.
            const isStillInTabs = groups.find((g) => g.id === groupId)?.openTabs.some((t) => t.id === activeFileId);
            if (!isStillInTabs) return;

            setIsReadOnly(true);
            fetchFileContent(activeFileId)
                .then((data) => {
                    if (isCancelled || !data) return;

                    model = findModel();
                    if (!model || model.isDisposed()) {
                        const techId = getTechnicalId(activeTab?.language || DEFAULT_LANG);
                        model = monaco.editor.createModel(data.content, techId, modelUri);
                        savedVersionIds.set(model, model.getAlternativeVersionId());
                    }

                    showModel(model, true);
                })
                .catch((err) => {
                    if (isCancelled) return;
                    console.error('Failed to load file', err);
                    toast.error(err.message || 'File loading failed');
                });
        }

        return () => {
            isCancelled = true;
            if (activeModel && !activeModel.isDisposed()) {
                lspManager.onDocumentHide(groupId, activeModel);
            }
        };
    }, [activeFileId, activeTab?.language, groupId, monaco, editorInstance]);

    return { isReadOnly, isDirtyRef };
}
