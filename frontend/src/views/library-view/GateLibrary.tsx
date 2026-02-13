import {LibraryElement} from "@/views/library-view/LibraryElement.tsx";
import {GateDefinitionResponse} from "@/api/dto/library.ts";

interface GateLibraryProps {
    gates: GateDefinitionResponse[],
    onGateClick: (gate: GateDefinitionResponse) => void,
    setIsGateDragging: (value: boolean) => void,
    setDraggingGateSize: (size: number) => void
}

function GateLibrary({gates, onGateClick, setIsGateDragging, setDraggingGateSize}: Readonly<GateLibraryProps>) {
    return (
        <div className="grid grid-cols-5 gap-4 content-start">
            {gates.map((gate: GateDefinitionResponse) => (
                <LibraryElement
                    key={`${gate.id}`}
                    id={gate.id}
                    symbol={gate.symbol}
                    matrix={gate.inspectorInfo.matrix.display}
                    onClick={() => onGateClick(gate)}
                    setIsGateDragging={setIsGateDragging}
                    setDraggingGateSize={setDraggingGateSize}
                />
            ))}
        </div>
    );
}

export default GateLibrary;