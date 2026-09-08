import {
    isComposedOperation,
    isCompositeGate,
    LoopBlockDto,
    QuantumOperationDto,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import { innermostBlockCovering } from '@/lib/loopBlocks.ts';
import { CompositionBox } from '@/views/circuit-view/components/CompositionBox.tsx';
import { ElementaryQuantumGate } from '@/views/circuit-view/components/ElementaryQuantumGate.tsx';
import { FlatQubit, UiLayer } from '@/views/circuit-view/util/types.ts';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { CELL_WIDTH, getSelectorVisualY, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';

interface QuantumOperationGridProps {
    uiLayers: UiLayer[];
    registers: RegisterResponse[];
    flatQubits: FlatQubit[];
    isOperationDragging: boolean;
    /** Repetition frames, so each gate knows whether it sits in one and which to offer removing. */
    loopBlocks: LoopBlockDto[];
    removeQuantumOperation: (operationId: string) => void;
    /** Drops a repetition frame, leaving its gates where they are. */
    removeLoopBlock: (loopBlockId: string) => void;
    /** Replaces a composite gate by the operations it is made of. */
    ungroupQuantumOperation: (operationId: string) => void;
    /** Asks for the angle editor; the gate itself decides whether it has an angle to edit. */
    editRotationAngle: (operation: QuantumOperationDto) => void;
    setDraggingOperationId: (id: string | null) => void;
    setHoverPos: (pos: null) => void;
    draggingOperation: { op: QuantumOperationDto; layerIdx: number } | null;
}

type MeasurementRoute = {
    id: string;
    color: string;
    title: string;
    d: string;
    arrowX: number;
    arrowY: number;
    label: string;
    labelX: number;
    labelY: number;
};

type UiMeasurementOperation = Extract<UiLayer['quantumOperations'][number], { type: 'MEASUREMENT' }>;

export function QuantumOperationGrid({
    uiLayers,
    registers,
    flatQubits,
    isOperationDragging,
    loopBlocks,
    removeQuantumOperation,
    removeLoopBlock,
    ungroupQuantumOperation,
    editRotationAngle,
    setDraggingOperationId,
    setHoverPos,
    draggingOperation,
}: Readonly<QuantumOperationGridProps>) {
    const dispatch = useDispatch();

    const handleOperationDragStart = (operationId: string, operationSize: number, grabOffset: number) => {
        dispatch(startOperationDrag({ size: operationSize, grabOffset }));
        setDraggingOperationId(operationId);
    };

    const handleOperationDragEnd = () => {
        dispatch(stopOperationDrag());
        setHoverPos(null);
        setDraggingOperationId(null);
    };

    const renderedOperations: {
        op: QuantumOperationDto;
        layerIdx: number;
        isGhost: boolean;
        measurementColor?: string;
    }[] = [
        ...(draggingOperation ? [{ ...draggingOperation, isGhost: true }] : []),
        ...uiLayers.flatMap((layer, layerIdx) => {
            const measurementOperations = layer.quantumOperations.filter((op) => op.type === 'MEASUREMENT');
            return layer.quantumOperations
                .filter((op) => op.type !== 'DUMMY' && op.id !== draggingOperation?.op.id)
                .map((op) => {
                    const measurementIndex = op.type === 'MEASUREMENT' ? measurementOperations.indexOf(op) : -1;
                    return {
                        op,
                        layerIdx,
                        isGhost: false,
                        measurementColor:
                            measurementIndex >= 0 ? getMeasurementRouteColor(measurementIndex) : undefined,
                    };
                });
        }),
    ];

    return (
        <div className={`absolute inset-0 z-20 ${isOperationDragging ? 'pointer-events-none' : ''}`}>
            <MeasurementConnectorLayer uiLayers={uiLayers} registers={registers} flatQubits={flatQubits} />

            {renderedOperations.map(({ op, layerIdx, isGhost, measurementColor }) => {
                // The frame drawn tightest around this gate: it decides both the smaller rendering
                // and which loop the gate's context menu offers to remove.
                const enclosingLoop = op.id ? innermostBlockCovering(loopBlocks, op.id) : undefined;
                const onRemoveLoop = enclosingLoop ? () => removeLoopBlock(enclosingLoop.id) : undefined;

                // A composed operation is one box rather than a set of target/control markers.
                return isComposedOperation(op) ? (
                    <CompositionBox
                        key={op.id}
                        operation={op}
                        flatQubits={flatQubits}
                        layerIdx={layerIdx}
                        isGhost={isGhost}
                        isInLoop={enclosingLoop !== undefined}
                        loopRepeatCount={enclosingLoop?.repeatCount}
                        onDragStart={(operationSize, grabOffset) =>
                            handleOperationDragStart(op.id!, operationSize, grabOffset)
                        }
                        onDragEnd={handleOperationDragEnd}
                        onDelete={() => removeQuantumOperation(op.id!)}
                        // Only a composite gate has a body in this circuit to dissolve into.
                        onUngroup={isCompositeGate(op) ? () => ungroupQuantumOperation(op.id!) : undefined}
                        onRemoveLoop={onRemoveLoop}
                    />
                ) : (
                    <ElementaryQuantumGate
                        key={op.id}
                        operation={op}
                        registers={registers}
                        flatQubits={flatQubits}
                        layerIdx={layerIdx}
                        isGhost={isGhost}
                        isInLoop={enclosingLoop !== undefined}
                        loopRepeatCount={enclosingLoop?.repeatCount}
                        measurementColor={measurementColor}
                        onDragStart={(operationSize, grabOffset) =>
                            handleOperationDragStart(op.id!, operationSize, grabOffset)
                        }
                        onDragEnd={handleOperationDragEnd}
                        onDelete={() => removeQuantumOperation(op.id!)}
                        onRemoveLoop={onRemoveLoop}
                        onEditAngle={() => editRotationAngle(op)}
                    />
                );
            })}
        </div>
    );
}

function MeasurementConnectorLayer({
    uiLayers,
    registers,
    flatQubits,
}: Readonly<{ uiLayers: UiLayer[]; registers: RegisterResponse[]; flatQubits: FlatQubit[] }>) {
    const registerNameById = new Map(registers.map((register) => [register.id, register.name]));
    const formatSelector = (selector: { registerId: string; index: number }) =>
        `${registerNameById.get(selector.registerId) ?? selector.registerId}[${selector.index}]`;
    const routes: Array<MeasurementRoute | null> = uiLayers.flatMap((layer, layerIdx) => {
        const measurementOperations = layer.quantumOperations.filter(
            (op): op is UiMeasurementOperation => op.type === 'MEASUREMENT',
        );

        return measurementOperations.flatMap((operation, measurementIndex) => {
            const centerX = layerIdx * CELL_WIDTH + CELL_WIDTH / 2;
            const color = getMeasurementRouteColor(measurementIndex);

            return operation.targetQubits.map((targetQubit, pairIndex) => {
                const classicBit = operation.classicBits[pairIndex];
                if (!classicBit) return null;

                const routeX = centerX + getMeasurementRouteOffset(pairIndex, operation.targetQubits.length);
                const targetY = getSelectorVisualY(flatQubits, targetQubit) + QUBIT_HEIGHT / 2;
                const classicY = getSelectorVisualY(flatQubits, classicBit) + QUBIT_HEIGHT / 2;

                return {
                    id: `${operation.id ?? 'measurement'}-${pairIndex}`,
                    color,
                    title: `${formatSelector(targetQubit)} -> ${formatSelector(classicBit)}`,
                    d: `M ${centerX} ${targetY + 18} H ${routeX} V ${classicY - 7}`,
                    arrowX: routeX,
                    arrowY: classicY,
                    label: classicBit.index.toString(),
                    labelX: routeX + 10,
                    labelY: classicY - 11,
                };
            });
        });
    });
    const visibleRoutes = routes.filter((route): route is MeasurementRoute => route !== null);

    return (
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" aria-hidden="true">
            {visibleRoutes.map((route) => (
                <g key={route.id}>
                    <title>{route.title}</title>
                    <path d={route.d} fill="none" stroke="var(--bg-subtle)" strokeWidth={7} strokeLinecap="round" />
                    <path
                        d={route.d}
                        fill="none"
                        stroke={route.color}
                        strokeWidth={2}
                        strokeDasharray="4 5"
                        strokeLinecap="round"
                    />
                    <path
                        d={`M ${route.arrowX - 4} ${route.arrowY - 8} L ${route.arrowX} ${route.arrowY} L ${
                            route.arrowX + 4
                        } ${route.arrowY - 8}`}
                        fill={route.color}
                    />
                    <rect
                        x={route.labelX - 4}
                        y={route.labelY - 12}
                        width={route.label.length * 7 + 8}
                        height={14}
                        rx={3}
                        fill="var(--bg-subtle)"
                    />
                    <text
                        x={route.labelX}
                        y={route.labelY}
                        fill="var(--text)"
                        fontFamily="monospace"
                        fontSize={11}
                        fontWeight={700}
                    >
                        {route.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

function getMeasurementRouteOffset(index: number, count: number): number {
    if (count <= 1) return 0;
    return (index - (count - 1) / 2) * 12;
}

function getMeasurementRouteColor(index: number): string {
    const colors = ['var(--text-muted)', 'var(--special)', 'var(--classical)', 'var(--phase)', 'var(--quantum)'];
    return colors[index % colors.length];
}
