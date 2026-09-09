import React, { useMemo } from 'react';
import { CompositeQuantumGateDto, isCompositeGate } from '@/api/dto/circuit.ts';
import { getOperationDefinition } from '@/lib/operations.ts';
import { formatRotationAngle } from '@/views/circuit-view/util/angle.ts';
import { buildCompositePreview, PreviewOperation } from '@/views/circuit-view/util/compositePreview.ts';

/** Row height, column width and gate size of the miniature; roughly half the circuit's own grid. */
const ROW_HEIGHT = 24;
const CELL_WIDTH = 30;
const LABEL_WIDTH = 20;
const GATE_SIZE = 16;
const CONTROL_SIZE = 6;

interface CompositeGatePreviewProps {
    gate: CompositeQuantumGateDto;
}

/**
 * The body of a user-defined gate drawn as a small circuit, for the hover panel on its box.
 *
 * The box itself deliberately hides what the gate is made of — that is what makes it a box rather
 * than a group of gates. This shows it without dissolving anything: it is a read-only picture, one
 * level deep, exactly like {@link CompositeQuantumGate}'s "Ungroup" would produce. Its rows are the
 * gate's parameters (`a`, `b`, …), not the circuit's wires, so the panel says what the gate *is*
 * rather than where this particular call happens to sit.
 */
export function CompositeGatePreview({ gate }: Readonly<CompositeGatePreviewProps>) {
    const preview = useMemo(() => buildCompositePreview(gate), [gate]);

    const width = LABEL_WIDTH + Math.max(preview.columnCount, 1) * CELL_WIDTH;
    const height = preview.portLabels.length * ROW_HEIGHT;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="font-semibold text-sm">
                {gate.identifier} ({preview.portLabels.join(', ')})
            </div>

            {preview.operations.length === 0 ? (
                <div className="text-xs text-text-muted">Empty gate body</div>
            ) : (
                <div className="relative" style={{ width, height }}>
                    {/* Wires, one per parameter, labelled like the ports on the box. */}
                    {preview.portLabels.map((label, row) => (
                        <div
                            key={label + row}
                            className="absolute left-0 flex items-center"
                            style={{ top: row * ROW_HEIGHT, height: ROW_HEIGHT, width }}
                        >
                            <span
                                className="font-mono text-[9px] text-text-muted truncate"
                                style={{ width: LABEL_WIDTH }}
                            >
                                {label}
                            </span>
                            <div className="h-px flex-1 bg-text/40" />
                        </div>
                    ))}

                    {preview.operations.map((placed, index) => (
                        <PreviewGate key={placed.operation.id ?? index} placed={placed} />
                    ))}
                </div>
            )}

            {preview.hiddenOperations > 0 && (
                <div className="text-xs text-text-muted">+{preview.hiddenOperations} more</div>
            )}
        </div>
    );
}

/** One body operation: a nested gate stays a box, everything else keeps its circuit appearance. */
function PreviewGate({ placed }: Readonly<{ placed: PreviewOperation }>) {
    const { operation, column, targetRows, controlRows, minRow, maxRow } = placed;
    const rowCount = maxRow - minRow + 1;

    const frame = {
        top: minRow * ROW_HEIGHT,
        left: LABEL_WIDTH + column * CELL_WIDTH,
        width: CELL_WIDTH,
        height: rowCount * ROW_HEIGHT,
    };

    if (isCompositeGate(operation)) {
        // A nested gate stays one box here too: the preview goes one level deep, matching both
        // `expand()` on the backend and what ungrouping this gate would leave behind.
        return (
            <div className="absolute" style={frame}>
                <div
                    className="absolute inset-y-[3px] left-[4px] right-[4px] flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: 'var(--composite)', color: 'var(--bg-dark)' }}
                >
                    <span
                        className="truncate text-[9px] font-semibold leading-none px-[2px]"
                        // Turned once the box is taller than wide, for the same reason as on the
                        // circuit: upright, only two or three letters of the name survive.
                        style={rowCount > 1 ? { writingMode: 'vertical-rl', maxHeight: '100%' } : undefined}
                    >
                        {operation.identifier}
                    </span>
                </div>
            </div>
        );
    }

    const definition = getOperationDefinition(operation.identifier);
    const angleLabel =
        definition.hasRotationAngle && operation.type === 'ELEMENTARY_QUANTUM_GATE'
            ? formatRotationAngle(operation.rotationAngle)
            : null;

    const iconText = definition.icon.type === 'text' ? definition.icon.text : '';

    let icon: React.ReactNode;
    if (definition.icon.type === 'component') {
        const IconComponent = definition.icon.component;
        icon = <IconComponent className="size-3 stroke-3" />;
    } else {
        icon = <span className="leading-none text-[9px] font-semibold">{iconText}</span>;
    }

    const isSwap = operation.identifier === 'SWAP';

    return (
        <div className="absolute" style={frame}>
            {/* Connector between the wires a multi-qubit gate reaches over. */}
            {rowCount > 1 && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 w-[2px]"
                    style={{
                        top: ROW_HEIGHT / 2,
                        bottom: ROW_HEIGHT / 2,
                        backgroundColor: definition.color,
                    }}
                />
            )}

            {controlRows.map((row) => (
                <div
                    key={`control-${row}`}
                    className="absolute left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                        top: (row - minRow) * ROW_HEIGHT + ROW_HEIGHT / 2 - CONTROL_SIZE / 2,
                        width: CONTROL_SIZE,
                        height: CONTROL_SIZE,
                        backgroundColor: definition.color,
                    }}
                />
            ))}

            {targetRows.map((row) => (
                <div
                    key={`target-${row}`}
                    className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center ${definition.formClass}`}
                    style={{
                        top: (row - minRow) * ROW_HEIGHT + (ROW_HEIGHT - GATE_SIZE) / 2,
                        minWidth: GATE_SIZE,
                        height: GATE_SIZE,
                        ...(isSwap
                            ? { backgroundColor: 'transparent', color: definition.color }
                            : { backgroundColor: definition.color, color: 'var(--bg-dark)', padding: '0 2px' }),
                    }}
                >
                    {angleLabel ? (
                        <div className="flex flex-col items-center justify-center leading-none">
                            <span className="text-[8px] font-semibold">{iconText}</span>
                            <span className="text-[7px] opacity-90">{angleLabel}</span>
                        </div>
                    ) : (
                        icon
                    )}
                </div>
            ))}
        </div>
    );
}
