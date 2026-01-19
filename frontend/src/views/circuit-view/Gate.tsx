import {Badge} from "@/components/ui/badge.tsx";
import styles from "@/App.module.css";
import {GateResponse} from "@/api/dto/circuit.ts";
import React, {useRef} from 'react'
import {TextIcon} from '@/views/TextIcon.tsx'

interface GateProps extends GateResponse {
    onDragStart?: (id: string) => void;
    onDragEnd?: () => void;
    onDelete?: () => void;
}

export function Gate({ id, definitionId, onDragStart, onDragEnd, onDelete }: GateProps) {
    const Icon = TextIcon(definitionId);
    const isDraggingRef = useRef(false);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        const data = {
            origin: "circuit",
            id: id
        };
        e.dataTransfer.setData("text/plain", JSON.stringify(data)); // Use text/plain to support Safari
        e.dataTransfer.effectAllowed = "move";

        // Timeout of 1 frame to prevent drag cancellation by allowing the browser to
        // capture the "drag image" before React removes the element from the DOM.
        setTimeout(() => {
            onDragStart?.(id);
        }, 0);
    };

    const handleDragEnd = () => {
        onDragEnd?.();

        // Wait 100ms to avoid 'phantom clicks' by browser causing a delete request.
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleClick = () => {
        if (isDraggingRef.current) {
            return;
        }
        onDelete?.();
    };

    return (
        <div
            draggable={definitionId !== 'PLACEHOLDER'}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className="cursor-grab active:cursor-grabbing"
        >
            <Badge className={`${styles.gate} ${definitionId === 'PLACEHOLDER' ? 'opacity-60' : ''}`}>
                <Icon />
            </Badge>
        </div>
    );
}