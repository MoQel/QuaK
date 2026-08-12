import { useMemo } from 'react';
import { FlatQubit } from '@/views/circuit-view/util/types.ts';
import { CircuitResponse, isClassicRegister } from '@/api/dto/circuit.ts';
import { QubitLabel } from '@/views/circuit-view/components/QubitLabel.tsx';
import { LABEL_WIDTH, QUBIT_HEIGHT, REGISTER_HEADER_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface QubitWiresProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    flatQubits: FlatQubit[];
    circuitWidth: number;
    onToggleClassicRegister: (registerId: string) => void;
}

type RegisterGroup = {
    regIdx: number;
    headerY: number;
    qubits: FlatQubit[];
};

export function QubitWires({
    circuit,
    setCircuit,
    flatQubits,
    circuitWidth,
    onToggleClassicRegister,
}: Readonly<QubitWiresProps>) {
    const registerGroups = useMemo(() => {
        const groups: RegisterGroup[] = [];
        for (const q of flatQubits) {
            const last = groups.at(-1);
            if (last?.regIdx === q.regIdx) {
                last.qubits.push(q);
            } else {
                groups.push({ regIdx: q.regIdx, headerY: q.headerY, qubits: [q] });
            }
        }
        return groups;
    }, [flatQubits]);

    if (flatQubits.length === 0) return null;

    return (
        <>
            {registerGroups.map((group) => {
                const first = group.qubits[0];
                const register = circuit?.registers?.find((r) => r.id === first.regId);
                const isClassic = register ? isClassicRegister(register) : false;
                const isCollapsedClassic = isClassic && first.isCollapsed;

                return (
                    <div key={`reg-group-${first.regId}`}>
                        {isCollapsedClassic ? (
                            <CollapsedClassicRegister
                                circuitWidth={circuitWidth}
                                qubit={first}
                                onToggleClassicRegister={onToggleClassicRegister}
                            />
                        ) : (
                            <RegisterHeader
                                circuitWidth={circuitWidth}
                                group={group}
                                isClassic={isClassic}
                                onToggleClassicRegister={onToggleClassicRegister}
                            />
                        )}

                        {!isCollapsedClassic &&
                            group.qubits.map((q) => (
                                <div
                                    key={`wire-${q.regId}-${q.relQubitIdx}`}
                                    className="absolute left-0"
                                    style={{ top: q.visualY, height: QUBIT_HEIGHT, width: circuitWidth }}
                                >
                                    <QubitLabel circuit={circuit} setCircuit={setCircuit} qubit={q} />

                                    <WireLine circuitWidth={circuitWidth} isClassic={isClassic} />
                                </div>
                            ))}
                    </div>
                );
            })}
        </>
    );
}

function RegisterHeader({
    circuitWidth,
    group,
    isClassic,
    onToggleClassicRegister,
}: Readonly<{
    circuitWidth: number;
    group: RegisterGroup;
    isClassic: boolean;
    onToggleClassicRegister: (registerId: string) => void;
}>) {
    const first = group.qubits[0];

    return (
        <div
            className="absolute left-0 z-40 flex items-center gap-2 border-b border-border bg-bg-subtle px-2"
            style={{ top: group.headerY, height: REGISTER_HEADER_HEIGHT, width: circuitWidth }}
        >
            {isClassic && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0 rounded-sm text-text-muted hover:bg-bg-light"
                    title="Collapse classical register"
                    aria-label="Collapse classical register"
                    onClick={() => onToggleClassicRegister(first.regId)}
                >
                    <ChevronDown className="size-3.5" />
                </Button>
            )}
            <span className="truncate font-mono text-[11px] font-semibold text-text">{first.regName}</span>
            <Badge variant={isClassic ? 'secondary' : 'default'} className="h-4 px-1.5 text-[10px]">
                {isClassic ? 'Classic' : 'Quantum'}
            </Badge>
        </div>
    );
}

function CollapsedClassicRegister({
    circuitWidth,
    qubit,
    onToggleClassicRegister,
}: Readonly<{
    circuitWidth: number;
    qubit: FlatQubit;
    onToggleClassicRegister: (registerId: string) => void;
}>) {
    return (
        <div className="absolute left-0" style={{ top: qubit.visualY, height: QUBIT_HEIGHT, width: circuitWidth }}>
            <div
                className="absolute z-40 flex items-center gap-1 bg-bg-subtle px-1"
                style={{ height: QUBIT_HEIGHT, width: LABEL_WIDTH }}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0 rounded-sm text-text-muted hover:bg-bg-light"
                    title="Expand classical register"
                    aria-label="Expand classical register"
                    onClick={() => onToggleClassicRegister(qubit.regId)}
                >
                    <ChevronRight className="size-3.5" />
                </Button>
                <span className="truncate font-mono text-[12px] text-text">
                    {qubit.regName}
                    {qubit.registerSize}
                </span>
            </div>

            <WireLine circuitWidth={circuitWidth} isClassic />
        </div>
    );
}

function WireLine({ circuitWidth, isClassic }: Readonly<{ circuitWidth: number; isClassic: boolean }>) {
    const wireWidth = Math.max(circuitWidth - LABEL_WIDTH, 0);

    if (isClassic) {
        return (
            <>
                <div
                    className="absolute border-b border-muted-foreground/60"
                    style={{
                        top: QUBIT_HEIGHT / 2 - 2,
                        left: LABEL_WIDTH,
                        width: wireWidth,
                        height: '1px',
                    }}
                />
                <div
                    className="absolute border-b border-muted-foreground/60"
                    style={{
                        top: QUBIT_HEIGHT / 2 + 2,
                        left: LABEL_WIDTH,
                        width: wireWidth,
                        height: '1px',
                    }}
                />
            </>
        );
    }

    return (
        <div
            className="absolute border-b border-border"
            style={{
                top: QUBIT_HEIGHT / 2,
                left: LABEL_WIDTH,
                width: wireWidth,
                height: '1px',
            }}
        />
    );
}
