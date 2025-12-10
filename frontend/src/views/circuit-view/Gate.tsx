import {Badge} from "@/components/ui/badge.tsx";
import {GateIcons, QuantumGate} from "@/views/QuantumGate.tsx";
import styles from "@/App.module.css";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {useContext} from "react";
import {matrixContext} from "@/Context.tsx";


export function Gate({id, type}: QuantumGate) {

    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
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
    const Icon = GateIcons[type]

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData(
            "application/json",
            JSON.stringify({
                source: "circuit_editor",
                id,
                type
            })
        );
    };

    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
             style={style}
             onClick={() => matrix.removeGate(id)}
             draggable
             onDragStart={handleDragStart}
        >
            <Badge className={` ${styles.gate} ${type === 'PLACEHOLDER' ? 'opacity-60' : ''}`}>
                <Icon/>
            </Badge>
        </div>
    )
}
