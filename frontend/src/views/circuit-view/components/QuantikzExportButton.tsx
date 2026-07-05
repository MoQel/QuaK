import { Download, SquareArrowRight } from 'lucide-react';

import { CircuitResponse } from '@/api/dto/circuit.ts';
import { Button } from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { useQuantikzExport } from '@/hooks/useQuantikzExport.ts';
import { LatexCodeBlock } from '@/views/circuit-view/components/LatexCodeBlock.tsx';

interface QuantikzExportButtonProps {
    circuit: CircuitResponse | null;
}

export function QuantikzExportButton({ circuit }: Readonly<QuantikzExportButtonProps>) {
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

                <LatexCodeBlock code={latexCode} onCopy={copyToClipboard} status={status} />

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
