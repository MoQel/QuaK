import { useMonaco as useMonacoHook } from '@monaco-editor/react';
import { useEffect } from 'react';
import { lspManager } from '@/lsp/LSPClientManager.ts';

export function useLSPSetup() {
    const monaco = useMonacoHook();

    useEffect(() => {
        if (!monaco) return;

        const wsBase = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

        lspManager.init(monaco, [
            {
                languageId: 'python',
                wsUrl: `${wsBase}/lsp/python`,
                requestTimeoutMs: 15_000,
            },
            { languageId: 'qasm', wsUrl: `${wsBase}/lsp/qasm` },
        ]);
    }, [monaco]);
}
