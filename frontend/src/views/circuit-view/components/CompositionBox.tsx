import React, { useMemo, useRef, useState } from 'react';
import { CompositeQuantumGateDto, isCompositeGate, SubcircuitOperationDto } from '@/api/dto/circuit.ts';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { CompositeGatePreview } from '@/views/circuit-view/components/CompositeGatePreview.tsx';
import { CELL_WIDTH, LOOP_GATE_SCALE, QUBIT_HEIGHT, getSelectorVisualY } from '@/views/circuit-view/util/layout.ts';
import { DragData, FlatQubit } from '../util/types';

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

/**
 * How long the pointer has to rest on the box before its body is shown.
 *
 * Short enough to feel like part of pointing at the gate, long enough that dragging another gate
 * across a row of composites does not leave a trail of panels. Closing has no delay at all: the
 * panel is gone the moment the pointer leaves the box.
 */
const PREVIEW_DELAY = 400;

interface CompositionBoxProps {
    /**
     * Either way of composing a circuit. Both are drawn as one box over their wires; they differ
     * only in where the contents live — inline in a gate declaration, or in another circuit.
     */
    operation: CompositeQuantumGateDto | SubcircuitOperationDto;
    /** Wire rows in render order; a wire's y comes from here, not from its index. */
    flatQubits: FlatQubit[];
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
    /** Drawn slightly narrower when the box sits inside a repetition frame, so the frame has room. */
    isInLoop?: boolean;
    /** How often the enclosing frame repeats, shown on the menu entry that removes it. */
    loopRepeatCount?: number;
    /** Drops the enclosing repetition frame; absent when the box is not in one. */
    onRemoveLoop?: () => void;
}

/**
 * A composed operation as one labelled box spanning the wires it was called on.
 *
 * Both ways of composing a circuit are drawn the same way, because from the circuit's side they are
 * the same thing: one operation standing for several. They differ in where the contents live — a
 * composite gate carries the body of a QASM `gate` declaration, a subcircuit points at another
 * circuit of the project — which is why only the former can be ungrouped or previewed.
 *
 * Every declared parameter is drawn as a port, in the gate's parameter order, so the box shows the
 * full signature of the gate as written rather than only the qubits its body happens to touch.
 */
export function CompositionBox({
    operation,
    flatQubits,
    layerIdx,
    isGhost = false,
    isInLoop = false,
    onDragStart,
    onDragEnd,
    onDelete,
    onUngroup,
    loopRepeatCount,
    onRemoveLoop,
}: Readonly<CompositionBoxProps>) {
    const isDraggingRef = useRef(false);
    const interactivity = isGhost ? 'pointer-events-none' : 'pointer-events-auto';

    // The preview is controlled so a drag can veto it: the pointer sits on the box while the drag
    // starts, so an uncontrolled tooltip would open over the circuit the user is dropping into.
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const { minY, spanHeight, ports } = useMemo(() => {
        // Parameter order, not wire order: position i belongs to portLabels[i]. A call may pass its
        // qubits in any order, so the box's extent comes from min/max rather than first/last.
        // Rows are taken as rendered y, not as qubit index: register headers, section gaps and
        // collapsed registers all move a wire away from `index * QUBIT_HEIGHT`.
        const yOfPosition = operation.targetQubits.map((selector) => getSelectorVisualY(flatQubits, selector));
        const min = Math.min(...yOfPosition);
        const max = Math.max(...yOfPosition);

        return {
            minY: min,
            spanHeight: max - min,
            // Every declared parameter gets a port, including ones the body never touches: the wire
            // is bound to the gate either way, and leaving it unlabelled makes the box look as if it
            // took fewer qubits than it does. `usedQubitPositions` stays available on the DTO for
            // callers that do want the distinction.
            ports: yOfPosition.map((y, position) => ({
                position,
                y,
                label: isCompositeGate(operation) ? (operation.portLabels?.[position] ?? '') : `q${position}`,
            })),
        };
    }, [operation, flatQubits]);

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
        isDraggingRef.current = true;
        setIsPreviewOpen(false);

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

    const handlePreviewOpenChange = (open: boolean) => {
        // The pointer is still over the box right after a drop, so without this the panel would
        // reappear on top of the gate the user just placed.
        if (open && isDraggingRef.current) return;
        setIsPreviewOpen(open);
    };

    // Vertically only, and by inset rather than transform. A transform would pull the ports off the
    // wires they are bound to, and the width is already spoken for: the port gutter plus the gate
    // name have to fit into 48px, so there is nothing there to give away.
    const insetY = isInLoop
        ? BOX_INSET_Y + (QUBIT_HEIGHT - 2 * BOX_INSET_Y) * ((1 - LOOP_GATE_SCALE) / 2)
        : BOX_INSET_Y;

    /** A box covering more than one wire has more height than width, so the name reads better turned. */
    const isTall = spanHeight > 0;

    // A composite gate is named by its declaration; a subcircuit by the file it points at, which the
    // backend resolves on every read. The id is only the fallback for a reference that no longer
    // resolves — a deleted file, or one moved out of this project.
    const label = isCompositeGate(operation)
        ? operation.identifier
        : (operation.definitionName ?? operation.definitionCircuitId?.slice(0, 8) ?? 'subcircuit');

    return (
        // The preview lives outside the context menu but shares its trigger element: nesting the
        // two `asChild` triggers merges both onto the very same box, which is what keeps the HTML5
        // drag source one unchanging DOM node.
        <Tooltip
            open={isPreviewOpen && !isGhost}
            onOpenChange={handlePreviewOpenChange}
            delayDuration={PREVIEW_DELAY}
            disableHoverableContent
        >
            <ContextMenu>
                {/*
                 * No `disabled` on the trigger: Radix forwards it to the child, and on a real
                 * button that is the HTML attribute, which would switch the box off for everyone.
                 * A ghost is already inert -- it carries pointer-events-none and its own disabled.
                 */}
                <ContextMenuTrigger asChild>
                    <TooltipTrigger asChild>
                        {/*
                         * A real button rather than a div with a role: it brings focus, Enter and
                         * Space with it. The browser defaults are stripped because the box draws
                         * itself -- and it stays the very element the drag, the context menu and
                         * the preview all hang off, which is what the two `asChild` triggers above
                         * are for.
                         */}
                        <button
                            data-gate
                            type="button"
                            draggable
                            disabled={isGhost}
                            aria-label={`${label} gate on ${operation.targetQubits.length} qubits`}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onClick={handleClick}
                            className={`absolute z-30 group border-0 bg-transparent p-0 text-left pointer-events-none ${isGhost ? 'opacity-50' : ''}`}
                            style={{
                                top: minY,
                                left: layerIdx * CELL_WIDTH,
                                width: CELL_WIDTH,
                                height: spanHeight + QUBIT_HEIGHT,
                            }}
                        >
                            <div
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
                                 * Set sideways once the box covers more than one wire. A box is only
                                 * 48px wide but as tall as its wires, so upright the name is cut to
                                 * three or four letters while metres of room go unused next to it;
                                 * turned, a gate like `majority` fits whole. Either way it starts
                                 * right of the port gutter, so it can never sit on a port label.
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
                                    {label}
                                </span>

                                {/* Port markers, positioned on the wire each parameter is bound to. */}
                                {ports.map((port) => (
                                    <span
                                        key={port.position}
                                        className="absolute left-[3px] font-mono leading-none opacity-80 text-[9px]"
                                        style={{
                                            top: port.y - minY + QUBIT_HEIGHT / 2 - insetY - 4,
                                        }}
                                    >
                                        {port.label}
                                    </span>
                                ))}
                            </div>
                        </button>
                    </TooltipTrigger>
                </ContextMenuTrigger>

                <ContextMenuContent>
                    {onUngroup && <ContextMenuItem onSelect={onUngroup}>Ungroup</ContextMenuItem>}
                    {onRemoveLoop && (
                        <ContextMenuItem onSelect={onRemoveLoop}>Remove loop ×{loopRepeatCount}</ContextMenuItem>
                    )}
                    <ContextMenuItem variant="destructive" onSelect={onDelete}>
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {/* Sideways, so the panel never covers the columns right of the gate the user is
                reading — and never the gate itself, which would make it flicker. */}
            <TooltipContent side="right" className="bg-bg-light text-text border shadow-xl p-3 z-[9999]">
                {isCompositeGate(operation) ? (
                    <CompositeGatePreview gate={operation} />
                ) : (
                    // A subcircuit's body lives in another circuit and is not loaded here, so there
                    // is nothing to draw; naming what it points at is all this panel can honestly say.
                    <span className="text-xs">
                        Subcircuit:{' '}
                        {operation.definitionName ?? operation.definitionCircuitId ?? 'unresolved reference'}
                    </span>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
