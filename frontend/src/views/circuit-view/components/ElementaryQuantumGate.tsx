import React, { useMemo, useRef } from 'react';
import styles from '@/App.module.css';
import { QuantumOperationDto, RegisterResponse, ElementSelectorDto, getRegisterSize } from '@/api/dto/circuit.ts';
import { getOperationDefinition, OperationDefinition } from '@/lib/operations.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { TextIcon } from '@/components/ui/text-icon.tsx';
import { formatRotationAngle } from '@/views/circuit-view/util/angle.ts';
import { DragData } from '../util/types';

interface ElementaryQuantumGateProps {
    operation: QuantumOperationDto;
    registers: RegisterResponse[];
    layerIdx: number;
    onDragStart: (operationSize: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
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
    onDragStart,
    onDragEnd,
    onDelete,
}: Readonly<ElementaryQuantumGateProps>) {
    const definition = getOperationDefinition(operation.identifier);
    const isDraggingRef = useRef(false);

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
                top: minY * QUBIT_HEIGHT,
                left: layerIdx * CELL_WIDTH,
                width: CELL_WIDTH,
                height: spanHeight + QUBIT_HEIGHT,
            }}
        >
            {/* Connector Line for Multi-Qubit Gates with hitbox container*/}
            {targetIndices.length + controlIndices.length > 1 && (
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

            {/* Render Controls */}
            {controlIndices.map((idx) => (
                <ControlPoint key={`control-${idx}`} relativeIdx={idx - minY} definition={definition} />
            ))}

            {/* Render Targets */}
            {targetIndices.map((idx) => (
                <TargetPoint
                    key={`target-${idx}`}
                    relativeIdx={idx - minY}
                    definition={definition}
                    isSWAP={operation.identifier === 'SWAP'}
                    angleLabel={angleLabel}
                />
            ))}
        </div>
    );
}

function ControlPoint({ relativeIdx, definition }: Readonly<{ relativeIdx: number; definition: OperationDefinition }>) {
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
}: Readonly<{
    relativeIdx: number;
    definition: OperationDefinition;
    isSWAP: boolean;
    angleLabel?: string | null;
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
                    pointer-events-auto cursor-grab active:cursor-grabbing
                    group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors
                    ${isSWAP ? '' : styles.quantumOperation}`}
                style={
                    isSWAP
                        ? { backgroundColor: 'transparent', color: definition.color }
                        : {
                              backgroundColor: definition.color,
                              color: 'var(--bg-dark)',
                              ...(angleLabel ? { padding: '2px 3px' } : {}),
                          }
                }
            >
                {content}
            </div>
        </div>
    );
}
