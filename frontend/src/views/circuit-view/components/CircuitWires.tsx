import { QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { FlatQubit } from '@/views/circuit-view/util/types.ts';

interface CircuitWiresProps {
    flatQubits: FlatQubit[];
}

export function CircuitWires({ flatQubits }: Readonly<CircuitWiresProps>) {
    return (
        <>
            {flatQubits.map((q, i) => (
                <div
                    key={`wire-${q.regName}-${q.relQubitIdx}`}
                    className="absolute left-0 right-0"
                    style={{ top: i * QUBIT_HEIGHT, height: QUBIT_HEIGHT }}
                >
                    <div
                        className="absolute left-2 flex items-center font-mono text-[12px]"
                        style={{ height: QUBIT_HEIGHT, width: '60px' }}
                    >
                        {q.regName}[{q.relQubitIdx}]
                    </div>
                    <div
                        className="absolute border-b"
                        style={{
                            top: QUBIT_HEIGHT / 2,
                            left: '64px',
                            right: 0,
                            height: '1px',
                        }}
                    />
                </div>
            ))}
        </>
    );
}
