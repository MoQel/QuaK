import React from 'react';
import { LibraryElement } from '@/views/library-view/LibraryElement.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';
import { SubcircuitOption } from '@/views/library-view/util/subcircuits.ts';
import { LibrarySubcircuitElement } from '@/views/library-view/LibrarySubcircuitElement.tsx';
import { CustomGateTemplate } from '@/views/library-view/util/customGates.ts';
import { LibraryCompositeElement } from '@/views/library-view/LibraryCompositeElement.tsx';
import { useDispatch } from 'react-redux';
import { openTab } from '@/store/tabs/tabsSlice.ts';

interface LibraryListViewProps {
    quantumOperations: OperationDefinitionResponse[];
    customGates?: CustomGateTemplate[];
    subcircuits?: SubcircuitOption[];
    onOperationClick: (operation: OperationDefinitionResponse) => void;
    onRemoveSubcircuit?: (option: SubcircuitOption) => void;
}

function LibraryListView({
    quantumOperations,
    customGates,
    subcircuits,
    onOperationClick,
    onRemoveSubcircuit,
}: Readonly<LibraryListViewProps>) {
    const dispatch = useDispatch();
    return (
        <div className="w-full h-full overflow-y-auto will-change-transform transform-gpu border border-border rounded-md bg-bg-dark">
            <ul className="list-none m-0 p-0">
                {quantumOperations.map((operation, index) => {
                    const isNewCategory = index === 0 || quantumOperations[index - 1].category !== operation.category;

                    return (
                        <React.Fragment key={operation.id || operation.name}>
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
                        </React.Fragment>
                    );
                })}

                {customGates && customGates.length > 0 && (
                    <>
                        <div
                            className="sticky top-0 z-10 bg-bg text-text border-b border-border font-semibold text-sm px-4 py-3"
                            style={{ borderTop: '1px solid var(--border)' }}
                        >
                            Compositions
                        </div>
                        {customGates.map((gate) => {
                            const contents = (gate.template.body ?? []).map((part) => part.identifier).join(', ');
                            return (
                                <li
                                    key={gate.key}
                                    className="
                                        border-b border-border
                                        last:border-b-0
                                        hover:bg-bg transition-colors
                                        cursor-pointer px-4 py-3"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-auto flex justify-center items-center">
                                            <LibraryCompositeElement gate={gate} />
                                        </div>

                                        <div className="text-left">
                                            <div className="font-semibold text-sm text-text mb-2px">{gate.name}</div>
                                            <div className="text-xs text-text-muted leading-tight">
                                                {gate.portLabels.length} qubit{gate.portLabels.length === 1 ? '' : 's'}
                                                {contents ? ` · ${contents}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </>
                )}

                {subcircuits && subcircuits.length > 0 && (
                    <>
                        <div
                            className="sticky top-0 z-10 bg-bg text-text border-b border-border font-semibold text-sm px-4 py-3"
                            style={{ borderTop: '1px solid var(--border)' }}
                        >
                            Subcircuits
                        </div>
                        {subcircuits.map((option) => (
                            <li
                                key={option.circuitId}
                                className="
                                    border-b border-border
                                    last:border-b-0
                                    hover:bg-bg transition-colors
                                    cursor-pointer px-4 py-3"
                                onDoubleClick={() =>
                                    dispatch(openTab({ tab: { id: option.fileId, title: option.name, language: '' } }))
                                }
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-auto flex justify-center items-center">
                                        <LibrarySubcircuitElement
                                            option={option}
                                            onRemove={onRemoveSubcircuit ? () => onRemoveSubcircuit(option) : undefined}
                                        />
                                    </div>

                                    <div className="text-left">
                                        <div className="font-semibold text-sm text-text mb-2px">{option.name}</div>
                                        <div className="text-xs text-text-muted leading-tight">
                                            {option.qubitCount} qubit{option.qubitCount === 1 ? '' : 's'} ·{' '}
                                            {option.operationCount === 0
                                                ? 'empty circuit'
                                                : `${option.operationCount} operation${option.operationCount === 1 ? '' : 's'}`}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </>
                )}
            </ul>
        </div>
    );
}

export default LibraryListView;
