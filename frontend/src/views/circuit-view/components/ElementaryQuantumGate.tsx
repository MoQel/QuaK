import React, { useMemo, useRef } from 'react';
import styles from '@/App.module.css';
import { QuantumOperationDto, RegisterResponse, getVisualY } from '@/api/dto/circuit.ts';
import { getOperationDefinition, OperationDefinition } from '@/lib/operations.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { TextIcon } from '@/components/ui/text-icon.tsx';
import { DragData } from '../util/types';

interface ElementaryQuantumGateProps {
    operation: QuantumOperationDto;
    registers: RegisterResponse[];
    layerIdx: number;
    onDragStart: (operationSize: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
}

export function ElementaryQuantumGate({
    operation,
    registers,
    layerIdx,
    onDragStart,
    onDragEnd,
    onDelete,
}: Readonly<ElementaryQuantumGateProps>) {
    const definition = getOperationDefinition(operation.identifier);
    const isDraggingRef = useRef(false);

    // Compute geometry (visual Y offsets, span, bounds)
    const { targetYs, controlYs, classicYs, visualTop, spanHeight } = useMemo(() => {
        const tYs = operation.targetQubits.map((t) => getVisualY(registers, t.registerId, t.index));
        const cYs = operation.controlQubits.map((c) => getVisualY(registers, c.registerId, c.index));
        const clYs =
            operation.type === 'MEASUREMENT'
                ? operation.classicBits.map((cl) => getVisualY(registers, cl.registerId, cl.index))
                : [];
        const allYs = [...tYs, ...cYs, ...clYs];
        const visualTop = allYs.length > 0 ? Math.min(...allYs) : 0;
        const visualBottom = allYs.length > 0 ? Math.max(...allYs) : 0;

        return {
            targetYs: tYs,
            controlYs: cYs,
            classicYs: clYs,
            visualTop,
            spanHeight: visualBottom - visualTop,
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

        // Use setTimeout to ensure the browser captures the element as the "drag image"
        // before React potentially re-renders or hides it.
        setTimeout(() => onDragStart?.(definition.totalSize), 0);
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

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className="absolute z-30 flex flex-col items-center group pointer-events-none"
            style={{
                top: visualTop,
                left: layerIdx * CELL_WIDTH,
                width: CELL_WIDTH,
                height: spanHeight + QUBIT_HEIGHT,
            }}
        >
            {/* Connector Line for Multi-Qubit Gates with hitbox container*/}
            {targetYs.length + controlYs.length > 1 && operation.type !== 'MEASUREMENT' && (
                <div
                    className="
                    absolute left-1/2 -translate-x-1/2 w-2
                    pointer-events-auto cursor-grab active:cursor-grabbing"
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

            {/* Classical double-line connector for Measurements */}
            {operation.type === 'MEASUREMENT' && classicYs.length > 0 && (
                <div
                    className="
                    absolute left-1/2 -translate-x-1/2 w-3
                    pointer-events-auto cursor-grab active:cursor-grabbing"
                    style={{
                        top: QUBIT_HEIGHT / 2,
                        bottom: QUBIT_HEIGHT / 2,
                    }}
                >
                    {/* Left line */}
                    <div
                        className="
                            absolute left-[3px] h-full w-[1px]
                            bg-text-muted group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors"
                        style={{ backgroundColor: 'var(--text-muted)' }}
                    />
                    {/* Right line */}
                    <div
                        className="
                            absolute left-[7px] h-full w-[1px]
                            bg-text-muted group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors"
                        style={{ backgroundColor: 'var(--text-muted)' }}
                    />
                </div>
            )}

            {/* Render Controls */}
            {controlYs.map((y, idx) => (
                <ControlPoint key={`control-${idx}`} relativeY={y - visualTop} definition={definition} />
            ))}

            {/* Render Targets */}
            {targetYs.map((y, idx) => (
                <TargetPoint
                    key={`target-${idx}`}
                    relativeY={y - visualTop}
                    definition={definition}
                    isSWAP={operation.identifier === 'SWAP'}
                />
            ))}

            {/* Render Classic Bits for Measurements */}
            {operation.type === 'MEASUREMENT' &&
                classicYs.map((y, idx) => <ClassicBitTargetPoint key={`classic-${idx}`} relativeY={y - visualTop} />)}
        </div>
    );
}

function ClassicBitTargetPoint({ relativeY }: Readonly<{ relativeY: number }>) {
    return (
        <div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
            style={{ top: relativeY, height: QUBIT_HEIGHT }}
        >
            <div
                className="
                    size-2 rounded-full bg-text-muted
                    pointer-events-auto cursor-grab active:cursor-grabbing"
                style={{ backgroundColor: 'var(--text-muted)' }}
            />
        </div>
    );
}

function ControlPoint({ relativeY, definition }: Readonly<{ relativeY: number; definition: OperationDefinition }>) {
    const size: number = 12;
    return (
        <div
            className="
                absolute left-1/2 -translate-x-1/2 rounded-full
                bg-bg-light border-border
                pointer-events-auto cursor-grab active:cursor-grabbing
                group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors"
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
}: Readonly<{ relativeY: number; definition: OperationDefinition; isSWAP: boolean }>) {
    let icon: React.ReactNode;

    if (definition.icon.type === 'component') {
        const ComponentIcon = definition.icon.component;
        icon = <ComponentIcon className="size-4 stroke-4" />;
    } else {
        const TextIconComponent = TextIcon(definition.icon.text);
        icon = <TextIconComponent />;
    }

    return (
        <div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
            style={{ top: relativeY, height: QUBIT_HEIGHT }}
        >
            {/* Similar to badge.tsx but supporting group-hover */}
            <div
                className={`
                    ${definition.formClass}
                    flex items-center justify-center
                    pointer-events-auto cursor-grab active:cursor-grabbing
                    group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors
                    ${isSWAP ? '' : styles.quantumOperation}`}
                style={
                    isSWAP
                        ? { backgroundColor: 'transparent', color: definition.color }
                        : { backgroundColor: definition.color, color: 'var(--bg-dark)' }
                }
            >
                {icon}
            </div>
        </div>
    );
}
