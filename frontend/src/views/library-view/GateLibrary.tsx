import {quantumLibraryGates} from "@/views/library-view/QuantumGates.tsx";
import {useDroppable} from "@dnd-kit/core";
import {LibraryElement} from "@/views/library-view/LibraryElement.tsx";


function GateLibrary() {
    const {setNodeRef} = useDroppable({
        id: "library",
    })
    return (
        <div ref={setNodeRef} className="space-x-3 flex">
            {quantumLibraryGates.map((gate, index) => (
                <LibraryElement key={`${gate.type}-${index}`} id={gate.id} type={gate.type}/>
            ))}

        </div>
    )
}

export default GateLibrary;
