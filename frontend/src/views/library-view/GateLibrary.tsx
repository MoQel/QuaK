import { quantumLibraryGates } from "@/views/library-view/InitLibrary.tsx";
import { useDraggable } from "@dnd-kit/core";
import { LibraryElement } from "@/views/library-view/LibraryElement.tsx";

function GateLibrary() {
    const { setNodeRef } = useDraggable({
        id: "library",
    });

    return (
        <div
            ref={setNodeRef}
            className="grid grid-cols-5 gap-4"
        >
            {quantumLibraryGates.map((gate, index) => (
                <LibraryElement
                    key={`${gate.type}-${index}`}
                    id={gate.id}
                    type={gate.type}
                />
            ))}
        </div>
    );
}

export default GateLibrary;
