import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { openTab } from '@/store/tabs/tabsSlice.ts';
import { DragData } from '@/views/circuit-view/util/types.ts';
import { SubcircuitOption } from '@/views/library-view/util/subcircuits.ts';

type LibrarySubcircuitElementProps = {
    option: SubcircuitOption;
};

/**
 * Another circuit of the project as a library tile, dragged onto the wires like any other gate.
 *
 * Shaped like {@link LibraryCompositeElement} on purpose: both stand for one box in the circuit, and
 * from the user's side there is no reason the two should be placed in different ways. What differs
 * is what travels with the drag — a custom gate carries its body, a subcircuit only the id of the
 * circuit it points at, because that body is not loaded here.
 */
export function LibrarySubcircuitElement({ option }: Readonly<LibrarySubcircuitElementProps>) {
    const DELAY_DURATION = 700;

    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const dispatch = useDispatch();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        setIsOpen(false);
        setIsDragging(true);

        const data: DragData = {
            origin: 'library',
            // A subcircuit has no library identifier; the catalogue knows nothing about it.
            operationIdentifier: option.name,
            subcircuit: option,
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';

        // The box covers one wire per qubit of the referenced circuit.
        dispatch(startOperationDrag(Math.max(option.qubitCount, 1)));
    };

    const handleDragEnd = () => {
        setTimeout(() => {
            setIsDragging(false);
            dispatch(stopOperationDrag());
        }, 100);
    };

    const handleOpenChange = (open: boolean) => {
        if (open && isDragging) return;
        setIsOpen(open);
    };

    // Dragging places a call of the subcircuit; opening it is how its contents get edited. Without
    // this an empty subcircuit was a dead end — offered in the library with no way to fill it.
    const handleDoubleClick = () => {
        setIsOpen(false);
        dispatch(openTab({ tab: { id: option.fileId, title: option.name, language: '' } }));
    };

    // Shown, not hidden: an empty circuit is usually one the user is in the middle of building, and
    // making it disappear until the first gate lands would be more confusing than marking it.
    const isEmpty = option.operationCount === 0;

    return (
        <Tooltip delayDuration={DELAY_DURATION} open={isOpen} onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild>
                <div
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={handleDoubleClick}
                    className="
                        group cursor-grab active:cursor-grabbing
                        flex items-center justify-center
                        h-10 w-max min-w-[84px] px-3
                        font-mono font-bold select-none
                        hover:brightness-90 dark:hover:brightness-125 transition-colors"
                    style={{
                        backgroundColor: 'var(--composite)',
                        color: 'var(--bg-dark)',
                        opacity: isEmpty ? 0.55 : 1,
                    }}
                >
                    <span className="whitespace-nowrap text-[11px] leading-none">{option.name}</span>
                </div>
            </TooltipTrigger>

            <TooltipContent side="right" className="bg-bg-light text-text border shadow-xl p-3 max-w-[240px] z-[9999]">
                <div className="font-semibold text-sm mb-1">{option.name}</div>
                <div className="text-xs text-text-muted">
                    {option.qubitCount} qubit{option.qubitCount === 1 ? '' : 's'} ·{' '}
                    {isEmpty ? 'still empty — dropping it in does nothing yet' : 'another circuit of this project'}
                </div>
                <div className="text-xs text-text-muted mt-1">Drag to place it · double-click to edit it</div>
            </TooltipContent>
        </Tooltip>
    );
}
