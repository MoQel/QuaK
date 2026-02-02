import { Editor, Monaco, useMonaco } from '@monaco-editor/react';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { editor, Uri } from 'monaco-editor';
import { useTheme } from '@/theme';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages.ts';
import { fetchFileContent, saveFileContent } from '@/views/text-editor-view/util/fileService.ts';
import { useMonacoTheme } from '@/hooks/useMonacoTheme.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

interface QLPEditorProps {
    activeFileId: string | null;
    setCurrentLangId: Dispatch<SetStateAction<string>>;
}

function QLPEditor({ activeFileId, setCurrentLangId }: QLPEditorProps) {
    const [isReadOnly, setIsReadOnly] = useState(true);
    // against race condition
    const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

    // Refs & Hooks
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monaco = useMonaco();
    const { theme } = useTheme();
    const { applyTheme } = useMonacoTheme(monaco, theme);
    const saveRequest = useAppSelector((state) => state.tabs.lastSaveRequest);
    const langRequest = useAppSelector((state) => state.tabs.lastLanguageRequest);

    // region tab management and model switching
    useEffect(() => {
        if (!monaco || !editorInstance || !activeFileId) {
            if (!activeFileId && editorInstance) {
                editorInstance.setModel(null);
                setIsReadOnly(true);
            }
            return;
        }

        const modelUri = Uri.parse(`file://${encodeURI(activeFileId)}`);
        const model = monaco.editor.getModel(modelUri);

        // Model with content exists (Hit)
        if (model) {
            editorInstance.setModel(model);
            setCurrentLangId(model.getLanguageId());
            setIsReadOnly(false);
            return;
        }

        // Fetch content (Miss)
        setIsReadOnly(true); // Lock UI
        let isCancelled = false; // Fix für Race Condition

        fetchFileContent(activeFileId).then((data) => {
            if (isCancelled || !data) return;

            const langMatch = languages.find((l) => l.fileExtension === data.ext);
            const langId = langMatch ? langMatch.id : DEFAULT_LANG;

            const newModel = monaco.editor.createModel(data.content, langId, modelUri);

            editorInstance.setModel(newModel);
            setCurrentLangId(langId);
            setIsReadOnly(false);
        });

        // Cleanup when activeFileId changes
        return () => {
            isCancelled = true;
        };
    }, [activeFileId, monaco, editorInstance]);
    // endregion

    // region Save & actions
    // Currently only saved when explicitly pressed save!!!
    useEffect(() => {
        if (saveRequest.fileId === activeFileId && saveRequest.timestamp > 0) {
            void handleSave();
        }
    }, [saveRequest.timestamp, activeFileId]);

    const handleSave = async () => {
        if (!activeFileId || !editorInstance) return;
        const model = editorInstance.getModel();
        if (!model) return;

        try {
            await saveFileContent(activeFileId, model.getValue());
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
            handleLanguageChange(langRequest.langId);
        }
    }, [langRequest.timestamp, activeFileId]);

    const handleLanguageChange = (newLangId: string) => {
        const model = editorInstance?.getModel();
        if (model && monaco) {
            monaco.editor.setModelLanguage(model, newLangId);
            setCurrentLangId(newLangId);
            toast.info(`Language changed to ${newLangId.toUpperCase()}`);
        }
    };
    // endregion

    const beforeMount = (m: Monaco) => {
        languages.forEach((l) => l.base !== undefined && l.register(m));
        applyTheme();
    };

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorRef.current = editor;
        setEditorInstance(editor);
        applyTheme();

        // Add Save Shortcut (Ctrl+S / Cmd+S)
        editor.addAction({
            id: 'save-file',
            label: 'Save File',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => {
                void handleSave();
            },
        });
    };

    return (
        <div className="h-full flex flex-col p-0">
            <div className="h-full relative">
                <Editor
                    className="h-full"
                    theme="my-theme"
                    onMount={handleEditorDidMount}
                    beforeMount={beforeMount}
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
