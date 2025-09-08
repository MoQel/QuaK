import {Badge} from "@/components/ui/badge.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {Gate} from "@/views/Gate.tsx";


export function LibraryElement({id, type}: QuantumGate) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id})
    const style = {
        transition,
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
