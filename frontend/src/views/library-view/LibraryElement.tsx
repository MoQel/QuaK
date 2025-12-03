import { Badge } from "@/components/ui/badge.tsx";
import { GateIcons, QuantumGate } from "@/views/QuantumGate.tsx";
import styles from "@/App.module.css";

export function LibraryElement({ id, type }: Readonly<QuantumGate>) {
    const Icon = GateIcons[type];

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData(
            "application/json",
            JSON.stringify({
                source: "library",
                id,
                type
            })
        );

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