import { Editor, useMonaco } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { editor } from 'monaco-editor';
import { useTheme } from '@/theme';
import { languages } from '@/views/text-editor-view/languages/languages.ts';
import { useMonacoTheme } from '@/hooks/editor/useMonacoTheme.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { setFileDirty } from '@/store/slices/tabsSlice.ts';
import { getModelId, savedVersionIds } from '@/views/text-editor-view/util/editorUtils.ts';
import { useEditorModelManager } from '@/hooks/editor/useEditoModelManager.ts';
import { useEditorCommands } from '@/hooks/editor/useEditorCommands.ts';

interface QLPEditorProps {
    activeFileId: string | null;
    setCurrentLangId: (langId: string) => void;
}

function QLPEditor({ activeFileId, setCurrentLangId }: Readonly<QLPEditorProps>) {
    const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
    const monaco = useMonaco();
    const { theme } = useTheme();
    const { applyTheme } = useMonacoTheme(monaco, theme);

    const dispatch = useAppDispatch();
    const openTabs = useAppSelector((state) => state.tabs.openTabs);

    // region Buisness logic hooks
    const { isReadOnly, isDirtyRef } = useEditorModelManager(
        monaco,
        editorInstance,
        activeFileId,
        openTabs,
        setCurrentLangId,
    );

    useEditorCommands(monaco, editorInstance, activeFileId, setCurrentLangId);
    // endregion

    // region Editor config and mount
    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
        setEditorInstance(editor);
        applyTheme();

        const disposable = editor.onDidChangeModelContent(() => {
            const model = editor.getModel();
            if (!model) return;
            const currentVersion = model.getAlternativeVersionId();
            const savedVersion = savedVersionIds.get(model);
            const isDirty = savedVersion !== undefined && currentVersion !== savedVersion;

            if (isDirty !== isDirtyRef.current) {
                isDirtyRef.current = isDirty;
                dispatch(setFileDirty({ fileId: getModelId(model), isDirty: isDirty }));
            }
        });

        editor.onDidDispose(() => {
            disposable.dispose();
            setEditorInstance(null);
        });
    };

    // Cleanup global on unmount
    useEffect(() => {
        return () => {
            if (monaco) {
                const models = monaco.editor.getModels();
                models.forEach((model) => {
                    model.dispose();
                });
            }
        };
    }, [monaco]);
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
