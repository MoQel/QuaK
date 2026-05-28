import { useMemo } from 'react';
import { FlatQubit } from '@/views/circuit-view/util/types.ts';
import { CircuitResponse, isClassicRegister } from '@/api/dto/circuit.ts';
import { QubitLabel } from '@/views/circuit-view/components/QubitLabel.tsx';
import { LABEL_WIDTH, QUBIT_HEIGHT, REGISTER_HEADER_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { Badge } from '@/components/ui/badge';

interface QubitWiresProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    flatQubits: FlatQubit[];
}

export function QubitWires({ circuit, setCircuit, flatQubits }: Readonly<QubitWiresProps>) {
    /** Group qubits by register index, preserving register boundaries. */
    const registerGroups = useMemo(() => {
        const groups: { regIdx: number; headerY: number; qubits: FlatQubit[] }[] = [];
        for (const q of flatQubits) {
            const last = groups[groups.length - 1];
            if (last && last.regIdx === q.regIdx) {
                last.qubits.push(q);
            } else {
                // The header Y is visualY of first qubit minus REGISTER_HEADER_HEIGHT
                const headerY = q.visualY - REGISTER_HEADER_HEIGHT - q.relQubitIdx * QUBIT_HEIGHT;
                groups.push({ regIdx: q.regIdx, headerY, qubits: [q] });
            }
        }
        return groups;
    }, [flatQubits]);

    if (flatQubits.length === 0) return null;

    return (
        <>
            {registerGroups.map((group) => {
                const first = group.qubits[0];
                const isClassic = isClassicRegister(
                    circuit?.registers?.find((r) => r.id === first.regId) ?? ({ type: 'Quantum_Register' } as any),
                );

                return (
                    <div key={`reg-group-${first.regId}`}>
                        {/* Register Header */}
                        <div
                            className="absolute left-0 right-0 flex items-center gap-2 px-2 border-b border-border bg-bg-subtle/50"
                            style={{ top: group.headerY, height: REGISTER_HEADER_HEIGHT }}
                        >
                            <span className="font-mono text-[11px] font-semibold text-text truncate">
                                {first.regName}
                            </span>
                            <Badge variant={isClassic ? 'secondary' : 'default'} className="text-[10px] h-4 px-1.5">
                                {isClassic ? 'Classic' : 'Quantum'}
                            </Badge>
                        </div>

                        {/* Wires */}
                        {group.qubits.map((q) => (
                            <div
                                key={`wire-${q.regId}-${q.relQubitIdx}`}
                                className="absolute left-0 right-0"
                                style={{ top: q.visualY, height: QUBIT_HEIGHT }}
                            >
                                <QubitLabel circuit={circuit} setCircuit={setCircuit} qubit={q} />

                                {isClassic ? (
                                    /* Classical double wire */
                                    <>
                                        <div
                                            className="absolute border-b border-muted-foreground/60"
                                            style={{
                                                top: QUBIT_HEIGHT / 2 - 2,
                                                left: LABEL_WIDTH,
                                                right: 0,
                                                height: '1px',
                                            }}
                                        />
                                        <div
                                            className="absolute border-b border-muted-foreground/60"
                                            style={{
                                                top: QUBIT_HEIGHT / 2 + 2,
                                                left: LABEL_WIDTH,
                                                right: 0,
                                                height: '1px',
                                            }}
                                        />
                                    </>
                                ) : (
                                    /* Quantum single wire */
                                    <div
                                        className="absolute border-b border-border"
                                        style={{
                                            top: QUBIT_HEIGHT / 2,
                                            left: LABEL_WIDTH,
                                            right: 0,
                                            height: '1px',
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </>
    );
}
