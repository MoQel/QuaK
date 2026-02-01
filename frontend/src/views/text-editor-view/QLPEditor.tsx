import { Editor, Monaco, useMonaco } from '@monaco-editor/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Menu } from '@/views/text-editor-view/Menu.tsx';
import { editor, Uri } from 'monaco-editor';
import { useTheme } from '@/theme';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages.ts';
import { fetchFileContent, saveFileContent } from '@/views/text-editor-view/util/fileService.ts';
import { useMonacoTheme } from '@/hooks/useMonacoTheme.ts';

function QLPEditor({ activeFileId }: { activeFileId: string | undefined }) {
    const [currentLangId, setCurrentLangId] = useState(DEFAULT_LANG);
    const [isReadOnly, setIsReadOnly] = useState(true);

    // Refs & Hooks
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monaco = useMonaco();
    const { theme } = useTheme();
    const { applyTheme } = useMonacoTheme(monaco, theme);

    // region tab management and model switching
    useEffect(() => {
        if (!monaco || !editorRef.current || !activeFileId) {
            if (!activeFileId && editorRef.current) {
                editorRef.current.setModel(null);
                setIsReadOnly(true);
            }
            return;
        }

        const editorInstance = editorRef.current;
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
    }, [activeFileId, monaco]);
    // endregion

    // region Save & actions
    // Currently only saved when explicitly pressed save!!!
    const handleSave = async () => {
        if (!activeFileId || !editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        try {
            await saveFileContent(activeFileId, model.getValue());
            toast.success('Saved successfully');
        } catch (e) {
            toast.error('Save failed');
            console.error(e);
        }
    };

    const handleLanguageChange = (newLangId: string) => {
        const model = editorRef.current?.getModel();
        if (model && monaco) {
            monaco.editor.setModelLanguage(model, newLangId);
            setCurrentLangId(newLangId);
            toast.info(`Language changed to ${newLangId}`);
        }
    };
    // endregion

    const beforeMount = (m: Monaco) => {
        languages.forEach((l) => l.base !== undefined && l.register(m));
        applyTheme();
    };

    const menuLanguages = useMemo(
        () =>
            languages.map((l) => ({
                displayName: l.getID().toUpperCase(),
                isSelected: l.languageId === currentLangId,
                select: () => handleLanguageChange(l.languageId),
            })),
        [currentLangId],
    );

    return (
        <div className="h-full flex flex-col p-0">
            <Menu onSave={handleSave} languages={menuLanguages} />
            <div className="h-full relative">
                <Editor
                    className="h-full"
                    theme="my-theme"
                    onMount={(editor) => {
                        editorRef.current = editor;
                    }}
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
