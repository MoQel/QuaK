import { QuantikzExportButton as SharedQuantikzExportButton, type LatexCodePreviewProps } from '@quak/circuit-editor';

import { CircuitResponse } from '@quak/circuit-core';
import { LatexCodeBlock } from '@/views/circuit-workspace/notation/LatexCodeBlock.tsx';

interface QuantikzExportButtonProps {
    circuit: CircuitResponse | null;
}

// The shared button with the web IDE's syntax-highlighted code view.
export function QuantikzExportButton({ circuit }: Readonly<QuantikzExportButtonProps>) {
    return (
        <SharedQuantikzExportButton
            circuit={circuit}
            renderCode={({ code, onCopy, status }: LatexCodePreviewProps) => (
                <LatexCodeBlock code={code} onCopy={onCopy} status={status} />
            )}
        />
    );
}
