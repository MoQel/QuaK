import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import {
    closeAll,
    closeOthers,
    closeTab,
    moveTab,
    requestLanguageChange,
    requestSave,
    setActiveTab,
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
import { GenericTabBar } from '@/components/GenericTabBar.tsx';
import { Button } from '@/components/ui/button.tsx'; // Import the new component

interface TabBarProps {
    currentLangId: string | null;
}

export function TabBar({ currentLangId }: Readonly<TabBarProps>) {
    const dispatch = useAppDispatch();
    const { openTabs, activeTabId } = useAppSelector((state) => state.tabs);
    const dirtyFiles = useAppSelector((state) => state.tabs.dirtyFiles);

    return (
        <GenericTabBar
            tabs={openTabs}
            activeTabId={activeTabId}
            onReorder={(fromId, toId) => dispatch(moveTab({ fromId, toId }))}
            onTabClick={(tab) => dispatch(setActiveTab(tab.id))}
        >
            {(tab, isActive) => {
                const isDirty = dirtyFiles.includes(tab.id);

                return (
                    <ContextMenu>
                        <ContextMenuTrigger className="h-full">
                            <div
                                className={cn(
                                    'group relative flex h-full rounded-none min-w-[120px] max-w-[200px] cursor-pointer select-none items-center border-r border-border px-3 text-sm font-medium transition-colors',
                                    !isActive &&
                                        'bg-transparent text-text-muted hover:bg-bg hover:text-text border-t-2 border-t-transparent',
                                    isActive && 'bg-bg text-text border-t-2 border-t-blue-500',
                                )}
                            >
                                <span className="mr-2 flex-1 truncate">{tab.title}</span>

                                <Button
                                    type="button"
                                    aria-label="Close tab"
                                    className={cn(
                                        'relative flex items-center justify-center p-0.5 rounded-sm h-5 w-5 hover:bg-bg-light ',
                                        'bg-transparent border-none',
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(closeTab(tab.id));
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
                            <ContextMenuItem onClick={() => dispatch(closeTab(tab.id))}>Close</ContextMenuItem>
                            <ContextMenuItem onClick={() => dispatch(closeOthers(tab.id))}>
                                Close Others
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => dispatch(closeAll())}>Close All</ContextMenuItem>

                            {isActive && <ContextMenuSeparator />}
                            {isActive && (
                                <ContextMenuSub>
                                    <ContextMenuSubTrigger>Language</ContextMenuSubTrigger>
                                    <ContextMenuSubContent className="w-48">
                                        {languages.map((l) => (
                                            <ContextMenuItem
                                                key={l.languageId}
                                                onClick={() =>
                                                    dispatch(
                                                        requestLanguageChange({
                                                            fileId: tab.id,
                                                            langId: l.languageId,
                                                        }),
                                                    )
                                                }
                                            >
                                                {l.getID().toUpperCase()}
                                                {l.languageId === currentLangId && (
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
                            <ContextMenuItem onClick={() => dispatch(requestSave(tab.id))}>Save</ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                );
            }}
        </GenericTabBar>
    );
}
