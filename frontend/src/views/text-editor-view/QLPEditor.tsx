import { Editor, useMonaco } from '@monaco-editor/react';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { editor, Uri } from 'monaco-editor';
import { useTheme } from '@/theme';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages.ts';
import { fetchFileContent, saveFileContent } from '@/views/text-editor-view/util/fileService.ts';
import { useMonacoTheme } from '@/hooks/useMonacoTheme.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { setFileDirty } from '@/store/slices/tabsSlice.ts';

const savedVersionIds = new WeakMap<editor.ITextModel, number>();

const getModelId = (model: editor.ITextModel): string => {
    let fileId = decodeURIComponent(model.uri.path);
    if (fileId.startsWith('/')) {
        fileId = fileId.substring(1);
    }
    return fileId;
};

interface QLPEditorProps {
    activeFileId: string | null;
    setCurrentLangId: Dispatch<SetStateAction<string>>;
}

function QLPEditor({ activeFileId, setCurrentLangId }: QLPEditorProps) {
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

    // Refs & Hooks
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monaco = useMonaco();
    const { theme } = useTheme();
    const { applyTheme } = useMonacoTheme(monaco, theme);
    const saveRequest = useAppSelector((state) => state.tabs.lastSaveRequest);
    const langRequest = useAppSelector((state) => state.tabs.lastLanguageRequest);
    const openTabs = useAppSelector((state) => state.tabs.openTabs);
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

    // region Garbage Collection
    useEffect(() => {
        if (!monaco) return;

        const openTabIds = new Set(openTabs.map((t) => t.id));
        const currentModels = monaco.editor.getModels();

        currentModels.forEach((model) => {
            const modelId = getModelId(model);
            if (modelId === activeFileId) return;

            if (!openTabIds.has(modelId)) {
                // console.log(`GC: Disposing model ${modelId}`); // Debug Log
                model.dispose();
            }
        });
    }, [openTabs, monaco, activeFileId, editorInstance]);
    // endregion

    // region tab management and model switching
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
    // endregion

    // region Editor config and mount
    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        setEditorInstance(editor);
        applyTheme();

        const disposable = editor.onDidChangeModelContent(() => {
            const model = editor.getModel();
            if (!model) return;
            const fileId = getModelId(model);

            const currentVersion = model.getAlternativeVersionId();
            const savedVersion = savedVersionIds.get(model);
            const isDirty = savedVersion !== undefined && currentVersion !== savedVersion;

            if (isDirty !== isDirtyRef.current) {
                isDirtyRef.current = isDirty;
                dispatch(setFileDirty({ fileId: fileId, isDirty: isDirty }));
            }
        });

        editor.onDidDispose(() => {
            disposable.dispose();
            setEditorInstance(null);
        });
    };

    useEffect(() => {
        isDirtyRef.current = isCurrentFileDirty;
    }, [isCurrentFileDirty]);
    // endregion

    // region Save & actions
    useEffect(() => {
        if (saveRequest.timestamp > 0 && saveRequest.fileId) {
            void handleSave(saveRequest.fileId);
        }
    }, [saveRequest.timestamp]);

    const handleSave = async (targetFileId: string) => {
        if (!monaco) return;
        const modelUri = Uri.file(targetFileId);
        const model = monaco.editor.getModel(modelUri);
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
        const isTargetFile = langRequest.fileId === activeFileId;
        const isNewRequest = langRequest.timestamp > 0;

        if (isTargetFile && isNewRequest && langRequest.langId) {
            const model = editorInstance?.getModel();
            if (model && monaco) {
                monaco.editor.setModelLanguage(model, langRequest.langId);
                setCurrentLangId(langRequest.langId);
                toast.info(`Language changed to ${langRequest.langId.toUpperCase()}`);
            }
        }
    }, [langRequest.timestamp, activeFileId]);
    // endregion

    return (
        <div className="h-full flex flex-col p-0 relative">
            {!activeFileId && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-gray-500">No file open</div>
            )}

            <div className="h-full w-full" style={{ display: activeFileId ? 'block' : 'none' }}>
                <Editor
                    className="h-full"
                    theme="my-theme"
                    onMount={handleEditorDidMount}
                    beforeMount={(m) => languages.forEach((l) => l.base !== undefined && l.register(m))}
                    options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        readOnly: isReadOnly,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
}

export default QLPEditor;
