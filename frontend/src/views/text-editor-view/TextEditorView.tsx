import { Card, CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/QLPEditor.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TextEditorTabBar } from '@/views/text-editor-view/TextEditorTabBar.tsx';
import React, { useMemo, useState } from 'react';
import {
    GROUP_BOTTOM,
    GROUP_MAIN,
    GROUP_RIGHT,
    moveTab,
    setActiveGroup,
    setDragging,
} from '@/store/slices/tabsSlice.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useEditorShortcuts } from '@/hooks/editor/useEditorShortcuts.ts';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils.ts';
import { useMonacoGarbageCollector } from '@/hooks/editor/useMonacoGarbageCollector.ts';
import { useEditorCommands } from '@/hooks/editor/useEditorCommands.ts';

export function TextEditorView() {
    const { groups, activeGroupId, isDragging } = useAppSelector((state) => state.tabs);
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const activeTabId = activeGroup?.activeTabId || null;
    useEditorShortcuts(activeTabId);
    useMonacoGarbageCollector();
    useEditorCommands();

    const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
    const hasRightGroup = !!groupMap.get(GROUP_RIGHT);
    const hasBottomGroup = !!groupMap.get(GROUP_BOTTOM);
    const showRightDropZone = isDragging && !hasRightGroup;
    const showBottomDropZone = isDragging && !hasBottomGroup;

    return (
        <Card className="h-full flex flex-col p-0 border-none rounded-none relative">
            {/* Top/Bottom split */}
            <PanelGroup direction="vertical" id="outer-group">
                <Panel
                    id="top-panel-container"
                    order={0}
                    defaultSize={hasBottomGroup ? 50 : 100}
                    minSize={20}
                    className="relative"
                >
                    {/* Inner: Horizontal Split (Left vs Right) */}
                    <PanelGroup direction="horizontal" id="inner-group">
                        {/* LEFT (MAIN) - Always exists */}
                        <Panel id="main-panel" order={0} minSize={20} defaultSize={hasRightGroup ? 50 : 100}>
                            <EditorSlot groupId={GROUP_MAIN} />
                        </Panel>

                        {/* RIGHT - Conditional Render */}
                        {hasRightGroup && (
                            <>
                                <PanelResizeHandle />
                                <Panel id="right-panel" order={1} minSize={20} defaultSize={50}>
                                    <EditorSlot groupId={GROUP_RIGHT} />
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                    {showRightDropZone && (
                        <DropZoneSlot targetGroupId={GROUP_RIGHT} label="Drop to split right" direction="horizontal" />
                    )}
                </Panel>

                {/* BOTTOM - Conditional Render */}
                {hasBottomGroup && (
                    <>
                        <PanelResizeHandle />
                        <Panel id="bottom-panel" order={2} minSize={20} defaultSize={50}>
                            <EditorSlot groupId={GROUP_BOTTOM} />
                        </Panel>
                    </>
                )}
            </PanelGroup>

            {showBottomDropZone && (
                <DropZoneSlot targetGroupId={GROUP_BOTTOM} label="Drop to split bottom" direction="vertical" />
            )}
        </Card>
    );
}

function EditorSlot({ groupId }: Readonly<{ groupId: string }>) {
    const dispatch = useAppDispatch();

    return (
        <div className={'h-full flex flex-col border-r'} onClickCapture={() => dispatch(setActiveGroup(groupId))}>
            <TextEditorTabBar groupId={groupId} />
            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                <QLPEditor groupId={groupId} />
            </CardContent>
        </div>
    );
}

function DropZoneSlot({
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
        <div
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
