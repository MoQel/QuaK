import { LibraryElement } from '@/views/library-view/LibraryElement.tsx';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

interface QuantumOperationLibraryProps {
    quantumOperations: OperationDefinitionResponse[];
    onOperationClick: (operation: OperationDefinitionResponse) => void;
}

function QuantumOperationLibrary({ quantumOperations, onOperationClick }: Readonly<QuantumOperationLibraryProps>) {
    return (
        <div className="grid grid-cols-5 gap-4 content-start">
            {quantumOperations.map((operation: OperationDefinitionResponse) => (
                <LibraryElement
                    key={`${operation.id}`}
                    identifier={operation.symbol}
                    matrix={operation.inspectorInfo.matrix.display}
                    onClick={() => onOperationClick(operation)}
                />
            ))}
        </div>
    );
}

export default QuantumOperationLibrary;
