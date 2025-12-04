import {Badge} from "@/components/ui/badge.tsx";
import {TextIcon} from "@/views/TextIcon.tsx"
import styles from "@/App.module.css";
import {useDraggable} from "@dnd-kit/core";

type LibraryElementProps = {
  id: string;
  type: string; // symbol of the QuantumGate or type of the CircuitCell
};

export function LibraryElement({id, type}: LibraryElementProps) {
    const {attributes, listeners, setNodeRef} = useDraggable({
        id: id,
        data: {
            source: "library",
            type: type
        }
    })
    const Icon = TextIcon(type);

    return (
        <div ref={setNodeRef}
             {...attributes}
             {...listeners}
             id={id}
        >
            <Badge className={styles.library}>
                <Icon/>
            </Badge>
        </div>
    )
}
