import { LibraryElement } from './LibraryElement.tsx';
import { OperationDefinitionResponse } from '@quak/circuit-core';
import { Card, CardContent, CardHeader, CardTitle } from '@quak/ui/card';
import { Separator } from '@quak/ui/separator';
import { Fragment } from 'react';

interface LibraryBoxViewProps {
    quantumOperations: OperationDefinitionResponse[];
    onOperationClick?: (operation: OperationDefinitionResponse) => void;
}

function LibraryBoxView({ quantumOperations, onOperationClick }: Readonly<LibraryBoxViewProps>) {
    const operationsByCategory = quantumOperations.reduce((categories, operation) => {
        const operations = categories.get(operation.category) ?? [];
        operations.push(operation);
        categories.set(operation.category, operations);
        return categories;
    }, new Map<string, OperationDefinitionResponse[]>());

    return (
        <CardContent className="flex flex-col gap-2 p-0">
            {[...operationsByCategory].map(([category, operations], index) => (
                <Fragment key={category}>
                    <Card className="gap-2 border-none bg-transparent py-0 shadow-none">
                        <CardHeader className="px-0">
                            <CardTitle className="text-left text-sm">{category}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2 px-0">
                            {operations.map((operation) => (
                                <LibraryElement
                                    key={operation.id}
                                    identifier={operation.symbol}
                                    matrix={operation.inspectorInfo.matrix.display}
                                    onClick={onOperationClick ? () => onOperationClick(operation) : undefined}
                                />
                            ))}
                        </CardContent>
                    </Card>
                    {index < operationsByCategory.size - 1 && <Separator />}
                </Fragment>
            ))}
        </CardContent>
    );
}

export default LibraryBoxView;
