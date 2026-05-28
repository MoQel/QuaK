import React, { useMemo, useRef } from 'react';
import styles from '@/App.module.css';
import {
    QuantumOperationDto,
    RegisterResponse,
    ElementSelectorDto,
    getRegisterSize,
    getVisualY,
} from '@/api/dto/circuit.ts';
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

const getGlobalIndex = (selector: ElementSelectorDto, registers: RegisterResponse[]): number => {
    let offset = 0;
    for (const reg of registers) {
        if (reg.id === selector.registerId) return offset + selector.index;
        offset += getRegisterSize(reg);
    }
    return 0;
};

/** Maps a global (flat) qubit index back to a register-relative selector. */
const getSelectorAtGlobalIndex = (globalIdx: number, registers: RegisterResponse[]): ElementSelectorDto => {
    let offset = 0;
    for (const reg of registers) {
        const size = getRegisterSize(reg);
        if (globalIdx < offset + size) {
            return { registerId: reg.id, index: globalIdx - offset };
        }
        offset += size;
    }
    return { registerId: '', index: 0 };
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

    // Compute geometry (indices, span, bounds)
    const { targetIndices, controlIndices, minGlobal, visualTop, spanHeight } = useMemo(() => {
        const tIndices = operation.targetQubits.map((t) => getGlobalIndex(t, registers));
        const cIndices = operation.controlQubits.map((c) => getGlobalIndex(c, registers));
        const all = [...tIndices, ...cIndices];
        const minGlobal = Math.min(...all);
        const maxGlobal = Math.max(...all);
        const minSelector = getSelectorAtGlobalIndex(minGlobal, registers);

        return {
            targetIndices: tIndices,
            controlIndices: cIndices,
            minGlobal,
            visualTop: getVisualY(registers, minSelector.registerId, minSelector.index),
            spanHeight: (maxGlobal - minGlobal) * QUBIT_HEIGHT,
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
                <ControlPoint key={`control-${idx}`} relativeIdx={idx - minGlobal} definition={definition} />
            ))}

            {/* Render Targets */}
            {targetIndices.map((idx) => (
                <TargetPoint
                    key={`target-${idx}`}
                    relativeIdx={idx - minGlobal}
                    definition={definition}
                    isSWAP={operation.identifier === 'SWAP'}
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
}: Readonly<{ relativeIdx: number; definition: OperationDefinition; isSWAP: boolean }>) {
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
                        : { backgroundColor: definition.color, color: 'var(--bg-dark)' }
                }
            >
                {icon}
            </div>
        </div>
    );
}
