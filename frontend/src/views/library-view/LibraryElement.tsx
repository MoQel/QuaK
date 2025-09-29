import {Badge} from "@/components/ui/badge.tsx";
import {QuantumGate} from "@/views/circuit-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {useDraggable} from "@dnd-kit/core";


export function LibraryElement({id, type}: QuantumGate) {
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
        data: {
            source: "library",
            type: type
        }
    })

    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
        >
            <Badge className={styles.library}>
                {type}
            </Badge>
        </div>
    )
}
