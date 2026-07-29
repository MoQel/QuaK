import { TabBar } from '@/components/TabBar.tsx';
import { EditorTabLabel } from '@/views/text-editor-view/components/tabs/EditorTabLabel.tsx';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { moveTab, setActiveTab, setDragging } from '@/store/tabs/tabsSlice.ts';
import { safeCloseAll, safeCloseOthers, safeCloseTab } from '@/store/tabs/tabsThunks.ts';
import { usePanelData } from '@/contexts/panel/PanelDataContext.ts';
import { canInspectWithDirac } from '@/views/inspector-view/diracInspect.ts';

/**
 * Renders the shared file tabs for the circuit panel.
 *
 * Supports Dirac inspection, closing and reordering, but omits editor-specific
 * split and group actions.
 */
export function CircuitTabBar() {
    const dispatch = useAppDispatch();
    const { setSelectedOperation } = usePanelData();
    const activeGroupId = useAppSelector((state) => state.tabs.activeGroupId);
    const group = useAppSelector((state) => state.tabs.groups.find((candidate) => candidate.id === activeGroupId));
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);

    if (!group || group.openTabs.length === 0) return null;
    const groupId = group.id;

    // Activate the circuit and clear the selected gate to show the default Dirac inspection.
    const inspectWithDirac = (tabId: string) => {
        dispatch(setActiveTab({ tabId, groupId }));
        setSelectedOperation(undefined);
    };

    return (
        <TabBar
            groupId={groupId}
            tabs={group.openTabs}
            activeTabId={group.activeTabId}
            onDragStateChange={(isDragging) => dispatch(setDragging(isDragging))}
            onReorder={(fromId, toId) => dispatch(moveTab({ fromId, fromGroupId: groupId, toId, toGroupId: groupId }))}
            onTabClick={(tab) => dispatch(setActiveTab({ tabId: tab.id, groupId }))}
        >
            {(tab, isActive) => (
                <ContextMenu>
                    <ContextMenuTrigger className="h-full" asChild>
                        <EditorTabLabel
                            tab={tab}
                            isActive={isActive}
                            isDirty={dirtyFiles.includes(tab.id)}
                            isThisGroupFocused={true}
                            onClose={() => dispatch(safeCloseTab({ tabId: tab.id, groupId }))}
                        />
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                        {canInspectWithDirac(tab.title) && (
                            <>
                                <ContextMenuItem onClick={() => inspectWithDirac(tab.id)}>
                                    Inspect with Dirac
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                            </>
                        )}
                        <ContextMenuItem onClick={() => dispatch(safeCloseTab({ tabId: tab.id, groupId }))}>
                            Close
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => dispatch(safeCloseOthers({ tabId: tab.id, groupId }))}>
                            Close Others
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => dispatch(safeCloseAll())}>Close All</ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            )}
        </TabBar>
    );
}
