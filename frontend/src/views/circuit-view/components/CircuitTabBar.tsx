import { TabBar } from '@/components/TabBar.tsx';
import { EditorTabLabel } from '@/views/text-editor-view/components/tabs/EditorTabLabel.tsx';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { moveTab, setActiveTab, setDragging } from '@/store/tabs/tabsSlice.ts';
import { safeCloseAll, safeCloseOthers, safeCloseTab } from '@/store/tabs/tabsThunks.ts';

/**
 * The circuit's file-tab bar. It shares the open-file tabs with the editor but only exposes
 * the actions that have a meaning for the single circuit panel: closing tabs (which close the
 * shared file) and drag-to-reorder. The editor's split/move/group actions are intentionally
 * left out — those rearrange the code-editor panes, which the circuit panel does not have.
 */
export function CircuitTabBar() {
    const dispatch = useAppDispatch();
    const activeGroupId = useAppSelector((state) => state.tabs.activeGroupId);
    const group = useAppSelector((state) => state.tabs.groups.find((candidate) => candidate.id === activeGroupId));
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);

    if (!group || group.openTabs.length === 0) return null;
    const groupId = group.id;

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
