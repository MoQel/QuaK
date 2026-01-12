import { Badge } from "@/components/ui/badge.tsx";
import {TextIcon} from "@/views/TextIcon.tsx";
import styles from "@/App.module.css";
import {GateType} from '@/api/dto/circuit.ts'

type LibraryElementProps = {
    id: string;
    type: GateType; // symbol of the QuantumGate or type of the CircuitCell
};

export function LibraryElement({ id, type }: Readonly<LibraryElementProps>) {
    const Icon = TextIcon(type);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ type }));
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div
            id={id}
            draggable
            onDragStart={handleDragStart}
        >
            <Badge className={styles.library}>
                <Icon/>
            </Badge>
        </div>
    );
}