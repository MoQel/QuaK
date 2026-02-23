import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import React, { useState } from 'react';
import { moveTab, setDragging } from '@/store/tabs/tabsSlice.ts';
import { cn } from '@/lib/utils.ts';

export function EditorDropZoneSlot({
    targetGroupId,
    label,
    direction,
}: Readonly<{
    targetGroupId: string;
    label: string;
    direction: 'horizontal' | 'vertical';
}>) {
    const dispatch = useAppDispatch();
    const [isOver, setIsOver] = useState(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const tabId = e.dataTransfer?.getData('tabId');
        const sourceGroupId = e.dataTransfer?.getData('groupId');

        if (tabId && sourceGroupId) {
            dispatch(
                moveTab({
                    fromId: tabId,
                    fromGroupId: sourceGroupId,
                    toGroupId: targetGroupId,
                }),
            );
        }
        dispatch(setDragging(false));
    };

    const baseStyle = 'absolute z-50 flex items-center justify-center transition-all duration-200 pointer-events-auto';
    const isOverStyle = () => (isOver ? 'opacity-55 border-primary' : 'opacity-0 hover:opacity-50');

    const dimensionStyle =
        direction === 'horizontal'
            ? cn('top-9 right-0 bottom-0 w-1/2', isOverStyle())
            : cn('left-0 right-0 bottom-0 h-1/2', isOverStyle());

    const dropzoneClass = cn(baseStyle, dimensionStyle, 'bg-bg');

    return (
        <section
            aria-label={label}
            className={dropzoneClass}
            onDragOver={(e) => {
                e.preventDefault();
                setIsOver(true);
            }}
            onDragLeave={() => setIsOver(false)}
            onDrop={handleDrop}
        />
    );
}
