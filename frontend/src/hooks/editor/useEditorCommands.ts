import { useEffect, useRef } from 'react';
import { editor, Uri } from 'monaco-editor';
import { toast } from 'sonner';
import { saveFileContent } from '@/views/text-editor-view/util/fileService';
import { savedVersionIds } from '@/views/text-editor-view/util/editorUtils';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setFileDirty } from '@/store/slices/tabsSlice';
import { Monaco } from '@monaco-editor/react';

export function useEditorCommands(
    monaco: Monaco,
    editorInstance: editor.IStandaloneCodeEditor | null,
    activeFileId: string | null,
    setCurrentLangId: (id: string) => void,
) {
    const dispatch = useAppDispatch();
    const saveRequest = useAppSelector((state) => state.tabs.lastSaveRequest);
    const langRequest = useAppSelector((state) => state.tabs.lastLanguageRequest);
    const lastHandledLangRequest = useRef<number>(0);

    // Handle Save
    const handleSave = async (targetFileId: string) => {
        if (!monaco) return;
        const model = monaco.editor.getModel(Uri.file(targetFileId));
        if (!model || model.isDisposed()) return;

        try {
            await saveFileContent(targetFileId, model.getValue());
            savedVersionIds.set(model, model.getAlternativeVersionId());
            dispatch(setFileDirty({ fileId: targetFileId, isDirty: false }));
            toast.success('Saved successfully');
        } catch (e) {
            toast.error('Save failed');
            console.error(e);
        }
    };

    useEffect(() => {
        if (saveRequest.timestamp > 0 && saveRequest.fileId) {
            void handleSave(saveRequest.fileId);
        }
    }, [saveRequest.timestamp]);

    // Handle Language Change
    useEffect(() => {
        const isTargetFile = langRequest.fileId === activeFileId;
        const isNewRequest = langRequest.timestamp > lastHandledLangRequest.current;

        if (isTargetFile && isNewRequest && langRequest.langId && editorInstance && monaco) {
            lastHandledLangRequest.current = langRequest.timestamp;
            const model = editorInstance.getModel();

            if (model) {
                monaco.editor.setModelLanguage(model, langRequest.langId);
                setCurrentLangId(langRequest.langId);
                toast.info(`Language changed to ${langRequest.langId.toUpperCase()}`);
            }
        }
    }, [langRequest.timestamp, activeFileId, editorInstance]);
}
