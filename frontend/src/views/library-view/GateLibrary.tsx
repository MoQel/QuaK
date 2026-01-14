import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.ts";

interface GateLibraryProps {
    gates: QuantumGate[];
    onGateClick: (gate: QuantumGate) => void;
}

function GateLibrary({ gates, onGateClick }: GateLibraryProps) {
    return (
        <div className="grid grid-cols-5 gap-4">
        {gates.map((gate: QuantumGate) => (
                <LibraryElement
                    key={`${gate.id}`}
                    id={gate.id}
                    type={gate.symbol}
                    matrix={gate.inspectorInfo?.matrix?.display}
                    onClick={() => onGateClick(gate)}
                />
            ))}
        </div>
    );
}

export default GateLibrary;