import {Badge} from "@/components/ui/badge.tsx";
import {GateIcons, QuantumGate} from "@/views/library-view/QuantumGate.tsx";
import styles from "@/App.module.css";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";


export function Gate({id, type}: QuantumGate) {

    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: id,
        data: {
            source: "circuit"
        }
    })
    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }
    const Icon = GateIcons[type]

    if (isDragging) {
        return (
            <div ref={setNodeRef}
                 {...attributes}
                 {...listeners}
                 id={id}
                 style={style}>
                <Badge className={`${styles.gateDragging} ${type === 'DUMMY' ? 'invisible' : ''}`}>
                </Badge>
            </div>
        )
    }
    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
             style={style}
        >
            <Badge className={` ${styles.gate} ${type === 'DUMMY' ? 'invisible' : ''}`}>
                <Icon/>
            </Badge>
        </div>
    )
}
