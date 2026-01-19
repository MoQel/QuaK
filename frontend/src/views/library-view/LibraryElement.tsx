import { Badge } from "@/components/ui/badge.tsx";
import {TextIcon} from "@/views/TextIcon.tsx";
import styles from "@/App.module.css";
import {GateType} from '@/api/dto/GateType.ts'
import React from "react";

type LibraryElementProps = {
    id: string;
    type: GateType;
};

export function LibraryElement({ id, type }: Readonly<LibraryElementProps>) {
    const Icon = TextIcon(type);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const data = JSON.stringify({ type });
        e.dataTransfer.setData("text/plain", data); // Use text/plain to support Safari
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div
            id={id}
            draggable
            onDragStart={handleDragStart}
        >
            <Badge className={styles.libraryElement}>
                <Icon/>
            </Badge>
        </div>
    );
}