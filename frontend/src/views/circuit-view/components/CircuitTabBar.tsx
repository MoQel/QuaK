import { TabBar } from '@/components/TabBar.tsx';
import { EditorTabLabel } from '@/views/text-editor-view/components/tabs/EditorTabLabel.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { moveTab, setActiveTab, setDragging } from '@/store/tabs/tabsSlice.ts';
import { safeCloseTab } from '@/store/tabs/tabsThunks.ts';

export function CircuitTabBar() {
    const dispatch = useAppDispatch();
    const activeGroupId = useAppSelector((state) => state.tabs.activeGroupId);
    const group = useAppSelector((state) => state.tabs.groups.find((candidate) => candidate.id === activeGroupId));
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);

    if (!group || group.openTabs.length === 0) return null;

    return (
        <TabBar
            groupId={group.id}
            tabs={group.openTabs}
            activeTabId={group.activeTabId}
            onDragStateChange={(isDragging) => dispatch(setDragging(isDragging))}
            onReorder={(fromId, toId) =>
                dispatch(
                    moveTab({
                        fromId,
                        fromGroupId: group.id,
                        toId,
                        toGroupId: group.id,
                    }),
                )
            }
            onTabClick={(tab) => dispatch(setActiveTab({ tabId: tab.id, groupId: group.id }))}
        >
            {(tab, isActive) => (
                <EditorTabLabel
                    tab={tab}
                    isActive={isActive}
                    isDirty={dirtyFiles.includes(tab.id)}
                    isThisGroupFocused={true}
                    onClose={() => dispatch(safeCloseTab({ tabId: tab.id, groupId: group.id }))}
                />
            )}
        </TabBar>
    );
}
