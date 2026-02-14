import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import {
    closeAll,
    closeOthers,
    closeTab,
    GROUP_BOTTOM,
    GROUP_MAIN,
    GROUP_RIGHT,
    moveTab,
    requestLanguageChange,
    requestSave,
    setActiveTab,
    setDragging,
} from '@/store/slices/tabsSlice';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
    ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { languages } from '@/views/text-editor-view/languages/languages.ts';
import { TabBar } from '@/components/TabBar.tsx';
import { Button } from '@/components/ui/button.tsx';
import { TextEditorGroupMenu } from '@/views/text-editor-view/TextEditorGroupMenu.tsx';
import { getKeyLabel, getOptionKeyLabel } from '@/views/text-editor-view/util/getKeyLabel.ts';

interface TabBarProps {
    groupId: string;
}

export function TextEditorTabBar({ groupId }: Readonly<TabBarProps>) {
    const dispatch = useAppDispatch();
    const group = useAppSelector((state) => state.tabs.groups.find((g) => g.id === groupId));
    const globalActiveGroupId = useAppSelector((state) => state.tabs.activeGroupId);
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);
    const { groups } = useAppSelector((state) => state.tabs);

    const metaKey = getKeyLabel();
    const optionKey = getOptionKeyLabel();

    if (!group) return null;
    const { openTabs, activeTabId } = group;
    const isThisGroupFocused = globalActiveGroupId === groupId;

    return (
        <TabBar
            groupId={groupId}
            tabs={openTabs}
            rightSlot={<TextEditorGroupMenu groupId={groupId} groups={groups} />}
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
                            <div
                                className={cn(
                                    'group relative flex h-full rounded-none min-w-[120px] max-w-[200px] cursor-pointer select-none items-center border-r border-border px-3 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-bg-dark text-text border-t-2'
                                        : 'bg-transparent text-text-muted hover:bg-bg hover:text-text border-t-2 border-t-transparent',
                                    isActive && (isThisGroupFocused ? 'border-t-blue-500' : 'border-t-gray-500'),
                                )}
                            >
                                <span className="mr-2 flex-1 truncate">{tab.title}</span>

                                <Button
                                    type="button"
                                    aria-label="Close tab"
                                    className={cn(
                                        'relative flex items-center justify-center p-0.5 rounded-sm h-5 w-5 hover:bg-bg-light ',
                                        'bg-transparent shadow-none border-none',
                                    )}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(closeTab({ tabId: tab.id, groupId }));
                                    }}
                                >
                                    <X className="size-3.5 transition-opacity opacity-0 group-hover:opacity-100" />
                                    {isDirty && (
                                        <div className="absolute inset-0 flex items-center justify-center group-hover:hidden">
                                            <div className="h-2 w-2 rounded-full bg-text-muted" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </ContextMenuTrigger>

                        {/* Right Click Menu Content */}
                        <ContextMenuContent className="w-48">
                            <ContextMenuItem
                                onClick={() => {
                                    // Defer execution to the next tick to allow the context menu to
                                    // close and clean up its focus management before the tab is unmounted.
                                    setTimeout(() => dispatch(closeTab({ tabId: tab.id, groupId })), 0);
                                }}
                            >
                                <span>Close</span>
                                <span className="ml-auto tracking-tighter text-muted text-xs opacity-60">
                                    {optionKey} + W
                                </span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => dispatch(closeOthers({ tabId: tab.id, groupId }))}>
                                Close Others
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => dispatch(closeAll())}>Close All</ContextMenuItem>
                            <ContextMenuSeparator />
                            {groupId != GROUP_MAIN && (
                                <ContextMenuItem
                                    onClick={() =>
                                        dispatch(
                                            moveTab({
                                                fromId: tab.id,
                                                fromGroupId: groupId,
                                                toGroupId: GROUP_MAIN,
                                            }),
                                        )
                                    }
                                >
                                    Move Left
                                </ContextMenuItem>
                            )}
                            {groupId != GROUP_RIGHT && (
                                <ContextMenuItem
                                    onClick={() =>
                                        dispatch(
                                            moveTab({
                                                fromId: tab.id,
                                                fromGroupId: groupId,
                                                toGroupId: GROUP_RIGHT,
                                            }),
                                        )
                                    }
                                >
                                    Move Right
                                </ContextMenuItem>
                            )}

                            {groupId != GROUP_BOTTOM && (
                                <ContextMenuItem
                                    onClick={() =>
                                        dispatch(
                                            moveTab({
                                                fromId: tab.id,
                                                fromGroupId: groupId,
                                                toGroupId: GROUP_BOTTOM,
                                            }),
                                        )
                                    }
                                >
                                    Move Down
                                </ContextMenuItem>
                            )}

                            {isActive && <ContextMenuSeparator />}
                            {isActive && (
                                <ContextMenuSub>
                                    <ContextMenuSubTrigger>Language</ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                        {languages.map((l) => (
                                            <ContextMenuItem
                                                key={l.id}
                                                onClick={() =>
                                                    dispatch(
                                                        requestLanguageChange({
                                                            fileId: tab.id,
                                                            langId: l.id,
                                                        }),
                                                    )
                                                }
                                            >
                                                {l.getName()}
                                                {l.id === tab.language && (
                                                    <ContextMenuShortcut>
                                                        <Check className="size-3.5" />
                                                    </ContextMenuShortcut>
                                                )}
                                            </ContextMenuItem>
                                        ))}
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                            )}
                            <ContextMenuSeparator />
                            <ContextMenuItem
                                onClick={() => dispatch(requestSave(tab.id))}
                                className="flex items-center justify-between"
                            >
                                <span>Save</span>
                                <span className="ml-auto tracking-tighter text-muted text-xs opacity-60">
                                    {metaKey} + S
                                </span>
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                );
            }}
        </TabBar>
    );
}
