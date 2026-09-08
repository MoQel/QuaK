import { useMemo, useState } from 'react';
import { FlatQubit } from '@/views/circuit-view/util/types.ts';
import { CircuitResponse, isClassicRegister } from '@/api/dto/circuit.ts';
import { QubitLabel } from '@/views/circuit-view/components/QubitLabel.tsx';
import { LABEL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
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

/**
 * The wires of the circuit: one row per qubit, and per classical bit unless the register is folded.
 *
 * No register is framed or given a header bar. A bar above each register interrupted the very grid
 * it sat in and cut through every gate reaching across two registers; each row's label names its
 * register anyway. Folding a classical register survives that, but as a control inside the label
 * column that appears when the pointer is on the register -- at rest the column shows names only.
 */
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

                return (
                    <RegisterRows
                        key={`reg-group-${first.regId}`}
                        circuit={circuit}
                        setCircuit={setCircuit}
                        group={group}
                        circuitWidth={circuitWidth}
                        isClassic={isClassic}
                        onToggle={() => onToggleClassicRegister(first.regId)}
                    />
                );
            })}
        </>
    );
}

function RegisterRows({
    circuit,
    setCircuit,
    group,
    circuitWidth,
    isClassic,
    onToggle,
}: Readonly<{
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    group: RegisterGroup;
    circuitWidth: number;
    isClassic: boolean;
    onToggle: () => void;
}>) {
    const [showFoldControl, setShowFoldControl] = useState(false);
    const first = group.qubits[0];
    const isFolded = first.isCollapsed;

    // Only a classical register folds: its bits are written by measurements, which name the bit they
    // land in, so one row can stand for all of them.
    const foldHandlers = isClassic
        ? {
              onMouseEnter: () => setShowFoldControl(true),
              onMouseLeave: () => setShowFoldControl(false),
          }
        : {};

    return (
        <div {...foldHandlers}>
            {isFolded ? (
                <div
                    className="absolute left-0"
                    style={{ top: first.visualY, height: QUBIT_HEIGHT, width: circuitWidth }}
                >
                    <div
                        className="absolute z-40 flex items-center bg-bg-subtle px-1 font-mono text-[12px] text-text"
                        style={{ height: QUBIT_HEIGHT, width: LABEL_WIDTH }}
                    >
                        {/* The folded register stands for every one of its bits, so it is named
                            without an index: `ans5` is the five-bit register `ans`. */}
                        <span className="truncate">
                            {first.regName}
                            {group.qubits.length === 1 ? first.registerSize : ''}
                        </span>
                    </div>

                    <WireLine circuitWidth={circuitWidth} isClassic />
                </div>
            ) : (
                group.qubits.map((q) => (
                    <div
                        key={`wire-${q.regId}-${q.relQubitIdx}`}
                        className="absolute left-0"
                        style={{ top: q.visualY, height: QUBIT_HEIGHT, width: circuitWidth }}
                    >
                        <QubitLabel circuit={circuit} setCircuit={setCircuit} qubit={q} />

                        <WireLine circuitWidth={circuitWidth} isClassic={isClassic} />
                    </div>
                ))
            )}

            {isClassic && (
                <button
                    type="button"
                    title={isFolded ? 'Expand classical register' : 'Collapse classical register'}
                    aria-label={isFolded ? 'Expand classical register' : 'Collapse classical register'}
                    onClick={onToggle}
                    onFocus={() => setShowFoldControl(true)}
                    onBlur={() => setShowFoldControl(false)}
                    // The icon is small, the target is not: it spans the row's full height so the
                    // control can be hit without aiming.
                    className={`absolute z-50 flex items-center justify-center text-text-muted hover:text-text ${
                        showFoldControl ? '' : 'sr-only'
                    }`}
                    style={{ top: first.visualY, left: LABEL_WIDTH - 20, height: QUBIT_HEIGHT, width: 20 }}
                >
                    {isFolded ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
            )}
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
