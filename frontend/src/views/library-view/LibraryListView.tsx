import { LibraryElement } from '@/views/library-view/LibraryElement.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

interface LibraryListViewProps {
    quantumOperations: OperationDefinitionResponse[];
    onOperationClick: (operation: OperationDefinitionResponse) => void;
}

function LibraryListView({ quantumOperations, onOperationClick }: Readonly<LibraryListViewProps>) {
    return (
        <div className="w-full h-full overflow-y-auto will-change-transform transform-gpu border border-border rounded-md bg-bg-dark">
            <ul className="list-none m-0 p-0">
                {quantumOperations.map((operation, index) => {
                    const isNewCategory = index === 0 || quantumOperations[index - 1].category !== operation.category;

                    return (
                        <>
                            {isNewCategory && (
                                <div
                                    key={operation.category}
                                    className="sticky top-0 z-10 bg-bg text-text border-b border-border font-semibold text-sm px-4 py-3"
                                    style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border)' }}
                                >
                                    {operation.category}
                                </div>
                            )}
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
                        </>
                    );
                })}
            </ul>
        </div>
    );
}

export default LibraryListView;
