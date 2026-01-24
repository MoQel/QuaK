import { Badge } from '@/components/ui/badge.tsx';
import { TextIcon } from '@/views/TextIcon.tsx';
import styles from '@/App.module.css';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import React, { useState } from 'react'; //
import { GateDefinitionIdentifier } from '@/api/dto/GateDefinitionIdentifier.ts';

type LibraryElementProps = {
    id: GateDefinitionIdentifier;
    symbol: string;
    onClick?: () => void;
    matrix: string;
};

export function LibraryElement({ id, symbol, onClick, matrix }: Readonly<LibraryElementProps>) {
    const DELAY_DURATION = 700;
    const Icon = TextIcon(symbol);

    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        setIsOpen(false);
        setIsDragging(true);

        const data = {
            origin: 'library',
            id: id,
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragEnd = () => {
        // Wait 100ms to avoid opening tooltip after dragging.
        setTimeout(() => {
            setIsDragging(false);
        }, 100);
    };

    const handleOpenChange = (open: boolean) => {
        if (open && isDragging) {
            return;
        }
        setIsOpen(open);
    };

    return (
        <Tooltip delayDuration={DELAY_DURATION} open={isOpen} onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild>
                <div
                    id={id}
                    onClick={onClick}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="group cursor-grab active:cursor-grabbing"
                >
                    <Badge className={styles.libraryElement}>
                        <Icon />
                    </Badge>
                </div>
            </TooltipTrigger>

            <TooltipContent
                side="right"
                className="bg-bg-light text-text border shadow-xl p-3 min-w-[150px] z-[9999]"
            >
                <div className="text-xs text-text-muted mb-2 text-center font-semibold">
                    Matrix Representation
                </div>
                <div className="overflow-x-auto flex justify-center">
                    <BlockMath math={matrix} />
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
