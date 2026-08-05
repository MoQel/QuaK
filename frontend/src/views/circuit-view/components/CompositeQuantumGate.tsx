import React, { useMemo, useRef } from 'react';
import { CompositeQuantumGateDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { CELL_WIDTH, LOOP_GATE_SCALE, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { toGlobalQubitIndex } from '@/views/circuit-view/util/spans.ts';
import { DragData } from '../util/types';

/** Height of the box body within a wire's row, matching the 40px of an elementary gate. */
const BOX_INSET_Y = 4;

/** Horizontal gutter left and right of the box, so adjacent columns stay visually separate. */
const BOX_INSET_X = 8;

/**
 * Strip along the left edge of the box that belongs to the port labels alone.
 *
 * The gate name is centred in the box, so on a box spanning an odd number of wires it lands exactly
 * on the middle wire — on top of that wire's port label. Keeping the name out of this strip is what
 * stops the name from hiding which qubit a parameter is bound to.
 */
const PORT_GUTTER = 11;

interface CompositeQuantumGateProps {
    operation: CompositeQuantumGateDto;
    registers: RegisterResponse[];
    layerIdx: number;
    /** Semi-transparent and non-interactive while dragged; see ElementaryQuantumGate. */
    isGhost?: boolean;
    /** Drawn slightly narrower when the gate sits inside a repetition frame, so the box has room. */
    isInLoop?: boolean;
    onDragStart: (operationSize: number, grabOffset: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
    /** Dissolves the box into the gates it is made of; offered on right-click. */
    onUngroup: () => void;
    /** How often the enclosing frame repeats, shown on the menu entry that removes it. */
    loopRepeatCount?: number;
    /** Drops the enclosing repetition frame; absent when the gate is not in one. */
    onRemoveLoop?: () => void;
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
    isInLoop = false,
    onDragStart,
    onDragEnd,
    onDelete,
    onUngroup,
    loopRepeatCount,
    onRemoveLoop,
}: Readonly<CompositeQuantumGateProps>) {
    const isDraggingRef = useRef(false);
    const interactivity = isGhost ? 'pointer-events-none' : 'pointer-events-auto';

    // Vertically only, and by inset rather than transform. A transform would pull the ports off the
    // wires they are bound to, and the width is already spoken for: the port gutter plus the gate
    // name have to fit into 48px, so there is nothing there to give away.
    const insetY = isInLoop
        ? BOX_INSET_Y + (QUBIT_HEIGHT - 2 * BOX_INSET_Y) * ((1 - LOOP_GATE_SCALE) / 2)
        : BOX_INSET_Y;

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

    /** A box covering more than one wire has more height than width, so the name reads better turned. */
    const isTall = spanHeight > 0;

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
                        title={contents ? `${operation.identifier} (${contents})` : operation.identifier}
                        className={`
                            absolute rounded-none flex items-center justify-center select-none
                            ${interactivity} cursor-grab active:cursor-grabbing
                            group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors`}
                        style={{
                            top: insetY,
                            left: BOX_INSET_X,
                            width: CELL_WIDTH - 2 * BOX_INSET_X,
                            height: spanHeight + QUBIT_HEIGHT - 2 * insetY,
                            backgroundColor: 'var(--composite)',
                            color: 'var(--bg-dark)',
                        }}
                    >
                        {/*
                         * Set sideways once the box covers more than one wire. A box is only 48px
                         * wide but as tall as its wires, so upright the name is cut to three or
                         * four letters while metres of room go unused next to it; turned, a gate
                         * like `majority` fits whole. Either way it starts right of the port
                         * gutter, so it can never sit on a port label.
                         */}
                        <span
                            className="truncate text-[13px] font-semibold leading-none"
                            style={{
                                marginLeft: PORT_GUTTER,
                                ...(isTall
                                    ? { writingMode: 'vertical-rl', maxHeight: '100%', paddingBlock: 4 }
                                    : { paddingInline: 4 }),
                            }}
                        >
                            {operation.identifier}
                        </span>

                        {/* Port markers, positioned on the wire each parameter is bound to. */}
                        {ports.map((port) => (
                            <span
                                key={port.position}
                                className="absolute left-[3px] font-mono leading-none opacity-80 text-[9px]"
                                style={{ top: (port.wire - minY) * QUBIT_HEIGHT + QUBIT_HEIGHT / 2 - insetY - 4 }}
                            >
                                {port.label}
                            </span>
                        ))}
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuItem onSelect={onUngroup}>Ungroup</ContextMenuItem>
                {onRemoveLoop && (
                    <ContextMenuItem onSelect={onRemoveLoop}>Remove loop ×{loopRepeatCount}</ContextMenuItem>
                )}
                <ContextMenuItem variant="destructive" onSelect={onDelete}>
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
