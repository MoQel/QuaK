import styles from '@/App.module.css';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { DragData } from '@/views/circuit-view/util/types.ts';
import { CustomGateTemplate } from '@/views/library-view/util/customGates.ts';

type LibraryCompositeElementProps = {
    gate: CustomGateTemplate;
};

/**
 * A user-defined gate as a library tile.
 *
 * Deliberately not a variant of {@link LibraryElement}: that one is built around a built-in's
 * identifier, its icon and its matrix, and a custom gate has none of the three. What it has instead
 * is a name, a parameter list and a body, so the tile shows the name and the tooltip the signature.
 */
export function LibraryCompositeElement({ gate }: Readonly<LibraryCompositeElementProps>) {
    const DELAY_DURATION = 700;

    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const dispatch = useDispatch();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        setIsOpen(false);
        setIsDragging(true);

        const data: DragData = {
            origin: 'library',
            operationIdentifier: gate.name,
            // The catalogue cannot supply this gate, so the template travels along.
            composite: gate.template,
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';

        // Every parameter takes a wire, including one the body never touches: the box spans them all.
        dispatch(startOperationDrag(gate.template.targetQubits.length));
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

    const contents = (gate.template.body ?? []).map((part) => part.identifier).join(', ');

    return (
        <Tooltip delayDuration={DELAY_DURATION} open={isOpen} onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild>
                <div
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className={`
                        group cursor-grab active:cursor-grabbing
                        flex items-center justify-center
                        hover:brightness-90 dark:hover:brightness-125 transition-colors
                        ${styles.libraryElement}`}
                    style={{ backgroundColor: 'var(--composite)', color: 'var(--bg-dark)' }}
                >
                    {/* A gate name is arbitrarily long and the tile is 40px, so it is cut here and
                        spelled out in the tooltip rather than pushing the grid out of shape. */}
                    <span className="truncate text-[11px] font-semibold leading-none">{gate.label}</span>
                </div>
            </TooltipTrigger>

            <TooltipContent side="right" className="bg-bg-light text-text border shadow-xl p-3 max-w-[240px] z-[9999]">
                <div className="font-semibold text-sm mb-1">
                    {gate.name} ({gate.portLabels.join(', ')})
                </div>
                <div className="text-xs text-text-muted">
                    {gate.portLabels.length} qubit{gate.portLabels.length === 1 ? '' : 's'}
                    {contents && <> · {contents}</>}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
