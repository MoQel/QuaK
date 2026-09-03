import React, { useMemo, useRef } from 'react';
import styles from '@/App.module.css';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { getSelectorKey, QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { getOperationDefinition, OperationDefinition } from '@/lib/operations.ts';
import {
    CELL_WIDTH,
    getSelectorVisualY,
    isSelectorCollapsed,
    LOOP_GATE_SCALE,
    QUBIT_HEIGHT,
} from '@/views/circuit-view/util/layout.ts';
import { TextIcon } from '@/components/ui/text-icon.tsx';
import { formatRotationAngle } from '@/views/circuit-view/util/angle.ts';
import { DragData, FlatQubit } from '../util/types';

interface ElementaryQuantumGateProps {
    operation: QuantumOperationDto;
    registers: RegisterResponse[];
    flatQubits: FlatQubit[];
    layerIdx: number;
    measurementColor?: string;
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

export function ElementaryQuantumGate({
    operation,
    registers,
    flatQubits,
    layerIdx,
    measurementColor = 'var(--classical)',
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
    const registerNameById = useMemo(
        () => new Map(registers.map((register) => [register.id, register.name])),
        [registers],
    );
    const formatSelector = (selector: { registerId: string; index: number }) =>
        `${registerNameById.get(selector.registerId) ?? selector.registerId}[${selector.index}]`;
    const measurementHints =
        operation.type === 'MEASUREMENT'
            ? operation.targetQubits.map((targetQubit, index) => {
                  const classicBit = operation.classicBits[index];
                  if (!classicBit) return formatSelector(targetQubit);
                  return `${formatSelector(targetQubit)} -> ${formatSelector(classicBit)}`;
              })
            : [];
    const measurementHint = measurementHints.join('\n');

    const angleLabel =
        definition.hasRotationAngle && operation.type === 'ELEMENTARY_QUANTUM_GATE'
            ? formatRotationAngle(operation.rotationAngle)
            : null;

    const { targetYs, controlYs, classicPoints, visualTop, spanHeight } = useMemo(() => {
        const tYs = operation.targetQubits.map((target) => getSelectorVisualY(flatQubits, target));
        const cYs = operation.controlQubits.map((control) => getSelectorVisualY(flatQubits, control));
        const clPoints =
            operation.type === 'MEASUREMENT'
                ? operation.classicBits.map((classicBit) => ({
                      selector: classicBit,
                      y: getSelectorVisualY(flatQubits, classicBit),
                      collapsed: isSelectorCollapsed(flatQubits, classicBit),
                  }))
                : [];
        const allYs = [...tYs, ...cYs, ...clPoints.map((point) => point.y)];
        const visualTop = allYs.length > 0 ? Math.min(...allYs) : 0;
        const visualBottom = allYs.length > 0 ? Math.max(...allYs) : 0;

        return {
            targetYs: tYs,
            controlYs: cYs,
            classicPoints: clPoints,
            visualTop,
            spanHeight: visualBottom - visualTop,
        };
    }, [flatQubits, operation]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;

        const data: DragData = {
            origin: 'circuit',
            operationIdentifier: operation.identifier,
            id: operation.id,
        };

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
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDraggingRef.current && !isGhost) onDelete?.();
    };

    const gate = (
        <div
            data-gate
            draggable={!isGhost}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className={`absolute z-30 flex flex-col items-center group pointer-events-none ${isGhost ? 'opacity-50' : ''}`}
            style={{
                top: visualTop,
                left: layerIdx * CELL_WIDTH,
                width: CELL_WIDTH,
                height: spanHeight + QUBIT_HEIGHT,
            }}
        >
            {targetYs.length + controlYs.length > 1 && operation.type !== 'MEASUREMENT' && (
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

            {controlYs.map((y, idx) => (
                <ControlPoint
                    key={`control-${getSelectorKey(operation.controlQubits[idx])}`}
                    relativeY={y - visualTop}
                    definition={definition}
                    interactivity={interactivity}
                    scale={scale}
                />
            ))}

            {targetYs.map((y, idx) => (
                <TargetPoint
                    key={`target-${getSelectorKey(operation.targetQubits[idx])}`}
                    relativeY={y - visualTop}
                    definition={definition}
                    isSWAP={operation.identifier === 'SWAP'}
                    accentColor={operation.type === 'MEASUREMENT' ? measurementColor : undefined}
                    title={operation.type === 'MEASUREMENT' ? (measurementHints[idx] ?? measurementHint) : undefined}
                    angleLabel={angleLabel}
                    interactivity={interactivity}
                    scale={scale}
                />
            ))}

            {operation.type === 'MEASUREMENT' &&
                classicPoints.map((point, idx) =>
                    point.collapsed ? null : (
                        <ClassicBitTargetPoint
                            key={`classic-${getSelectorKey(point.selector)}`}
                            relativeY={point.y - visualTop}
                            title={measurementHints[idx] ?? measurementHint}
                            color={measurementColor}
                            interactivity={interactivity}
                        />
                    ),
                )}
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

function ClassicBitTargetPoint({
    relativeY,
    title,
    color,
    interactivity,
}: Readonly<{ relativeY: number; title?: string; color: string; interactivity: string }>) {
    return (
        <div
            className="absolute inset-x-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ top: relativeY, height: QUBIT_HEIGHT }}
            title={title}
            aria-label={title}
        >
            <div
                className={`
                    size-3 rounded-full border-2 border-bg-subtle
                    ${interactivity} cursor-grab active:cursor-grabbing`}
                title={title}
                aria-label={title}
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 0 1px var(--text-muted), 0 0 0 5px var(--bg-subtle)`,
                }}
            />
        </div>
    );
}

function ControlPoint({
    relativeY,
    definition,
    interactivity,
    scale,
}: Readonly<{ relativeY: number; definition: OperationDefinition; interactivity: string; scale: number }>) {
    const size: number = 12 * scale;
    return (
        <div
            className={`
                absolute left-1/2 z-20 -translate-x-1/2 rounded-full
                bg-bg-light border-border
                ${interactivity} cursor-grab active:cursor-grabbing
                group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors`}
            style={{
                backgroundColor: definition.color,
                top: relativeY + QUBIT_HEIGHT / 2 - size / 2,
                width: `${size}px`,
                height: `${size}px`,
            }}
        />
    );
}

function TargetPoint({
    relativeY,
    definition,
    isSWAP,
    accentColor,
    title,
    angleLabel,
    interactivity,
    scale,
}: Readonly<{
    relativeY: number;
    definition: OperationDefinition;
    isSWAP: boolean;
    accentColor?: string;
    title?: string;
    angleLabel?: string | null;
    interactivity: string;
    scale: number;
}>) {
    // Scaled rather than resized: a transform leaves the grid geometry alone, so a gate inside a
    // repetition frame keeps sitting exactly on its wire and in its column. Composed with the
    // measurement's own nudge, which would otherwise be overwritten.
    const transform =
        [definition.type === 'MEASUREMENT' ? 'translateY(1px)' : null, scale === 1 ? null : `scale(${scale})`]
            .filter(Boolean)
            .join(' ') || undefined;
    let content: React.ReactNode;

    if (definition.icon.type === 'component') {
        const ComponentIcon = definition.icon.component;
        content = <ComponentIcon className="size-4 stroke-4" />;
    } else if (angleLabel) {
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
            className="absolute inset-x-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ top: relativeY, height: QUBIT_HEIGHT }}
            title={title}
            aria-label={title}
        >
            <div
                className={`
                    ${definition.formClass}
                    flex items-center justify-center
                    ${interactivity} cursor-grab active:cursor-grabbing
                    group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors
                    ${isSWAP ? '' : styles.quantumOperation}`}
                title={title}
                aria-label={title}
                style={
                    isSWAP
                        ? { backgroundColor: 'transparent', color: definition.color, transform }
                        : {
                              backgroundColor: definition.color,
                              color: 'var(--bg-dark)',
                              transform,
                              boxShadow: accentColor ? `0 0 0 3px ${accentColor}` : undefined,
                              ...(angleLabel ? { padding: '2px 3px' } : {}),
                          }
                }
            >
                {content}
            </div>
        </div>
    );
}
