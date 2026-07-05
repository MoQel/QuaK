import { useCallback, useMemo, useRef, useState } from 'react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { toQuantikz, toStandaloneQuantikzDocument } from '@/views/circuit-view/util/quantikzMapper.ts';

export type ExportStatus = 'idle' | 'copied' | 'error';

const STATUS_RESET_MS = 2000;

export function useQuantikzExport(circuit: CircuitResponse | null) {
    const [status, setStatus] = useState<ExportStatus>('idle');
    const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const latexCode = useMemo(() => {
        if (!circuit) return '';
        return toQuantikz(circuit);
    }, [circuit]);

    const latexDocument = useMemo(() => {
        if (!circuit) return '';
        return toStandaloneQuantikzDocument(circuit);
    }, [circuit]);

    const resetStatusLater = useCallback(() => {
        if (resetTimeoutRef.current) {
            globalThis.clearTimeout(resetTimeoutRef.current);
        }

        resetTimeoutRef.current = globalThis.setTimeout(() => {
            setStatus('idle');
            resetTimeoutRef.current = null;
        }, STATUS_RESET_MS);
    }, []);

    const copyToClipboard = useCallback(async () => {
        if (!latexCode) {
            setStatus('error');
            resetStatusLater();
            return;
        }

        try {
            await navigator.clipboard.writeText(latexCode);
            setStatus('copied');
        } catch {
            setStatus('error');
        } finally {
            resetStatusLater();
        }
    }, [latexCode, resetStatusLater]);

    const downloadTex = useCallback(() => {
        if (!latexDocument) {
            setStatus('error');
            resetStatusLater();
            return;
        }

        const blob = new Blob([latexDocument], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = circuit ? `circuit-${circuit.id}.tex` : 'circuit.tex';
        anchor.click();

        globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
    }, [circuit, latexDocument, resetStatusLater]);

    return {
        latexCode,
        copyToClipboard,
        downloadTex,
        status,
    };
}
