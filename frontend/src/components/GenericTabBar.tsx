import React, { useEffect, useRef, useState, ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { GhostTab } from '@/components/GhostTab.tsx';

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
    const tabPositionsRef = useRef<{ left: number; width: number }[]>([]);

    const measureTabs = () => {
        if (!containerRef.current) return;

        const children = Array.from(containerRef.current.querySelectorAll('[role="tab"]'));

        tabPositionsRef.current = children.map((el) => {
            const rect = el.getBoundingClientRect();
            return { left: rect.left, width: rect.width };
        });
    };

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
        setIsOverContainer(false);
        setDropPlaceholderIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };
    // endregion

    // region external drag & drop
    const updateDropIndex = (e: React.DragEvent) => {
        const positions = tabPositionsRef.current;
        if (!positions.length) return;

        const mouseX = e.clientX;

        let newIndex = positions.length;

        for (let i = 0; i < positions.length; i++) {
            const mid = positions[i].left + positions[i].width / 2;
            if (mouseX < mid) {
                newIndex = i;
                break;
            }
        }

        setDropPlaceholderIndex((prev) => (prev === newIndex ? prev : newIndex));
    };

    const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (draggingId) return;
        if (!isOverContainer) {
            measureTabs();
        }
        setIsOverContainer(true);

        updateDropIndex(e);
    };

    const handleContainerDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsOverContainer(false);
            setDropPlaceholderIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverContainer(false);
        setDropPlaceholderIndex(null);
        setDraggingId(null);
        onDragStateChange?.(false);

        const tabId = e.dataTransfer.getData('tabId');
        const sourceGroupId = e.dataTransfer.getData('groupId');

        if (!tabId || !sourceGroupId) return;
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
        <div className={cn('relative flex w-full flex-col', className)}>
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
                )}
                tabIndex={-1}
            >
                {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTabId;
                    const isDragging = tab.id === draggingId;
                    const showPlaceholder = isOverContainer && !draggingId && dropPlaceholderIndex === index;

                    return (
                        <React.Fragment key={tab.id}>
                            {showPlaceholder && <GhostTab />}

                            <div
                                role="tab"
                                aria-selected={isActive}
                                tabIndex={isActive ? 0 : -1}
                                data-tab-id={tab.id}
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                draggable
                                onDragStart={(e) => handleDragStart(e, tab.id)}
                                onDragEnter={() => handleDragEnter(tab.id)}
                                onDragOver={(e) => {
                                    if (draggingId) handleDragOver(e);
                                }}
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
                        </React.Fragment>
                    );
                })}

                {/* Drop at the end */}
                {isOverContainer && !draggingId && dropPlaceholderIndex === tabs.length && <GhostTab />}
            </div>
        </div>
    );
}
