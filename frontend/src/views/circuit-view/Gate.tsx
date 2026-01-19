import {Badge} from "@/components/ui/badge.tsx";
import styles from "@/App.module.css";
import {CircuitGateResponse} from "@/api/dto/circuit.ts";
import React, {useRef} from 'react'
import {TextIcon} from '@/views/TextIcon.tsx'

interface GateProps extends CircuitGateResponse {
    onDragStart?: (id: string) => void;
    onDragEnd?: () => void;
    onDelete?: () => void;
}

export function Gate({ id, type, onDragStart, onDragEnd, onDelete }: GateProps) {
    const Icon = TextIcon(type);
    const isDraggingRef = useRef(false);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        const data = JSON.stringify({ id });
        e.dataTransfer.setData("text/plain", data);
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
            draggable={type !== 'PLACEHOLDER'}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className="cursor-grab active:cursor-grabbing"
        >
            <Badge className={`${styles.gate} ${type === 'PLACEHOLDER' ? 'opacity-60' : ''}`}>
                <Icon />
            </Badge>
        </div>
    );
}