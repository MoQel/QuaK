import { useEffect, useRef, useState, DragEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
}

interface GenericTabBarProps<T extends TabItem> {
    tabs: T[];
    activeTabId: string | null;
    onReorder: (fromId: string, toId: string) => void;
    children: (tab: T, isActive: boolean) => ReactNode;
    className?: string;
}

export function GenericTabBar<T extends TabItem>({
    tabs,
    activeTabId,
    onReorder,
    children,
    className,
}: Readonly<GenericTabBarProps<T>>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Scroll active tab into view when it changes
    useEffect(() => {
        if (!activeTabId || !tabRefs.current[activeTabId]) return;

        tabRefs.current[activeTabId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    }, [activeTabId, tabs]);

    // region Drag and Drop Logic
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (targetId: string) => {
        if (draggingId && draggingId !== targetId) {
            onReorder(draggingId, targetId);
        }
    };

    const handleDragEnd = () => {
        setDraggingId(null);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    // endregion

    return (
        <div className={cn('flex w-full flex-col', className)}>
            <div
                ref={containerRef}
                className="flex w-full flex-row overflow-x-auto border-b border-border bg-bg-light scrollbar-hide"
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const isDragging = tab.id === draggingId;

                    return (
                        <div
                            role="tab"
                            key={tab.id}
                            ref={(el) => {
                                tabRefs.current[tab.id] = el;
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, tab.id)}
                            onDragEnter={() => handleDragEnter(tab.id)}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                'h-9 flex-shrink-0 transition-all duration-200',
                                isDragging ? 'opacity-20' : 'opacity-100',
                            )}
                        >
                            {/* Delegate the rendering to the parent */}
                            {children(tab, isActive)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
