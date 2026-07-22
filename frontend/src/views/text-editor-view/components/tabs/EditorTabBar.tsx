import { moveTab, requestLanguageChange, requestSave, setActiveTab, setDragging } from '@/store/tabs/tabsSlice.ts';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TabBar } from '@/components/TabBar.tsx';
import { EditorGroupMenu } from '@/views/text-editor-view/components/layout/EditorGroupMenu.tsx';
import { EditorTabContextMenuContent } from '@/views/text-editor-view/components/tabs/EditorTabContextMenuContent.tsx';
import { EditorTabLabel } from '@/views/text-editor-view/components/tabs/EditorTabLabel.tsx';
import { safeCloseAll, safeCloseOthers, safeCloseTab } from '@/store/tabs/tabsThunks.ts';
import { AppDispatch, RootState } from '@/store/store.ts';
import { UnknownAction } from 'redux';

interface TabBarProps {
    groupId: string;
}

type EditorAction = UnknownAction | ((dispatch: AppDispatch, getState: () => RootState) => void);

export function EditorTabBar({ groupId }: Readonly<TabBarProps>) {
    const dispatch = useAppDispatch();
    const group = useAppSelector((state) => state.tabs.groups.find((g) => g.id === groupId));
    const globalActiveGroupId = useAppSelector((state) => state.tabs.activeGroupId);
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);
    const { groups } = useAppSelector((state) => state.tabs);

    if (!group) return null;
    const { openTabs, activeTabId } = group;
    const isThisGroupFocused = globalActiveGroupId === groupId;

    // Defers Redux actions to the next tick.
    // This prevents Radix UI focus management from crashing when the tab's DOM element
    // is unmounted synchronously before the context menu finishes closing.
    const dispatchDeferred = (action: EditorAction) => setTimeout(() => dispatch(action), 0);

    return (
        <TabBar
            groupId={groupId}
            tabs={openTabs}
            rightSlot={<EditorGroupMenu groupId={groupId} groups={groups} />}
            activeTabId={activeTabId}
            onDragStateChange={(isDragging) => dispatch(setDragging(isDragging))}
            onReorder={(fromId, toId) =>
                // Reorder within a group
                dispatch(
                    moveTab({
                        fromId,
                        fromGroupId: groupId,
                        toId,
                        toGroupId: groupId,
                    }),
                )
            }
            onMoveExternal={(tabId, sourceGroupId, targetTabId) => {
                dispatch(
                    moveTab({
                        fromId: tabId,
                        fromGroupId: sourceGroupId,
                        toId: targetTabId,
                        toGroupId: groupId,
                    }),
                );
                dispatch(setDragging(false));
            }}
            onTabClick={(tab) => dispatch(setActiveTab({ tabId: tab.id, groupId }))}
        >
            {(tab, isActive) => {
                const isDirty = dirtyFiles.includes(tab.id);

                return (
                    <ContextMenu>
                        <ContextMenuTrigger className="h-full" asChild>
                            <EditorTabLabel
                                tab={tab}
                                isActive={isActive}
                                isDirty={isDirty}
                                isThisGroupFocused={isThisGroupFocused}
                                onClose={() => dispatch(safeCloseTab({ tabId: tab.id, groupId }))}
                            />
                        </ContextMenuTrigger>

                        {/* Right Click Menu Content */}
                        <EditorTabContextMenuContent
                            tab={tab}
                            groupId={groupId}
                            isActive={isActive}
                            onClose={() => dispatchDeferred(safeCloseTab({ tabId: tab.id, groupId }))}
                            onCloseOthers={() => dispatchDeferred(safeCloseOthers({ tabId: tab.id, groupId }))}
                            onCloseAll={() => dispatchDeferred(safeCloseAll())}
                            onMoveTab={(toGroupId) =>
                                dispatchDeferred(
                                    moveTab({
                                        fromId: tab.id,
                                        fromGroupId: groupId,
                                        toGroupId,
                                    }),
                                )
                            }
                            onChangeLanguage={(langId) =>
                                dispatch(
                                    requestLanguageChange({
                                        fileId: tab.id,
                                        langId,
                                    }),
                                )
                            }
                            onSave={() => dispatch(requestSave(tab.id))}
                        />
                    </ContextMenu>
                );
            }}
        </TabBar>
    );
}
