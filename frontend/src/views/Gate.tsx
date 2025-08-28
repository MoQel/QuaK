import {Badge} from "@/components/ui/badge.tsx";
import {QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";


export function Gate({id, type}: QuantumGate) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id})
    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }
    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
             style={style}>
            <Badge className={`${styles.gate} ${type === 'DUMMY' ? 'invisible' : ''}`}>
                {type}
            </Badge>
        </div>
    )
}
