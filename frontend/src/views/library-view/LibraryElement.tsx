import {Badge} from "@/components/ui/badge.tsx";
import {TextIcon} from "@/views/TextIcon.tsx";
import styles from "@/App.module.css";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {BlockMath} from 'react-katex';
import 'katex/dist/katex.min.css';
import {GateType} from '@/api/dto/GateType.ts'
import React from "react";

type LibraryElementProps = {
  id: string;
  type: GateType; // symbol of the QuantumGate or type of the CircuitCell
  onClick?: () => void;
  matrix?: string;
};

export function LibraryElement({id, type, onClick, matrix}: Readonly<LibraryElementProps>) {
    const DELAY_DURATION = 700;

    const Icon = TextIcon(type);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const data = JSON.stringify({ type });
        e.dataTransfer.setData("text/plain", data); // Use text/plain to support Safari
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <Tooltip delayDuration={DELAY_DURATION}>
            <TooltipTrigger asChild>
                <div
                    id={id}
                    onClick={onClick}
                    draggable
                    onDragStart={handleDragStart}
                >
                    <Badge className={styles.libraryElement}>
                        <Icon />
                    </Badge>
                </div>
            </TooltipTrigger>

            <TooltipContent
                side="right"
                className="bg-popover text-popover-foreground border shadow-xl p-3 min-w-[150px] z-[9999]"
            >
                <div className="text-xs text-muted-foreground mb-2 text-center font-semibold">
                    Matrix Representation
                </div>
                <div className="overflow-x-auto flex justify-center">
                    <BlockMath math={matrix} />
                </div>
            </TooltipContent>
        </Tooltip>
    );
}