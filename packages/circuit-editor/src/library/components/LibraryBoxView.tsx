import { LibraryElement } from './LibraryElement.tsx';
import { LibraryCompositeElement } from './LibraryCompositeElement.tsx';
import { LibrarySubcircuitElement } from './LibrarySubcircuitElement.tsx';
import { CustomGateTemplate } from '../util/customGates.ts';
import { OperationDefinitionResponse, SubcircuitOption } from '@quak/circuit-core';
import { Card, CardContent, CardHeader, CardTitle } from '@quak/ui/card';
import { Separator } from '@quak/ui/separator';
import { Plus } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

interface LibraryBoxViewProps {
    quantumOperations: OperationDefinitionResponse[];
    customGates: CustomGateTemplate[];
    subcircuits: SubcircuitOption[];
    onOperationClick?: (operation: OperationDefinitionResponse) => void;
    /** Absent outside a project, where there is nothing to build a subcircuit from. */
    onNewSubcircuit?: () => void;
    onOpenSubcircuit?: (option: SubcircuitOption) => void;
    onRemoveSubcircuit?: (option: SubcircuitOption) => void;
}

/**
 * The gates that can be dragged into a circuit, built-in and user-defined together.
 *
 * Each group flows rather than sitting in a fixed grid of columns: a built-in is a 40px square
 * holding a symbol, while a custom gate is as wide as its name, and squeezed into a built-in's cell
 * every one of them read as `b…`, `d…`, `r…`. Flowing lets both keep the width they need.
 */
function LibraryBoxView({
    quantumOperations,
    customGates,
    subcircuits,
    onOperationClick,
    onNewSubcircuit,
    onOpenSubcircuit,
    onRemoveSubcircuit,
}: Readonly<LibraryBoxViewProps>) {
    const operationsByCategory = quantumOperations.reduce((categories, operation) => {
        const operations = categories.get(operation.category) ?? [];
        operations.push(operation);
        categories.set(operation.category, operations);
        return categories;
    }, new Map<string, OperationDefinitionResponse[]>());

    const sections: { title: string; tiles: ReactNode }[] = [...operationsByCategory].map(([category, operations]) => ({
        title: category,
        tiles: operations.map((operation) => (
            <LibraryElement
                key={operation.id}
                identifier={operation.symbol}
                matrix={operation.inspectorInfo.matrix.display}
                onClick={onOperationClick ? () => onOperationClick(operation) : undefined}
            />
        )),
    }));

    if (customGates.length > 0) {
        sections.push({
            title: 'Compositions',
            tiles: customGates.map((gate) => <LibraryCompositeElement key={gate.key} gate={gate} />),
        });
    }

    // Present even without any subcircuit when the host can create one: otherwise there would be no
    // place to make the first one from.
    if (subcircuits.length > 0 || onNewSubcircuit) {
        sections.push({
            title: 'Subcircuits',
            tiles: (
                <>
                    {subcircuits.map((option) => (
                        <LibrarySubcircuitElement
                            key={option.circuitId}
                            option={option}
                            onOpen={onOpenSubcircuit ? () => onOpenSubcircuit(option) : undefined}
                            onRemove={onRemoveSubcircuit ? () => onRemoveSubcircuit(option) : undefined}
                        />
                    ))}
                    {/* The one tile here that is not a gate: it makes a new one. */}
                    {onNewSubcircuit && (
                        <button
                            type="button"
                            title="New subcircuit"
                            aria-label="New subcircuit"
                            onClick={onNewSubcircuit}
                            className="flex items-center justify-center border border-dashed border-border text-text-muted hover:text-text hover:border-text-muted transition-colors"
                            style={{ height: 'var(--quantumOperationHeight)', width: 'var(--quantumOperationWidth)' }}
                        >
                            <Plus className="size-4" />
                        </button>
                    )}
                </>
            ),
        });
    }

    return (
        <CardContent className="flex flex-col gap-2 p-0">
            {sections.map(({ title, tiles }, index) => (
                <Fragment key={title}>
                    <Card className="gap-2 border-none bg-transparent py-0 shadow-none">
                        <CardHeader className="px-0">
                            <CardTitle className="text-left text-sm">{title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2 px-0">{tiles}</CardContent>
                    </Card>
                    {index < sections.length - 1 && <Separator />}
                </Fragment>
            ))}
        </CardContent>
    );
}

export default LibraryBoxView;
