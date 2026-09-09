import styles from '@/App.module.css';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { getOperationDefinition, OperationIdentifier } from '@/lib/operations.ts';
import { DragData } from '@/views/circuit-view/util/types.ts';
import { TextIcon } from '@/components/ui/text-icon.tsx';

type LibraryElementProps = {
    identifier: OperationIdentifier;
    onClick?: () => void;
    matrix: string;
};

export function LibraryElement({ identifier, onClick, matrix }: Readonly<LibraryElementProps>) {
    const definition = getOperationDefinition(identifier);
    const DELAY_DURATION = 700;

    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const dispatch = useDispatch();

    let icon: React.ReactNode;

    if (definition.icon.type === 'component' && identifier === 'MEASURE') {
        const ComponentIcon = definition.icon.component;
        icon = <ComponentIcon className="size-4 stroke-4" />;
    } else {
        const TextIconComponent = TextIcon(identifier);
        icon = <TextIconComponent />;
    }

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        setIsOpen(false);
        setIsDragging(true);

        const data: DragData = {
            origin: 'library',
            operationIdentifier: identifier,
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';

        dispatch(startOperationDrag(definition.totalSize));
    };

    const handleDragEnd = () => {
        // Wait 100ms to avoid opening tooltip after dragging.
        setTimeout(() => {
            setIsDragging(false);
            dispatch(stopOperationDrag());
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
                    id={identifier.toLowerCase()}
                    onClick={onClick}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className={`
                        group cursor-grab active:cursor-grabbing
                        flex items-center justify-center
                        hover:brightness-90 dark:hover:brightness-125 transition-colors
                        ${styles.libraryElement}`}
                    style={{ backgroundColor: definition.color, color: 'var(--bg-dark)' }}
                >
                    {icon}
                </div>
            </TooltipTrigger>

            <TooltipContent side="right" className="bg-bg-light text-text border shadow-xl p-3 min-w-[150px] z-[9999]">
                <div className="text-xs text-text-muted mb-2 text-center font-semibold">Matrix Representation</div>
                <div className="overflow-x-auto flex justify-center">
                    <BlockMath math={matrix} />
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
