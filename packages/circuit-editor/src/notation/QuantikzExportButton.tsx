import { Check, Copy, Download, SquareArrowRight } from 'lucide-react';
import { type ReactNode } from 'react';
import { CircuitResponse } from '@quak/circuit-core';
import { Button } from '@quak/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@quak/ui/dialog';
import { type ExportStatus, useQuantikzExport } from './useQuantikzExport.ts';

export interface LatexCodePreviewProps {
    code: string;
    onCopy: () => void;
    status: ExportStatus;
}

interface QuantikzExportButtonProps {
    circuit: CircuitResponse | null;
    /**
     * How the generated LaTeX is displayed in the dialog. The web IDE injects a
     * syntax-highlighted block; the extension omits it so `react-syntax-highlighter`
     * stays out of the webview bundle and the default plain block is used.
     */
    renderCode?: (props: LatexCodePreviewProps) => ReactNode;
}

export function QuantikzExportButton({ circuit, renderCode = defaultRenderCode }: Readonly<QuantikzExportButtonProps>) {
    const { latexCode, copyToClipboard, downloadTex, status } = useQuantikzExport(circuit);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button disabled={!circuit}>
                    <SquareArrowRight />
                    Latex
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Export to LaTeX</DialogTitle>
                    <DialogDescription>
                        Copy the generated quantikz code or download it as a .tex file.
                    </DialogDescription>
                </DialogHeader>

                {/* copy is fire-and-forget; void marks the discarded promise so a void-return handler stays valid */}
                {renderCode({ code: latexCode, onCopy: () => void copyToClipboard(), status })}

                {status === 'error' && <p className="text-sm text-destructive">Export failed. Please try again.</p>}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={downloadTex}>
                            <Download className="mr-2 h-4 w-4" />
                            Download .tex
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Dependency-light fallback: a plain scrollable code block with a copy button, no
// syntax highlighter. Consumers that want highlighting inject their own renderer.
function defaultRenderCode({ code, onCopy, status }: LatexCodePreviewProps): ReactNode {
    return (
        <div className="relative rounded-md border border-border bg-bg-subtle overflow-y-auto">
            <Button
                variant="ghost"
                size="icon"
                onClick={onCopy}
                className="absolute right-2 top-2 z-10"
                aria-label="Copy LaTeX code"
            >
                {status === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>

            <pre className="max-h-[420px] overflow-auto p-4 pr-12 text-left font-mono text-sm leading-6 whitespace-pre">
                {code}
            </pre>
        </div>
    );
}
