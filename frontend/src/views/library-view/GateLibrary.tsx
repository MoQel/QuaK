import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";
import {LibraryGateResponse} from '@/api/dto/library.ts'

interface GateLibraryProps {
    gates: LibraryGateResponse[];
}

function GateLibrary({ gates }: GateLibraryProps) {
    return (
        <div className="grid grid-cols-5 gap-4">
            {gates.map((gate, index) => (
                <LibraryElement
                    key={`${gate.name}-${index}`}
                    id={gate.name}
                    type={gate.symbol}
                />
            ))}
        </div>
    );
}

export default GateLibrary;