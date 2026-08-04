import { Button } from '@/components/ui/button.tsx';
import { FileCode2 } from 'lucide-react';
import { generateCircuitCode } from '@/views/circuit-view/util/circuitPersistence.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { useState } from 'react';
import { toast } from 'sonner';

interface CodeToolbarProps {
    circuit: CircuitResponse | undefined;
    setCode: (code: string) => void;
}

/**
 * Toolbar action shown in the Code panel header: generate OpenQASM from the active circuit
 * and hand it to `setCode`, which writes it into the active editor. The parent owns where the
 * code lands (symmetric to how `CircuitToolbar` receives `setCircuit`); the reverse direction
 * (parse editor → circuit) lives in the circuit toolbar.
 */
export function CodeToolbar({ circuit, setCode }: Readonly<CodeToolbarProps>) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateCodeIntoActiveEditor = async () => {
        if (!circuit) {
            toast.error('No circuit available');
            return;
        }

        setIsGenerating(true);
        try {
            const code = await generateCircuitCode(circuit);
            setCode(code);
            toast.success('Code generated from circuit');
        } catch (error) {
            toast.error('Code generation failed', {
                description: error instanceof Error ? error.message : 'Could not generate code from the circuit.',
            });
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex items-center justify-start gap-2">
            <Button
                onClick={generateCodeIntoActiveEditor}
                size="icon"
                className="size-8"
                variant="secondary"
                title="Generate code from circuit"
                disabled={isGenerating}
            >
                <FileCode2 />
            </Button>
        </div>
    );
}
