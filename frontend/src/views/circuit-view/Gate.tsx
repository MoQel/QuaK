import {Badge} from "@/components/ui/badge.tsx";
import styles from "@/App.module.css";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {useContext} from "react";
import {matrixContext} from "@/Context.tsx";
import {TextIcon} from "@/views/TextIcon.tsx"
import {CircuitCell} from "@/App.tsx"

export function Gate({id, type}: CircuitCell) {

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
    const matrix = useContext(matrixContext)
    const Icon = TextIcon(type)

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
             onClick={() => matrix.removeGate(id)}
        >
            <Badge className={` ${styles.gate} ${type === 'DUMMY' ? 'invisible' : ''}`}>
                <Icon/>
            </Badge>
        </div>
    )
}
