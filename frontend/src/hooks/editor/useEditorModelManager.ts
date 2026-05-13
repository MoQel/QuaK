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
import { fileSystemProvider } from '@/lsp/initVsCodeApi.ts';
import { RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';

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

        const fileName = activeTab?.title || 'untitled';
        const modelUri = Uri.file(`/tmp/${activeFileId}/${fileName}`);
        let model = monaco.editor.getModel(modelUri);

        // Model with content exists (Hit)
        if (model && !model.isDisposed()) {
            editorInstance.setModel(model);
            syncDirtyState(model, false);
            setIsReadOnly(false);
            return;
        }

        // Prevent re-fetching if the tab was just closed but the effect runs one last time with the old activeFileId.
        const isStillInTabs = groups.find((g) => g.id === groupId)?.openTabs.some((t) => t.id === activeFileId);
        if (!isStillInTabs) return;

        // Fetch content (Miss)
        setIsReadOnly(true);
        let isCancelled = false;

        fetchFileContent(activeFileId)
            .then((data) => {
                if (isCancelled || !data || !editorInstance || !monaco) return;

                // Has someone else created it in the meantime?
                model = monaco.editor.getModel(modelUri);

                if (!model || model.isDisposed()) {
                    try {
                        fileSystemProvider.registerFile(new RegisteredMemoryFile(modelUri, data.content));
                    } catch (e) {
                        console.debug('Datei existiert bereits im virtuellen FS', e);
                    }

                    const techId = getTechnicalId(activeTab?.language || DEFAULT_LANG);

                    model = monaco.editor.createModel(data.content, techId, modelUri);
                    savedVersionIds.set(model, model.getAlternativeVersionId());
                }

                editorInstance.setModel(model);
                syncDirtyState(model);
                setIsReadOnly(false);
            })
            .catch((err) => {
                console.error('Failed to load file', err);
                toast.error(err.message || 'File loading failed');
            });

        return () => {
            isCancelled = true;
        };
    }, [activeFileId, monaco, editorInstance]);

    return { isReadOnly, isDirtyRef };
}
