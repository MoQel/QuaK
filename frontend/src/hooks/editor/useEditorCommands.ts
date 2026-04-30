import { useEffect } from 'react';
import { Uri } from 'monaco-editor';
import { toast } from 'sonner';
import { saveFileContent } from '@/views/text-editor-view/utils/fileService';
import { savedVersionIds } from '@/views/text-editor-view/utils/editorUtils';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setFileDirty } from '@/store/tabs/tabsSlice.ts';
import { useMonaco } from '@monaco-editor/react';

export function useEditorCommands() {
    const monaco = useMonaco();
    const dispatch = useAppDispatch();
    const saveRequest = useAppSelector((state) => state.tabs.lastSaveRequest);

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
            toast.error('Save failed', {
                description: e instanceof Error ? e.message : 'unknown error',
            });
            console.error(e);
        }
    };

    useEffect(() => {
        if (saveRequest.timestamp > 0 && saveRequest.fileId) {
            void handleSave(saveRequest.fileId);
        }
    }, [saveRequest.timestamp]);
}
