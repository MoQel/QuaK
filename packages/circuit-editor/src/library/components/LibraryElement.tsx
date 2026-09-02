import styles from '../../circuit-editor.module.css';
import { Tooltip, TooltipContent, TooltipTrigger } from '@quak/ui/tooltip';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import React, { useState } from 'react';
import { getOperationDefinition, OperationIdentifier } from '../../operations.ts';
import { DragData } from '../../types.ts';
import { TextIcon } from '@quak/ui/text-icon';
import { useCircuitDrag } from '../../CircuitDragContext.tsx';

type LibraryElementProps = {
    identifier: OperationIdentifier;
    onClick?: () => void;
    matrix: string;
};

export function LibraryElement({ identifier, onClick, matrix }: Readonly<LibraryElementProps>) {
    const definition = getOperationDefinition(identifier);
    const DELAY_DURATION = 700;
    const isClickable = onClick !== undefined;

    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const { startOperationDrag, stopOperationDrag } = useCircuitDrag();

    let icon: React.ReactNode;

    if (definition.icon.type === 'component' && identifier === 'MEASURE') {
        const ComponentIcon = definition.icon.component;
        icon = <ComponentIcon className="size-4 stroke-4" />;
    } else {
        icon = <TextIcon text={identifier} />;
    }

    const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
        setIsOpen(false);
        setIsDragging(true);

        const data: DragData = {
            origin: 'library',
            operationIdentifier: identifier,
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';

        startOperationDrag(definition.totalSize);
    };

    const handleDragEnd = () => {
        // Wait 100ms to avoid opening tooltip after dragging.
        setTimeout(() => {
            setIsDragging(false);
            stopOperationDrag();
        }, 100);
    };

    const handleOpenChange = (open: boolean) => {
        if (open && isDragging) {
            return;
        }
        setIsOpen(open);
    };

    const elementProps = {
        id: identifier.toLowerCase(),
        draggable: identifier !== 'MEASURE', // Disable Measurement Operation, as it is currently not working.
        onDragStart: identifier === 'MEASURE' ? undefined : handleDragStart,
        onDragEnd: identifier === 'MEASURE' ? undefined : handleDragEnd,
        className: `
            group ${identifier === 'MEASURE' ? '' : 'cursor-grab active:cursor-grabbing'}
            flex items-center justify-center
            hover:brightness-90 dark:hover:brightness-125 transition-colors
            ${styles.libraryElement}`,
        style: { backgroundColor: definition.color, color: 'var(--bg-dark)' },
    };

    return (
        <Tooltip delayDuration={DELAY_DURATION} open={isOpen} onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild>
                {isClickable ? (
                    <button type="button" onClick={onClick} {...elementProps}>
                        {icon}
                    </button>
                ) : (
                    <div {...elementProps}>{icon}</div>
                )}
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
