import React, { useMemo, useRef } from 'react';
import { CompositeQuantumGateDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { toGlobalQubitIndex } from '@/views/circuit-view/util/spans.ts';
import { DragData } from '../util/types';

/** Height of the box body within a wire's row, matching the 40px of an elementary gate. */
const BOX_INSET_Y = 4;

/** Horizontal gutter left and right of the box, so adjacent columns stay visually separate. */
const BOX_INSET_X = 8;

interface CompositeQuantumGateProps {
    operation: CompositeQuantumGateDto;
    registers: RegisterResponse[];
    layerIdx: number;
    /** Semi-transparent and non-interactive while dragged; see ElementaryQuantumGate. */
    isGhost?: boolean;
    onDragStart: (operationSize: number, grabOffset: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
}

/**
 * A user-defined gate as one labelled box spanning the wires it was called on.
 *
 * Every declared parameter is drawn as a port, in the gate's parameter order, so the box shows the
 * full signature of the gate as written rather than only the qubits its body happens to touch.
 */
export function CompositeQuantumGate({
    operation,
    registers,
    layerIdx,
    isGhost = false,
    onDragStart,
    onDragEnd,
    onDelete,
}: Readonly<CompositeQuantumGateProps>) {
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
                label: operation.portLabels?.[position] ?? '',
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

    const contents = operation.body?.map((part) => part.identifier).join(', ');

    return (
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
                title={contents ? `${operation.identifier} (${contents})` : operation.identifier}
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
                <span className="px-1 truncate text-[13px] font-semibold leading-none">{operation.identifier}</span>

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
    );
}
