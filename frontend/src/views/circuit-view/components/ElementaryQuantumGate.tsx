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
    measurementColor?: string;
    onDragStart: (operationSize: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
}

export function ElementaryQuantumGate({
    operation,
    registers,
    layerIdx,
    measurementColor = 'var(--classical)',
    onDragStart,
    onDragEnd,
    onDelete,
}: Readonly<ElementaryQuantumGateProps>) {
    const definition = getOperationDefinition(operation.identifier);
    const isDraggingRef = useRef(false);
    const registerNameById = useMemo(
        () => new Map(registers.map((register) => [register.id, register.name])),
        [registers],
    );
    const formatSelector = (selector: { registerId: string; index: number }) =>
        `${registerNameById.get(selector.registerId) ?? selector.registerId}[${selector.index}]`;
    const measurementHints =
        operation.type === 'MEASUREMENT'
            ? operation.targetQubits
                  .map((targetQubit, index) => {
                      const classicBit = operation.classicBits[index];
                      if (!classicBit) return formatSelector(targetQubit);
                      return `${formatSelector(targetQubit)} -> ${formatSelector(classicBit)}`;
                  })
            : [];
    const measurementHint = measurementHints.join('\n');

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

        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';

        setTimeout(() => onDragStart?.(definition.totalSize), 0);
    };

    const handleDragEnd = () => {
        onDragEnd?.();
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

            {controlYs.map((y, idx) => (
                <ControlPoint key={`control-${idx}`} relativeY={y - visualTop} definition={definition} />
            ))}

            {targetYs.map((y, idx) => (
                <TargetPoint
                    key={`target-${idx}`}
                    relativeY={y - visualTop}
                    definition={definition}
                    isSWAP={operation.identifier === 'SWAP'}
                    accentColor={operation.type === 'MEASUREMENT' ? measurementColor : undefined}
                    title={operation.type === 'MEASUREMENT' ? (measurementHints[idx] ?? measurementHint) : undefined}
                />
            ))}

            {operation.type === 'MEASUREMENT' &&
                classicYs.map((y, idx) => (
                    <ClassicBitTargetPoint
                        key={`classic-${idx}`}
                        relativeY={y - visualTop}
                        title={measurementHints[idx] ?? measurementHint}
                        color={measurementColor}
                    />
                ))}
        </div>
    );
}

function ClassicBitTargetPoint({
    relativeY,
    title,
    color,
}: Readonly<{ relativeY: number; title?: string; color: string }>) {
    return (
        <div
            className="absolute inset-x-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ top: relativeY, height: QUBIT_HEIGHT }}
            title={title}
            aria-label={title}
        >
            <div
                className="
                    size-3 rounded-full border-2 border-bg-subtle
                    pointer-events-auto cursor-grab active:cursor-grabbing"
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

function ControlPoint({ relativeY, definition }: Readonly<{ relativeY: number; definition: OperationDefinition }>) {
    const size: number = 12;
    return (
        <div
            className="
                absolute left-1/2 z-20 -translate-x-1/2 rounded-full
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
    accentColor,
    title,
}: Readonly<{
    relativeY: number;
    definition: OperationDefinition;
    isSWAP: boolean;
    accentColor?: string;
    title?: string;
}>) {
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
            className="absolute inset-x-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ top: relativeY, height: QUBIT_HEIGHT }}
            title={title}
            aria-label={title}
        >
            <div
                className={`
                    ${definition.formClass}
                    flex items-center justify-center
                    pointer-events-auto cursor-grab active:cursor-grabbing
                    group-hover:brightness-90 dark:group-hover:brightness-125 transition-colors
                    ${isSWAP ? '' : styles.quantumOperation}`}
                title={title}
                aria-label={title}
                style={
                    isSWAP
                        ? { backgroundColor: 'transparent', color: definition.color }
                        : {
                              backgroundColor: definition.color,
                              color: 'var(--bg-dark)',
                              transform: definition.type === 'MEASUREMENT' ? 'translateY(1px)' : undefined,
                              boxShadow: accentColor ? `0 0 0 3px ${accentColor}` : undefined,
                          }
                }
            >
                {icon}
            </div>
        </div>
    );
}
