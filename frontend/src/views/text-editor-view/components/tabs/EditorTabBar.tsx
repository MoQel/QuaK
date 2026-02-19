import {
    closeAll,
    closeOthers,
    closeTab,
    moveTab,
    requestLanguageChange,
    requestSave,
    setActiveTab,
    setDragging,
} from '@/store/slices/tabsSlice.ts';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TabBar } from '@/components/TabBar.tsx';
import { EditorGroupMenu } from '@/views/text-editor-view/components/layout/EditorGroupMenu.tsx';
import { EditorTabContextMenuContent } from '@/views/text-editor-view/components/tabs/EditorTabContextMenuContent.tsx';
import { EditorTabLabel } from '@/views/text-editor-view/components/tabs/EditorTabLabel.tsx';

interface TabBarProps {
    groupId: string;
}

export function EditorTabBar({ groupId }: Readonly<TabBarProps>) {
    const dispatch = useAppDispatch();
    const group = useAppSelector((state) => state.tabs.groups.find((g) => g.id === groupId));
    const globalActiveGroupId = useAppSelector((state) => state.tabs.activeGroupId);
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);
    const { groups } = useAppSelector((state) => state.tabs);

    if (!group) return null;
    const { openTabs, activeTabId } = group;
    const isThisGroupFocused = globalActiveGroupId === groupId;

    const dispatchDeferred = (action: Parameters<typeof dispatch>[0]) => setTimeout(() => dispatch(action), 0);

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
                                onClose={() => dispatch(closeTab({ tabId: tab.id, groupId }))}
                            />
                        </ContextMenuTrigger>

                        {/* Right Click Menu Content */}
                        <EditorTabContextMenuContent
                            tab={tab}
                            groupId={groupId}
                            isActive={isActive}
                            onClose={() => dispatchDeferred(closeTab({ tabId: tab.id, groupId }))}
                            onCloseOthers={() => dispatchDeferred(closeOthers({ tabId: tab.id, groupId }))}
                            onCloseAll={() => dispatchDeferred(closeAll())}
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
