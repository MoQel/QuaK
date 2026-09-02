import { QuantikzExportButton as SharedQuantikzExportButton, type LatexCodePreviewProps } from '@quak/circuit-editor';

import { CircuitResponse } from '@/api/dto/circuit.ts';
import { LatexCodeBlock } from '@/views/circuit-workspace/notation/LatexCodeBlock.tsx';

interface QuantikzExportButtonProps {
    circuit: CircuitResponse | null;
}

// The shared button lives in @quak/circuit-editor with a dependency-light default
// code view. The web IDE injects its syntax-highlighted LatexCodeBlock here, which
// keeps react-syntax-highlighter (and the theme context) out of the shared package.
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
