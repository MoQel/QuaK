import { Card } from '@/components/ui/card.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useMemo } from 'react';
import { GROUP_BOTTOM, GROUP_MAIN, GROUP_RIGHT } from '@/store/tabs/tabsSlice.ts';
import { useEditorShortcuts } from '@/hooks/editor/useEditorShortcuts.ts';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useMonacoGarbageCollector } from '@/hooks/editor/useMonacoGarbageCollector.ts';
import { useEditorCommands } from '@/hooks/editor/useEditorCommands.ts';
import { EditorDropZoneSlot } from '@/views/text-editor-view/components/layout/EditorDropZoneSlot.tsx';
import { EditorSlot } from '@/views/text-editor-view/components/layout/EditorSlot.tsx';
import { UnsavedChangesAlertDialog } from '@/views/text-editor-view/components/utils/UnsavedChangesAlertDialog.tsx';
import { useLSPSetup } from '@/hooks/editor/useLSPSetup.ts';

export function TextEditorView() {
    const { groups, activeGroupId, isDragging } = useAppSelector((state) => state.tabs);
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const activeTabId = activeGroup?.activeTabId || null;
    useEditorShortcuts(activeTabId, activeGroupId);
    useMonacoGarbageCollector();
    useEditorCommands();
    useLSPSetup();

    const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
    const hasRightGroup = !!groupMap.get(GROUP_RIGHT);
    const hasBottomGroup = !!groupMap.get(GROUP_BOTTOM);
    const showRightDropZone = isDragging && !hasRightGroup;
    const showBottomDropZone = isDragging && !hasBottomGroup;

    return (
        <Card className="h-full flex flex-col p-0 border-none rounded-none relative bg-bg-subtle">
            <UnsavedChangesAlertDialog />
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
                                <Panel
                                    id="right-panel"
                                    order={1}
                                    minSize={20}
                                    defaultSize={50}
                                    className="border-l border-border"
                                >
                                    <EditorSlot groupId={GROUP_RIGHT} />
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                    {showRightDropZone && (
                        <EditorDropZoneSlot
                            targetGroupId={GROUP_RIGHT}
                            label="Drop to split right"
                            direction="horizontal"
                        />
                    )}
                </Panel>

                {/* BOTTOM - Conditional Render */}
                {hasBottomGroup && (
                    <>
                        <PanelResizeHandle />
                        <Panel
                            id="bottom-panel"
                            order={2}
                            minSize={20}
                            defaultSize={50}
                            className="border-t border-border"
                        >
                            <EditorSlot groupId={GROUP_BOTTOM} />
                        </Panel>
                    </>
                )}
            </PanelGroup>

            {showBottomDropZone && (
                <EditorDropZoneSlot targetGroupId={GROUP_BOTTOM} label="Drop to split bottom" direction="vertical" />
            )}
        </Card>
    );
}
