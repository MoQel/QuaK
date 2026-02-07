import { Card, CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/QLPEditor.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TabBar } from '@/views/text-editor-view/TabBar.tsx';
import React, { useEffect } from 'react';
import { closeAll, setActiveGroup } from '@/store/slices/tabsSlice.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useEditorShortcuts } from '@/hooks/editor/useEditorShortcuts.ts';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function TextEditorView() {
    const { groups, activeGroupId } = useAppSelector((state) => state.tabs);
    const dispatch = useAppDispatch();
    const activeGroup = groups.find((g) => g.id === activeGroupId);
    const activeTabId = activeGroup?.activeTabId || null;
    useEditorShortcuts(activeTabId);

    // Cleanup close all tabs
    useEffect(() => {
        return () => {
            dispatch(closeAll());
        };
    }, [dispatch]);

    return (
        <Card className="h-full flex flex-col p-0 border-none rounded-none">
            <PanelGroup direction="horizontal">
                {groups.map((group, index) => (
                    <React.Fragment key={group.id}>
                        <Panel minSize={20} defaultSize={100 / groups.length}>
                            <div
                                className={`h-full flex flex-col border-r`}
                                // className={`h-full flex flex-col border-r ${activeGroupId === group.id ? 'ring-1 ring-blue-500 ring-inset' : ''}`}
                                onClickCapture={() => {
                                    if (activeGroupId !== group.id) {
                                        dispatch(setActiveGroup(group.id));
                                    }
                                }}
                            >
                                <TabBar groupId={group.id} />

                                <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                                    <QLPEditor groupId={group.id} />
                                </CardContent>
                            </div>
                        </Panel>
                        {index < groups.length - 1 && (
                            <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors cursor-col-resize" />
                        )}
                    </React.Fragment>
                ))}
            </PanelGroup>
        </Card>
    );
}
