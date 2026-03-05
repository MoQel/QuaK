import { FlatQubit } from '@/views/circuit-view/util/types.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { QubitLabel } from '@/views/circuit-view/components/QubitLabel.tsx';
import { LABEL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';

interface QubitWiresProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    projectId: string | undefined;
    flatQubits: FlatQubit[];
}

export function QubitWires({ circuit, setCircuit, projectId, flatQubits }: Readonly<QubitWiresProps>) {
    return (
        <>
            {flatQubits.map((q, i) => (
                <div
                    key={`wire-${q.regName}-${q.relQubitIdx}`}
                    className="absolute left-0 right-0"
                    style={{ top: i * QUBIT_HEIGHT, height: QUBIT_HEIGHT }}
                >
                    <QubitLabel circuit={circuit} setCircuit={setCircuit} projectId={projectId} qubit={q} />
                    <div
                        className="absolute border-b"
                        style={{
                            top: QUBIT_HEIGHT / 2,
                            left: LABEL_WIDTH,
                            right: 0,
                            height: '1px',
                        }}
                    />
                </div>
            ))}
        </>
    );
}
