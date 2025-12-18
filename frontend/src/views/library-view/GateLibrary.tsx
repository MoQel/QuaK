import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import {QuantumGate} from "@/views/QuantumGate.tsx";

interface GateLibraryProps {
    gates: QuantumGate[];
}

function GateLibrary({ gates }: GateLibraryProps) {
    return (
        <div className="grid grid-cols-5 gap-4">
            {gates.map((gate, index) => (
                <LibraryElement
                    key={`${gate.name}-${index}`}
                    id={gate.name}
                    type={gate.symbol} // Nutzung des Symbols für die Darstellung
                />
            ))}
        </div>
    );
}

export default GateLibrary;