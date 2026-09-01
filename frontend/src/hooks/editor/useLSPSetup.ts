import { useMonaco as useMonacoHook } from '@monaco-editor/react';
import { useEffect } from 'react';
import { WS_BASE_URL } from '@/api/backendUrls';
import { lspManager } from '@/lsp/LSPClientManager.ts';

export function useLSPSetup() {
    const monaco = useMonacoHook();

    useEffect(() => {
        if (!monaco) return;

        lspManager.init(monaco, [
            {
                languageId: 'python',
                wsUrl: `${WS_BASE_URL}/lsp/python`,
                requestTimeoutMs: 15_000,
            },
            { languageId: 'qasm', wsUrl: `${WS_BASE_URL}/lsp/qasm` },
        ]);
    }, [monaco]);
}
