import { LibraryElement } from '@/views/library-view/LibraryElement.tsx';
import { LibraryCompositeElement } from '@/views/library-view/LibraryCompositeElement.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';
import { CustomGateTemplate } from '@/views/library-view/util/customGates.ts';
import { LibrarySubcircuitElement } from '@/views/library-view/LibrarySubcircuitElement.tsx';
import { SubcircuitOption } from '@/views/library-view/util/subcircuits.ts';
import { Plus } from 'lucide-react';

interface LibraryBoxViewProps {
    quantumOperations: OperationDefinitionResponse[];
    customGates: CustomGateTemplate[];
    subcircuits: SubcircuitOption[];
    onOperationClick: (operation: OperationDefinitionResponse) => void;
    /** Absent outside a project, where there is nothing to build a subcircuit from. */
    onNewSubcircuit?: () => void;
}

/**
 * The gates that can be dragged into a circuit, built-in and user-defined together.
 *
 * They flow rather than sitting in a fixed grid of columns: a built-in is a 40px square holding a
 * symbol, while a custom gate is as wide as its name -- squeezed into a built-in's cell every one
 * of them read as `b…`, `d…`, `r…` and they were indistinguishable. Flowing lets both keep the
 * width they need, and at the panel's usual size the built-ins still land five to a row.
 */
function LibraryBoxView({
    quantumOperations,
    customGates,
    subcircuits,
    onOperationClick,
    onNewSubcircuit,
}: Readonly<LibraryBoxViewProps>) {
    return (
        <div className="flex flex-wrap gap-4 content-start">
            {quantumOperations.map((operation: OperationDefinitionResponse) => (
                <LibraryElement
                    key={`${operation.id}`}
                    identifier={operation.symbol}
                    matrix={operation.inspectorInfo.matrix.display}
                    onClick={() => onOperationClick(operation)}
                />
            ))}

            {customGates.map((gate) => (
                <LibraryCompositeElement key={gate.key} gate={gate} />
            ))}

            {subcircuits.map((option) => (
                <LibrarySubcircuitElement key={option.circuitId} option={option} />
            ))}

            {/* The one thing here that is not a gate: it makes a new one. As a tile it stays with
                what it produces instead of needing a section of its own. */}
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
        </div>
    );
}

export default LibraryBoxView;
