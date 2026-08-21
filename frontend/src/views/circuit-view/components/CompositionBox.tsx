import React, { useMemo, useRef } from 'react';
import { CompositeQuantumGateDto, isCompositeGate, RegisterResponse, SubcircuitOperationDto } from '@/api/dto/circuit.ts';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { toGlobalQubitIndex } from '@/views/circuit-view/util/spans.ts';
import { DragData } from '../util/types';

/** Height of the box body within a wire's row, matching the 40px of an elementary gate. */
const BOX_INSET_Y = 4;

/** Horizontal gutter left and right of the box, so adjacent columns stay visually separate. */
const BOX_INSET_X = 8;

interface CompositionBoxProps {
    /**
     * Either way of composing a circuit. Both are drawn as one box over their wires; they differ
     * only in where the contents live — inline in a gate declaration, or in another circuit.
     */
    operation: CompositeQuantumGateDto | SubcircuitOperationDto;
    registers: RegisterResponse[];
    layerIdx: number;
    /** Semi-transparent and non-interactive while dragged; see ElementaryQuantumGate. */
    isGhost?: boolean;
    onDragStart: (operationSize: number, grabOffset: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
    /**
     * Dissolves the box into the gates it is made of; offered on right-click. Absent for a
     * subcircuit: its body is not in this circuit, so there is nothing here to dissolve into.
     */
    onUngroup?: () => void;
}

/**
 * A composed operation as one labelled box spanning the wires it was called on.
 *
 * Both ways of composing a circuit are drawn the same way, because from the circuit's side they are
 * the same thing: one operation standing for several. They differ in where the contents live — a
 * composite gate carries the body of a QASM `gate` declaration, a subcircuit points at another
 * circuit of the project — which is why only the former can be ungrouped.
 *
 * Every declared parameter is drawn as a port, in the gate's parameter order, so the box shows the
 * full signature of the gate as written rather than only the qubits its body happens to touch.
 */
export function CompositionBox({
    operation,
    registers,
    layerIdx,
    isGhost = false,
    onDragStart,
    onDragEnd,
    onDelete,
    onUngroup,
}: Readonly<CompositionBoxProps>) {
    const isDraggingRef = useRef(false);
    const interactivity = isGhost ? 'pointer-events-none' : 'pointer-events-auto';

    const { minY, spanHeight, ports } = useMemo(() => {
        // Parameter order, not wire order: position i belongs to portLabels[i]. A call may pass its
        // qubits in any order, so the box's extent comes from min/max rather than first/last.
        const wireOfPosition = operation.targetQubits.map((selector) => toGlobalQubitIndex(registers, selector));
        const min = Math.min(...wireOfPosition);
        const max = Math.max(...wireOfPosition);

        return {
            minY: min,
            spanHeight: (max - min) * QUBIT_HEIGHT,
            // Every declared parameter gets a port, including ones the body never touches: the wire
            // is bound to the gate either way, and leaving it unlabelled makes the box look as if it
            // took fewer qubits than it does. `usedQubitPositions` stays available on the DTO for
            // callers that do want the distinction.
            ports: wireOfPosition.map((wire, position) => ({
                position,
                wire,
                label: isCompositeGate(operation) ? (operation.portLabels?.[position] ?? '') : `q${position}`,
            })),
        };
    }, [operation, registers]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;

        const data: DragData = {
            origin: 'circuit',
            operationIdentifier: operation.identifier,
            id: operation.id,
        };

        // 'text/plain' is required for Safari browser support
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';

        // Which wire of the box the pointer grabbed; see ElementaryQuantumGate.
        const bounds = e.currentTarget.getBoundingClientRect();
        const grabOffset = Math.floor((e.clientY - bounds.top) / QUBIT_HEIGHT);

        // Deferred so the browser can capture the element as the drag image first.
        setTimeout(() => onDragStart?.(operation.targetQubits.length, grabOffset), 0);
    };

    const handleDragEnd = () => {
        onDragEnd?.();
        // Prevent immediate click (delete) after drop
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDraggingRef.current) onDelete?.();
    };

    // A composite gate carries its body, so the tooltip can list it. A subcircuit only knows the id
    // of the circuit it points at; the box shows a short form of it and the tooltip the whole id.
    // TODO: show the referenced circuit's file name instead — the backend would have to resolve it
    // on read, since storing the name here would go stale when the file is renamed.
    const label = isCompositeGate(operation) ? operation.identifier : operation.definitionCircuitId.slice(0, 8);
    const contents = isCompositeGate(operation) ? operation.body?.map((part) => part.identifier).join(', ') : undefined;
    const tooltip = isCompositeGate(operation)
        ? (contents ? `${operation.identifier} (${contents})` : String(operation.identifier))
        : `Subcircuit: ${operation.definitionCircuitId}`;

    return (
        <ContextMenu>
            {/* `asChild` keeps the box itself the trigger: it is the HTML5 drag source and must stay
                the very same DOM node across a drag, so it must not be wrapped in another element. */}
            <ContextMenuTrigger asChild disabled={isGhost}>
                <div
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={handleClick}
                    className={`absolute z-30 group pointer-events-none ${isGhost ? 'opacity-50' : ''}`}
                    style={{
                        top: minY * QUBIT_HEIGHT,
                        left: layerIdx * CELL_WIDTH,
                        width: CELL_WIDTH,
                        height: spanHeight + QUBIT_HEIGHT,
                    }}
                >
                    <div
                        title={tooltip}
                        className={`
                            absolute rounded-none flex items-center justify-center select-none
                            ${interactivity} cursor-grab active:cursor-grabbing
                            group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors`}
                        style={{
                            top: BOX_INSET_Y,
                            left: BOX_INSET_X,
                            width: CELL_WIDTH - 2 * BOX_INSET_X,
                            height: spanHeight + QUBIT_HEIGHT - 2 * BOX_INSET_Y,
                            backgroundColor: 'var(--composite)',
                            color: 'var(--bg-dark)',
                        }}
                    >
                        <span className="px-1 truncate text-[13px] font-semibold leading-none">{label}</span>

                        {/* Port markers, positioned on the wire each parameter is bound to. */}
                        {ports.map((port) => (
                            <span
                                key={port.position}
                                className="absolute left-[3px] font-mono leading-none opacity-80 text-[9px]"
                                style={{ top: (port.wire - minY) * QUBIT_HEIGHT + QUBIT_HEIGHT / 2 - BOX_INSET_Y - 4 }}
                            >
                                {port.label}
                            </span>
                        ))}
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                {onUngroup && <ContextMenuItem onSelect={onUngroup}>Ungroup</ContextMenuItem>}
                <ContextMenuItem variant="destructive" onSelect={onDelete}>
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
