import React, { useEffect, useRef, useState, ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
}

interface GenericTabBarProps<T extends TabItem> {
    groupId: string;
    tabs: T[];
    activeTabId: string | null;
    onReorder: (fromId: string, toId: string) => void;
    onMoveExternal?: (tabId: string, sourceGroupId: string, targetTabId?: string) => void;
    onTabClick: (tab: T) => void;
    children: (tab: T, isActive: boolean) => ReactNode;
    className?: string;
    onDragStateChange?: (isDragging: boolean) => void;
}

export function GenericTabBar<T extends TabItem>({
    groupId,
    tabs,
    activeTabId,
    onReorder,
    onMoveExternal,
    onTabClick,
    children,
    className,
    onDragStateChange,
}: Readonly<GenericTabBarProps<T>>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [isOverContainer, setIsOverContainer] = useState(false);
    const [dropPlaceholderIndex, setDropPlaceholderIndex] = useState<number | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    useEffect(() => {
        if (!activeTabId || !tabRefs.current[activeTabId]) return;
        tabRefs.current[activeTabId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    }, [activeTabId, tabs]);

    // region internal drag & drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggingId(id);
        onDragStateChange?.(true);
        e.stopPropagation();
        e.dataTransfer.setData('tabId', id);
        e.dataTransfer.setData('groupId', groupId);
        e.dataTransfer.effectAllowed = 'move';
    };

    // live reordering
    const handleDragEnter = (targetId: string) => {
        if (draggingId && draggingId !== targetId) {
            onReorder(draggingId, targetId);
        }
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        onDragStateChange?.(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };
    // endregion

    // region external drag & drop
    const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        // If we are dragging internally, ignore placeholder logic (handled by live reorder)
        if (draggingId) return;
        setIsOverContainer(true);

        if (!containerRef.current) return;

        const tabElements = Array.from(containerRef.current.children).filter(
            (child) => child.getAttribute('role') === 'tab',
        ) as HTMLElement[];

        let foundIndex = tabs.length;

        for (let i = 0; i < tabElements.length; i++) {
            const rect = tabElements[i].getBoundingClientRect();
            const tabCenterX = rect.left + rect.width / 2;

            if (e.clientX < tabCenterX) {
                foundIndex = i;
                break;
            }
        }

        setDropPlaceholderIndex(foundIndex);
    };

    const handleContainerDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
            setIsOverContainer(false);
            setDropPlaceholderIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverContainer(false);
        setDropPlaceholderIndex(null);

        const tabId = e.dataTransfer.getData('tabId');
        const sourceGroupId = e.dataTransfer.getData('groupId');

        if (!tabId || !sourceGroupId) return;

        setDraggingId(null);
        onDragStateChange?.(false);

        if (sourceGroupId === groupId) return;

        let targetTabId: string | undefined = undefined;

        if (dropPlaceholderIndex !== null && dropPlaceholderIndex < tabs.length) {
            targetTabId = tabs[dropPlaceholderIndex].id;
        }

        onMoveExternal?.(tabId, sourceGroupId, targetTabId);
    };

    // Keyboard support for A11Y
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, tab: T) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTabClick(tab);
        }
    };

    useEffect(() => {
        if (draggingId && !tabs.some((t) => t.id === draggingId)) {
            setDraggingId(null);
            onDragStateChange?.(false);
        }
    }, [tabs, draggingId, onDragStateChange]);
    // endregion

    return (
        <div className={cn('flex w-full flex-col', className)}>
            <div
                ref={containerRef}
                role="tablist"
                aria-orientation="horizontal"
                onDragOver={handleContainerDragOver}
                onDragLeave={handleContainerDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'flex w-full flex-row border-b border-border bg-bg-light scrollbar-hide',
                    'overflow-x-auto tabs-scrollbar scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
                    isOverContainer ? 'bg-bg-light-hover' : '',
                )}
                tabIndex={-1}
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const isDragging = tab.id === draggingId;

                    return (
                        <div
                            role="tab"
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            key={tab.id}
                            data-tab-id={tab.id}
                            ref={(el) => {
                                tabRefs.current[tab.id] = el;
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, tab.id)}
                            onDragEnter={() => handleDragEnter(tab.id)}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onClick={() => onTabClick(tab)}
                            onKeyDown={(e) => handleKeyDown(e, tab)}
                            className={cn(
                                'h-9 flex-shrink-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                                isDragging ? 'opacity-20' : 'opacity-100',
                            )}
                        >
                            {children(tab, isActive)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
