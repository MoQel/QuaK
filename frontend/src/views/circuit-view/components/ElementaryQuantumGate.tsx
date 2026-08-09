import React, { useMemo, useRef } from 'react';
import styles from '@/App.module.css';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { QuantumOperationDto, RegisterResponse, ElementSelectorDto, getRegisterSize } from '@/api/dto/circuit.ts';
import { getOperationDefinition, OperationDefinition } from '@/lib/operations.ts';
import { CELL_WIDTH, LOOP_GATE_SCALE, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { TextIcon } from '@/components/ui/text-icon.tsx';
import { formatRotationAngle } from '@/views/circuit-view/util/angle.ts';
import { DragData } from '../util/types';

interface ElementaryQuantumGateProps {
    operation: QuantumOperationDto;
    registers: RegisterResponse[];
    layerIdx: number;
    /**
     * Renders the gate semi-transparent and non-interactive while it is being
     * dragged. The element must stay mounted as the drag source (dragend), but it
     * must not swallow dragover events of the drop zone underneath it.
     */
    isGhost?: boolean;
    /** Drawn slightly smaller when the gate sits inside a repetition frame, so the box has room. */
    isInLoop?: boolean;
    onDragStart: (operationSize: number, grabOffset: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
    /** How often the enclosing frame repeats, shown on the menu entry that removes it. */
    loopRepeatCount?: number;
    /** Drops the enclosing repetition frame; absent when the gate is not in one. */
    onRemoveLoop?: () => void;
    /** Opens the angle editor; only offered on a rotation gate (rx/ry/rz). */
    onEditAngle?: () => void;
}

const getGlobalIndex = (selector: ElementSelectorDto, registers: RegisterResponse[]): number => {
    let offset = 0;
    for (const reg of registers) {
        if (reg.id === selector.registerId) return offset + selector.index;
        offset += getRegisterSize(reg);
    }
    return 0;
};

export function ElementaryQuantumGate({
    operation,
    registers,
    layerIdx,
    isGhost = false,
    isInLoop = false,
    onDragStart,
    onDragEnd,
    onDelete,
    loopRepeatCount,
    onRemoveLoop,
    onEditAngle,
}: Readonly<ElementaryQuantumGateProps>) {
    const definition = getOperationDefinition(operation.identifier);
    const isDraggingRef = useRef(false);
    const interactivity = isGhost ? 'pointer-events-none' : 'pointer-events-auto';
    const scale = isInLoop ? LOOP_GATE_SCALE : 1;

    // Rotation gates (rx/ry/rz) show their angle on the box, e.g. "π/2".
    const angleLabel =
        definition.hasRotationAngle && operation.type === 'ELEMENTARY_QUANTUM_GATE'
            ? formatRotationAngle(operation.rotationAngle)
            : null;

    // Compute geometry (indices, span, bounds)
    const { targetIndices, controlIndices, minY, spanHeight } = useMemo(() => {
        const tIndices = operation.targetQubits.map((t) => getGlobalIndex(t, registers));
        const cIndices = operation.controlQubits.map((c) => getGlobalIndex(c, registers));
        const all = [...tIndices, ...cIndices];
        const min = Math.min(...all);
        const max = Math.max(...all);

        return {
            targetIndices: tIndices,
            controlIndices: cIndices,
            minY: min,
            spanHeight: (max - min) * QUBIT_HEIGHT,
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

        // Which wire of this gate the pointer grabbed, so the box can stay under the cursor
        // instead of jumping so that its top wire lands there.
        const bounds = e.currentTarget.getBoundingClientRect();
        const grabOffset = Math.floor((e.clientY - bounds.top) / QUBIT_HEIGHT);

        // Use setTimeout to ensure the browser captures the element as the "drag image"
        // before React potentially re-renders or hides it.
        setTimeout(() => onDragStart?.(definition.totalSize, grabOffset), 0);
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

    const gate = (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className={`absolute z-30 flex flex-col items-center group pointer-events-none ${isGhost ? 'opacity-50' : ''}`}
            style={{
                top: minY * QUBIT_HEIGHT,
                left: layerIdx * CELL_WIDTH,
                width: CELL_WIDTH,
                height: spanHeight + QUBIT_HEIGHT,
            }}
        >
            {/* Connector Line for Multi-Qubit Gates with hitbox container*/}
            {targetIndices.length + controlIndices.length > 1 && (
                <div
                    className={`
                    absolute left-1/2 -translate-x-1/2 w-2
                    ${interactivity} cursor-grab active:cursor-grabbing`}
                    style={{
                        top: QUBIT_HEIGHT / 2,
                        bottom: QUBIT_HEIGHT / 2,
                    }}
                >
                    <div
                        className="
                            absolute left-1/2 -translate-x-1/2 h-full w-[2px]
                            bg-bg-light border-border
                            group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors"
                        style={{ backgroundColor: definition.color }}
                    />
                </div>
            )}

            {/* Render Controls */}
            {controlIndices.map((idx) => (
                <ControlPoint
                    key={`control-${idx}`}
                    relativeIdx={idx - minY}
                    definition={definition}
                    interactivity={interactivity}
                    scale={scale}
                />
            ))}

            {/* Render Targets */}
            {targetIndices.map((idx) => (
                <TargetPoint
                    key={`target-${idx}`}
                    relativeIdx={idx - minY}
                    definition={definition}
                    isSWAP={operation.identifier === 'SWAP'}
                    angleLabel={angleLabel}
                    interactivity={interactivity}
                    scale={scale}
                />
            ))}
        </div>
    );

    // Only a rotation gate has an angle to edit; everything else would get a menu entry that does
    // not apply to it. The gate decides this itself because it already holds the definition.
    const canEditAngle = definition.hasRotationAngle && onEditAngle !== undefined;

    // Only wrapped when there is something to offer: a gate with neither an angle nor an enclosing
    // frame stays the plain draggable element it always was. `asChild` keeps that very element the
    // drag source — a wrapper node would break the HTML5 drag.
    if (!onRemoveLoop && !canEditAngle) return gate;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild disabled={isGhost}>
                {gate}
            </ContextMenuTrigger>
            <ContextMenuContent>
                {canEditAngle && <ContextMenuItem onSelect={onEditAngle}>Change angle…</ContextMenuItem>}
                {onRemoveLoop && (
                    <ContextMenuItem onSelect={onRemoveLoop}>Remove loop ×{loopRepeatCount}</ContextMenuItem>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}

function ControlPoint({
    relativeIdx,
    definition,
    interactivity,
    scale,
}: Readonly<{ relativeIdx: number; definition: OperationDefinition; interactivity: string; scale: number }>) {
    const size: number = 12 * scale;
    return (
        <div
            className={`
                absolute left-1/2 -translate-x-1/2 rounded-full
                bg-bg-light border-border
                ${interactivity} cursor-grab active:cursor-grabbing
                group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors`}
            style={{
                backgroundColor: definition.color,
                top: relativeIdx * QUBIT_HEIGHT + QUBIT_HEIGHT / 2 - size / 2,
                width: `${size}px`,
                height: `${size}px`,
            }}
        />
    );
}

function TargetPoint({
    relativeIdx,
    definition,
    isSWAP,
    angleLabel,
    interactivity,
    scale,
}: Readonly<{
    relativeIdx: number;
    definition: OperationDefinition;
    isSWAP: boolean;
    angleLabel?: string | null;
    interactivity: string;
    scale: number;
}>) {
    let content: React.ReactNode;

    if (definition.icon.type === 'component') {
        const ComponentIcon = definition.icon.component;
        content = <ComponentIcon className="size-4 stroke-4" />;
    } else if (angleLabel) {
        // Rotation gate: stack the identifier over its angle so both fit the box.
        content = (
            <div className="flex flex-col items-center justify-center leading-none">
                <span style={{ fontSize: '12px' }}>{definition.icon.text}</span>
                <span style={{ fontSize: '9px' }} className="font-semibold opacity-90">
                    {angleLabel}
                </span>
            </div>
        );
    } else {
        const TextIconComponent = TextIcon(definition.icon.text);
        content = <TextIconComponent />;
    }

    return (
        <div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
            style={{ top: relativeIdx * QUBIT_HEIGHT, height: QUBIT_HEIGHT }}
        >
            {/* Similar to badge.tsx but supporting group-hover */}
            <div
                className={`
                    ${definition.formClass}
                    flex items-center justify-center
                    ${interactivity} cursor-grab active:cursor-grabbing
                    group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors
                    ${isSWAP ? '' : styles.quantumOperation}`}
                style={{
                    // Scaled rather than resized: a transform leaves the grid geometry alone, so a
                    // gate inside a frame keeps sitting exactly on its wire and in its column.
                    ...(scale === 1 ? {} : { transform: `scale(${scale})` }),
                    ...(isSWAP
                        ? { backgroundColor: 'transparent', color: definition.color }
                        : {
                              backgroundColor: definition.color,
                              color: 'var(--bg-dark)',
                              ...(angleLabel ? { padding: '2px 3px' } : {}),
                          }),
                }}
            >
                {content}
            </div>
        </div>
    );
}
