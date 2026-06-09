import { useEffect, useRef } from 'react';
import { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useAppSelector } from '@/hooks/useAppSelector';
import { languages } from '@/views/text-editor-view/languages/languages.ts';
import { getModelId } from '@/views/text-editor-view/utils/editorUtils.ts';

export function useEditorLanguage(monaco: Monaco | null) {
    const lastRequest = useAppSelector((state) => state.tabs.lastLanguageRequest);
    const lastTimestampRef = useRef(lastRequest.timestamp);

    useEffect(() => {
        if (!monaco || !lastRequest.fileId || !lastRequest.langId) return;
        if (lastRequest.timestamp <= lastTimestampRef.current) return;

        lastTimestampRef.current = lastRequest.timestamp;

        const targetModel = monaco.editor
            .getModels()
            .find((model: editor.ITextModel) => getModelId(model) === lastRequest.fileId);

        if (targetModel && !targetModel.isDisposed()) {
            const langConfig = languages.find((l) => l.id === lastRequest.langId);
            const technicalId = langConfig ? langConfig.languageId : lastRequest.langId;
            monaco.editor.setModelLanguage(targetModel, technicalId);
        }
    }, [monaco, lastRequest]);
}
