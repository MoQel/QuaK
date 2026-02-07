import { useEffect, useRef } from 'react';
import { Monaco } from '@monaco-editor/react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { languages } from '@/views/text-editor-view/languages/languages.ts';

export function useEditorLanguage(monaco: Monaco | null) {
    const lastRequest = useAppSelector((state) => state.tabs.lastLanguageRequest);
    const lastTimestampRef = useRef(lastRequest.timestamp);

    useEffect(() => {
        if (!monaco || !lastRequest.fileId || !lastRequest.langId) return;
        if (lastRequest.timestamp <= lastTimestampRef.current) return;

        lastTimestampRef.current = lastRequest.timestamp;

        const models = monaco.editor.getModels();
        const targetModel = models.find((m: Monaco) => {
            return m.uri.path.endsWith(lastRequest.fileId!) || m.uri.fsPath === lastRequest.fileId;
        });

        if (targetModel && !targetModel.isDisposed()) {
            const langConfig = languages.find((l) => l.id === lastRequest.langId);
            const technicalId = langConfig ? langConfig.languageId : lastRequest.langId;
            monaco.editor.setModelLanguage(targetModel, technicalId);
        }
    }, [monaco, lastRequest]);
}
