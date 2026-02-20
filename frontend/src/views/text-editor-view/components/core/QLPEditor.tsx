import { Editor, useMonaco } from '@monaco-editor/react';
import { useState } from 'react';
import { editor } from 'monaco-editor';
import { useTheme } from '@/theme.tsx';
import { languages } from '@/views/text-editor-view/languages/languages.ts';
import { useMonacoTheme } from '@/hooks/editor/useMonacoTheme.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { setFileDirty } from '@/store/tabs/tabsSlice.ts';
import { getModelId, savedVersionIds } from '@/views/text-editor-view/utils/editorUtils.ts';
import { useEditorModelManager } from '@/hooks/editor/useEditorModelManager.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useEditorLanguage } from '@/hooks/editor/useEditorLanguage.ts';
import { cn } from '@/lib/utils.ts';

interface QLPEditorProps {
    groupId: string;
}

function QLPEditor({ groupId }: Readonly<QLPEditorProps>) {
    const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
    const monaco = useMonaco();
    const { theme } = useTheme();
    const { applyTheme } = useMonacoTheme(monaco, theme);

    const activeFileId = useAppSelector(
        (state) => state.tabs.groups.find((g) => g.id === groupId)?.activeTabId ?? null,
    );
    const isDragging = useAppSelector((state) => state.tabs.isDragging);

    const dispatch = useAppDispatch();

    // region Business logic hooks
    useEditorLanguage(monaco);

    const { isReadOnly, isDirtyRef } = useEditorModelManager(monaco, editorInstance, groupId);
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
    // endregion

    return (
        <div className="h-full flex flex-col p-0 relative">
            {!activeFileId && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-gray-500">No file open</div>
            )}

            <div
                className={cn('h-full w-full', isDragging && 'pointer-events-none')}
                style={{ display: activeFileId ? 'block' : 'none' }}
            >
                <Editor
                    className="h-full"
                    theme="my-theme"
                    onMount={handleEditorDidMount}
                    keepCurrentModel={true} // keeps models alive between tab groups
                    beforeMount={(m) => languages.forEach((l) => l.base !== undefined && l.register(m))}
                    options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        readOnly: isReadOnly,
                        automaticLayout: true,
                        scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                            useShadows: false,
                            verticalHasArrows: false,
                            horizontalHasArrows: false,
                        },
                    }}
                />
            </div>
        </div>
    );
}

export default QLPEditor;
