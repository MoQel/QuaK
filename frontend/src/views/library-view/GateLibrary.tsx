import {quantumLibraryGates} from "@/views/library-view/InitLibrary.tsx";
import {useDraggable} from "@dnd-kit/core";
import {LibraryElement} from "@/views/library-view/LibraryElement.tsx";
import {horizontalListSortingStrategy, SortableContext} from "@dnd-kit/sortable";

function GateLibrary() {
    const {setNodeRef} = useDraggable({
        id: "library",
    })
    return (
        <div ref={setNodeRef} className="space-x-3 flex">
            <SortableContext items={quantumLibraryGates} strategy={horizontalListSortingStrategy}>
                {quantumLibraryGates.map((gate, index) => (
                    <LibraryElement key={`${gate.type}-${index}`} id={gate.id} type={gate.type}/>
                ))}
            </SortableContext>
        </div>
    )
}

export default GateLibrary;
