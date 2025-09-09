import {Badge} from "@/components/ui/badge.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {CSS} from "@dnd-kit/utilities";
import {Gate} from "@/views/Gate.tsx";
import {useDraggable} from "@dnd-kit/core";


export function LibraryElement({id, type}: QuantumGate) {
    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: id,
        data: {
            source: "library",
            type: type
        }
    })
    const style = {
        transform: CSS.Transform.toString(transform),
    }
    if (isDragging) {
        return (
            <div ref={setNodeRef}
                 {...attributes}
                 {...listeners}
                 id={id}
                 style={style}>
                <Gate id={id} type={type}/>
            </div>
        )
    }
    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
             style={style}>
            <Badge className={styles.gate}>
                {type}
            </Badge>
        </div>
    )
}
