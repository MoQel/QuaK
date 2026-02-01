import { Editor, Monaco, useMonaco } from '@monaco-editor/react'; // Added useMonaco
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Menu } from '@/views/text-editor-view/Menu.tsx';
import { Language } from '@/views/text-editor-view/model/Language.ts';
import { qrisp } from '@/components/languages/qrisp.ts';
import { openqasm } from '@/components/languages/openqasm.ts';
import { api } from '@/api/api.ts';
import { useTheme } from '@/theme';
import { FileContentRequest, FileContentResponse, FileDetailsResponse } from '@/api/dto/filesystem.ts';

import { Base64 } from 'js-base64';
import { editor, Uri } from 'monaco-editor';

const DEFAULT_LANG = 'plaintext';

const languages = [
    new Language('plaintext', 'txt'),
    new Language('python', 'py'),
    new Language('qrisp', 'qrisp', qrisp),
    new Language('qasm', 'qasm', openqasm),
];

function QLPEditor({ activeFileId }: { activeFileId: string | undefined }) {
    const [currentLangId, setCurrentLangId] = useState(DEFAULT_LANG);
    const [readOnly, setReadOnly] = useState<boolean>(true);

    const { theme } = useTheme();

    // Direct access to the editor instance to swap models
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monaco = useMonaco(); // Easier access to global monaco instance

    function getLanguageOrDefaultByExtension(ext: string): string {
        const match = languages.find((l) => l.fileExtension === ext);
        return match ? match.id : DEFAULT_LANG;
    }

    async function retrieveFileExtension(id: string): Promise<string> {
        try {
            const fileElement = await api.get<FileDetailsResponse>(`/api/file/${id}`);
            const filename = fileElement.name;
            if (!filename?.includes('.')) return 'txt';
            return filename.substring(filename.lastIndexOf('.') + 1);
        } catch (e) {
            console.error('Failed to get extension', e);
            return 'txt';
        }
    }

    async function retrieveContent(id: string): Promise<string | null> {
        try {
            const response = await api.get<FileContentResponse>(`/api/file/${id}/content`);
            return Base64.decode(response.content);
        } catch (error) {
            console.error(`Failed to retrieve content for file ${id}`, error);
            return null;
        }
    }

    const applyMonacoTheme = (monacoInstance: Monaco) => {
        monacoInstance.editor.defineTheme('my-theme', {
            base: theme === 'dark' ? 'vs-dark' : 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': theme === 'dark' ? '#18191B' : '#E6E6E6',
                'editorLineNumber.foreground': theme === 'dark' ? '#858585' : '#666666',
                'editorLineNumber.activeForeground': theme === 'dark' ? '#858585' : '#666666',
            },
        });
        monacoInstance.editor.setTheme('my-theme');
    };

    const beforeMount = (monacoInstance: Monaco) => {
        for (const language of languages) {
            if (language.base !== undefined) {
                language.register(monacoInstance);
            }
        }
        applyMonacoTheme(monacoInstance);
    };

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
    };

    // region logic tab switching
    useEffect(() => {
        if (!monaco || !editorRef.current) return;
        const editorInstance = editorRef.current;

        // If no file is selected, clear editor
        if (!activeFileId) {
            editorInstance.setModel(null);
            setReadOnly(true);
            return;
        }

        // Check if model exists in memory
        const modelUri = Uri.parse(`file://${activeFileId}`);
        const model = monaco.editor.getModel(modelUri);

        if (model) {
            // Model exists -> Switch to it (Instant!)
            editorInstance.setModel(model);
            setCurrentLangId(model.getLanguageId());
            setReadOnly(false);
        } else {
            // Model missing -> Fetch content and create it
            setReadOnly(true); // Lock UI while loading

            Promise.all([retrieveContent(activeFileId), retrieveFileExtension(activeFileId)]).then(([content, ext]) => {
                if (content === null) {
                    toast.error('Error loading file content');
                    return;
                }

                // Double check if user switched tabs while loading
                // (Prevents race conditions)
                if (activeFileId !== activeFileId) return;

                const langId = getLanguageOrDefaultByExtension(ext);

                // Create the model with the specific URI
                const newModel = monaco.editor.createModel(
                    content,
                    langId,
                    modelUri, // Registers model in Monaco registry
                );

                editorInstance.setModel(newModel);
                setCurrentLangId(langId);
                setReadOnly(false);
            });
        }
    }, [activeFileId, monaco]);

    // endregion

    // Update theme dynamically
    useEffect(() => {
        if (monaco) applyMonacoTheme(monaco);
    }, [theme, monaco]);

    // region save

    const onSave = async () => {
        if (!activeFileId || !editorRef.current) return;

        // Get content from the CURRENT model, not state
        const model = editorRef.current.getModel();
        if (!model) return;

        const currentContent = model.getValue();
        const encodedContent = Base64.encode(currentContent);

        const body: FileContentRequest = {
            content: encodedContent,
            contentType: 'text/plain', // Should ideally be dynamic based on ext
        };

        try {
            await api.put(`/api/file/${activeFileId}/content`, body);
            toast.success('Saved successfully');
            // No need to reload content! The model is already up to date.
        } catch (e) {
            toast.error('Save failed');
            console.error('Save failed with message ', e);
        }
    };

    // endregion

    // region: menu handling
    const formatLanguages = (langs: Language[]) => {
        return langs.map((l) => ({
            isSelected: l.languageId === currentLangId,
            select: () => {
                // Update Model Language directly
                if (editorRef.current) {
                    const model = editorRef.current.getModel();
                    if (model) {
                        monaco?.editor.setModelLanguage(model, l.languageId);
                        setCurrentLangId(l.languageId);
                        toast('Language changed to ' + l.getID().toUpperCase());
                    }
                }
            },
            displayName: l.getID().toUpperCase(),
        }));
    };

    // endregion

    return (
        <div className="h-full flex flex-col p-0">
            <Menu onSave={onSave} languages={formatLanguages(languages)} />
            <div className="h-full">
                <Editor
                    className="h-full"
                    onMount={handleEditorDidMount}
                    beforeMount={beforeMount}
                    options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        readOnly: readOnly,
                        automaticLayout: true, // Important for resizing
                    }}
                />
            </div>
        </div>
    );
}

export default QLPEditor;
