import React, { useMemo, useRef } from 'react';
import styles from '@/App.module.css';
import { QuantumOperationDto, RegisterResponse, ElementSelectorDto, getRegisterSize } from '@/api/dto/circuit.ts';
import {
    getOperationIconByIdentifier,
    getOperationSizeByIdentifier,
    OperationIdentifier,
} from '@/api/dto/OperationDefinition.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/layout.ts';

interface ElementaryQuantumGateProps {
    operation: QuantumOperationDto;
    registers: RegisterResponse[];
    layerIdx: number;
    onDragStart: (operationSize: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
}

// --- Helper Functions ---

const getGlobalIndex = (selector: ElementSelectorDto, registers: RegisterResponse[]): number => {
    let offset = 0;
    for (const reg of registers) {
        if (reg.id === selector.registerId) return offset + selector.index;
        offset += getRegisterSize(reg);
    }
    return 0;
};

// --- Main Component ---

export function ElementaryQuantumGate({
    operation,
    registers,
    layerIdx,
    onDragStart,
    onDragEnd,
    onDelete,
}: Readonly<ElementaryQuantumGateProps>) {
    const isDraggingRef = useRef(false);

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

    // --- Drag & Click Handlers ---

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;

        const data = {
            origin: 'circuit',
            id: operation.id,
            operationDefinition: operation.operationDefinition,
        };

        // 'text/plain' is required for Safari browser support
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';

        const operationSize = getOperationSizeByIdentifier(operation.operationDefinition);

        // Use setTimeout to ensure the browser captures the element as the "drag image"
        // before React potentially re-renders or hides it.
        setTimeout(() => onDragStart?.(operationSize), 0);
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
                            group-hover:bg-highlight transition-colors"
                    />
                </div>
            )}

            {/* Render Controls */}
            {controlIndices.map((idx) => (
                <ControlPoint key={`control-${idx}`} relativeIdx={idx - minY} />
            ))}

            {/* Render Targets */}
            {targetIndices.map((idx) => (
                <TargetPoint
                    key={`target-${idx}`}
                    relativeIdx={idx - minY}
                    definition={operation.operationDefinition}
                />
            ))}
        </div>
    );
}

// --- Sub-Components ---

function ControlPoint({ relativeIdx }: Readonly<{ relativeIdx: number }>) {
    const size: number = 12;
    return (
        <div
            className="
                absolute left-1/2 -translate-x-1/2 rounded-full
                bg-bg-light border-border
                pointer-events-auto cursor-grab active:cursor-grabbing
                group-hover:bg-highlight transition-colors"
            style={{
                top: relativeIdx * QUBIT_HEIGHT + QUBIT_HEIGHT / 2 - size / 2,
                width: `${size}px`,
                height: `${size}px`,
            }}
        />
    );
}

function TargetPoint({ relativeIdx, definition }: Readonly<{ relativeIdx: number; definition: OperationIdentifier }>) {
    const Icon = getOperationIconByIdentifier(definition);

    return (
        <div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none"
            style={{
                top: relativeIdx * QUBIT_HEIGHT,
                height: QUBIT_HEIGHT,
            }}
        >
            {/* Similar to badge.tsx but supporting group-hover */}
            <div
                className={`
                    flex items-center justify-center
                    bg-bg text-text
                    border border-border
                    pointer-events-auto cursor-grab active:cursor-grabbing
                    group-hover:bg-bg-light transition-colors
                    ${styles.gate}`}
            >
                <Icon className="size-4 stroke-4 items-center justify-center leading-none" />
            </div>
        </div>
    );
}
