import { useMemo } from 'react';
import { LibraryElement } from '@/views/library-view/LibraryElement.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

interface QuantumOperationListProps {
    quantumOperations: OperationDefinitionResponse[];
    onOperationClick: (operation: OperationDefinitionResponse) => void;
}

function QuantumOperationList({ quantumOperations, onOperationClick }: Readonly<QuantumOperationListProps>) {
    // Group and sort by type and then by name
    const groupedQuantumOperations = useMemo(() => {
        const groups: Record<string, OperationDefinitionResponse[]> = {};

        for (const quantumOperation of quantumOperations) {
            const type = quantumOperation.category;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(quantumOperation);
        }

        return Object.entries(groups)
            .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
            .map(([type, operationsInGroup]) => ({
                type,
                operations: operationsInGroup.toSorted((a, b) => a.name.localeCompare(b.name)),
            }));
    }, [quantumOperations]);

    return (
        <div className="w-full h-full overflow-y-auto will-change-transform transform-gpu border border-border rounded-md bg-bg-dark">
            {groupedQuantumOperations.map((group, index) => (
                <section key={group.type}>
                    <div
                        className="sticky top-0 z-10 bg-bg text-text border-b border-border font-semibold text-sm px-4 py-3"
                        style={{
                            borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                        }}
                    >
                        {group.type}
                    </div>

                    <ul className="list-none m-0 p-0">
                        {group.operations.map((operation) => (
                            <li
                                key={operation.name}
                                className="
                                    border-b border-border
                                    last:border-b-0
                                    hover:bg-bg transition-colors
                                    cursor-pointer px-4 py-3"
                                onClick={() => onOperationClick(operation)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 min-w-48px flex justify-center items-center">
                                        <LibraryElement
                                            identifier={operation.symbol}
                                            matrix={operation.inspectorInfo.matrix.display}
                                            onClick={() => onOperationClick(operation)}
                                        />
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-sm text-text mb-2px">{operation.name}</div>
                                        {operation.description && (
                                            <div className="text-xs text-text-muted leading-tight">
                                                {operation.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export default QuantumOperationList;
