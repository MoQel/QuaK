import { useMonaco as useMonacoHook } from '@monaco-editor/react';
import { useEffect } from 'react';
import { lspManager } from '@/lsp/LSPClientManager.ts';

export function useLSPSetup() {
    const monaco = useMonacoHook();

    useEffect(() => {
        if (!monaco) return;

        lspManager.init(monaco, [
            {
                languageId: 'python',
                wsUrl: 'ws://localhost:8080/lsp/python',
                requestTimeoutMs: 15_000,
            },
            // { languageId: 'qasm', wsUrl: 'ws://localhost:8080/lsp/qasm' },
        ]);
    }, [monaco]);
}
