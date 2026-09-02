import { FlatQubit } from '../util/types.ts';
import { QubitLabel } from './QubitLabel.tsx';
import { LABEL_WIDTH, QUBIT_HEIGHT } from '../util/layout.ts';

interface QubitWiresProps {
    flatQubits: FlatQubit[];
    circuitWidth: number;
}

export function QubitWires({ flatQubits, circuitWidth }: Readonly<QubitWiresProps>) {
    return (
        <>
            {flatQubits.map((q, i) => (
                <div
                    key={`wire-${q.regName}-${q.relQubitIdx}`}
                    className="absolute left-0"
                    style={{ top: i * QUBIT_HEIGHT, height: QUBIT_HEIGHT, width: circuitWidth }}
                >
                    <QubitLabel qubit={q} />
                    <div
                        className="absolute border-b border-border"
                        style={{
                            top: QUBIT_HEIGHT / 2,
                            left: LABEL_WIDTH,
                            width: Math.max(circuitWidth - LABEL_WIDTH, 0),
                            height: '1px',
                        }}
                    />
                </div>
            ))}
        </>
    );
}
