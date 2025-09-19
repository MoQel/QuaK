import {Badge} from "@/components/ui/badge.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {useDraggable} from "@dnd-kit/core";


export function LibraryElement({id, type}: QuantumGate) {
    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: id,
        data: {
            source: "library",
            type: type
        }
    })
    if (isDragging) {
        return (
            <div ref={setNodeRef}
                 {...attributes}
                 {...listeners}
                 id={id}>
                <Badge className={styles.gate}>
                    {type}
                </Badge>
            </div>
        )
    }
    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
        >
            <Badge className={styles.gate}>
                {type}
            </Badge>
        </div>
    )
}
