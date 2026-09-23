import { LibraryElement } from './LibraryElement.tsx';
import { LibraryCompositeElement } from './LibraryCompositeElement.tsx';
import { LibrarySubcircuitElement } from './LibrarySubcircuitElement.tsx';
import { CustomGateTemplate } from '../util/customGates.ts';
import { OperationDefinitionResponse, SubcircuitOption } from '@quak/circuit-core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@quak/ui/card';
import { Separator } from '@quak/ui/separator';
import { Fragment, type KeyboardEvent, type ReactNode } from 'react';

interface LibraryListViewProps {
    quantumOperations: OperationDefinitionResponse[];
    customGates: CustomGateTemplate[];
    subcircuits: SubcircuitOption[];
    onOperationClick?: (operation: OperationDefinitionResponse) => void;
    onOpenSubcircuit?: (option: SubcircuitOption) => void;
    onRemoveSubcircuit?: (option: SubcircuitOption) => void;
}

const pluralize = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** The subtitle under a subcircuit's name, e.g. "4 qubits · 7 operations". */
function describeSubcircuit(qubitCount: number, operationCount: number): string {
    const operations = operationCount === 0 ? 'empty circuit' : pluralize(operationCount, 'operation');
    return `${pluralize(qubitCount, 'qubit')} · ${operations}`;
}

function ListRow({
    tile,
    title,
    description,
    onDoubleClick,
}: Readonly<{ tile: ReactNode; title: string; description?: string; onDoubleClick?: () => void }>) {
    return (
        <Card
            className="gap-3 border-none bg-transparent py-2 shadow-none transition-colors hover:bg-bg"
            onDoubleClick={onDoubleClick}
        >
            <CardContent className="flex items-center gap-3 px-2">
                {tile}
                <CardHeader className="min-w-0 flex-1 gap-0 px-0 text-left">
                    <CardTitle className="text-sm">{title}</CardTitle>
                    {description && (
                        <CardDescription className="line-clamp-2 text-xs leading-tight">{description}</CardDescription>
                    )}
                </CardHeader>
            </CardContent>
        </Card>
    );
}

function SectionHeader({ title }: Readonly<{ title: string }>) {
    return (
        <>
            <Separator className="my-2" />
            <CardHeader className="sticky top-0 z-10 bg-bg-subtle px-0 py-2">
                <CardTitle className="text-left text-sm">{title}</CardTitle>
            </CardHeader>
        </>
    );
}

function LibraryListView({
    quantumOperations,
    customGates,
    subcircuits,
    onOperationClick,
    onOpenSubcircuit,
    onRemoveSubcircuit,
}: Readonly<LibraryListViewProps>) {
    const selectOperation = (operation: OperationDefinitionResponse) => {
        onOperationClick?.(operation);
    };

    const selectOperationWithKeyboard = (
        event: KeyboardEvent<HTMLDivElement>,
        operation: OperationDefinitionResponse,
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        selectOperation(operation);
    };

    return (
        <CardContent className="h-full overflow-y-auto p-0">
            {quantumOperations.map((operation, index) => {
                const isNewCategory = index === 0 || quantumOperations[index - 1].category !== operation.category;
                const isSelectable = onOperationClick !== undefined;

                return (
                    <Fragment key={operation.id}>
                        {isNewCategory && (
                            <>
                                {index > 0 && <Separator className="my-2" />}
                                <CardHeader className="sticky top-0 z-10 bg-bg-subtle px-0 py-2">
                                    <CardTitle className="text-left text-sm">{operation.category}</CardTitle>
                                </CardHeader>
                            </>
                        )}
                        <Card
                            className={`gap-3 border-none bg-transparent py-2 shadow-none transition-colors ${
                                isSelectable ? 'cursor-pointer hover:bg-bg' : ''
                            }`}
                            onClick={isSelectable ? () => selectOperation(operation) : undefined}
                            onKeyDown={
                                isSelectable ? (event) => selectOperationWithKeyboard(event, operation) : undefined
                            }
                            role={isSelectable ? 'button' : undefined}
                            tabIndex={isSelectable ? 0 : undefined}
                        >
                            <CardContent className="flex items-center gap-3 px-2">
                                <LibraryElement
                                    identifier={operation.symbol}
                                    matrix={operation.inspectorInfo.matrix.display}
                                />
                                <CardHeader className="min-w-0 flex-1 gap-0 px-0 text-left">
                                    <CardTitle className="text-sm">{operation.name}</CardTitle>
                                    {operation.description && (
                                        <CardDescription className="line-clamp-2 text-xs leading-tight">
                                            {operation.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                            </CardContent>
                        </Card>
                    </Fragment>
                );
            })}

            {customGates.length > 0 && (
                <>
                    <SectionHeader title="Compositions" />
                    {customGates.map((gate) => {
                        const contents = (gate.template.body ?? []).map((part) => part.identifier).join(', ');
                        return (
                            <ListRow
                                key={gate.key}
                                tile={<LibraryCompositeElement gate={gate} />}
                                title={gate.name}
                                description={`${pluralize(gate.portLabels.length, 'qubit')}${contents ? ` · ${contents}` : ''}`}
                            />
                        );
                    })}
                </>
            )}

            {subcircuits.length > 0 && (
                <>
                    <SectionHeader title="Subcircuits" />
                    {subcircuits.map((option) => (
                        <ListRow
                            key={option.circuitId}
                            tile={
                                <LibrarySubcircuitElement
                                    option={option}
                                    onOpen={onOpenSubcircuit ? () => onOpenSubcircuit(option) : undefined}
                                    onRemove={onRemoveSubcircuit ? () => onRemoveSubcircuit(option) : undefined}
                                />
                            }
                            title={option.name}
                            description={describeSubcircuit(option.qubitCount, option.operationCount)}
                            onDoubleClick={onOpenSubcircuit ? () => onOpenSubcircuit(option) : undefined}
                        />
                    ))}
                </>
            )}
        </CardContent>
    );
}

export default LibraryListView;
