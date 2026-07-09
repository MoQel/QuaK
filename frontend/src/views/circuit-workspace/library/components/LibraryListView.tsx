import { LibraryElement } from '@/views/circuit-workspace/library/components/LibraryElement.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Fragment } from 'react';

interface LibraryListViewProps {
    quantumOperations: OperationDefinitionResponse[];
    onOperationClick: (operation: OperationDefinitionResponse) => void;
}

function LibraryListView({ quantumOperations, onOperationClick }: Readonly<LibraryListViewProps>) {
    return (
        <CardContent className="h-full overflow-y-auto p-0">
            {quantumOperations.map((operation, index) => {
                const isNewCategory = index === 0 || quantumOperations[index - 1].category !== operation.category;

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
                            className="cursor-pointer gap-3 border-none bg-transparent py-2 shadow-none transition-colors hover:bg-bg"
                            onClick={() => onOperationClick(operation)}
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
        </CardContent>
    );
}

export default LibraryListView;
