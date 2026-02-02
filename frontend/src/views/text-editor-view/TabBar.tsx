import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import {
    closeAll,
    closeOthers,
    closeTab,
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

interface TabBarProps {
    currentLangId: string | null;
}

export function TabBar({ currentLangId }: TabBarProps) {
    const dispatch = useAppDispatch();
    const { openTabs, activeTabId } = useAppSelector((state) => state.tabs);

    if (openTabs.length === 0) return null;

    return (
        <div className="flex w-full flex-col">
            <div className="flex h-9 w-full flex-row items-center overflow-x-auto border-b border-border bg-bg-light scrollbar-hide">
                {openTabs.map((tab) => {
                    const isActive = tab.id === activeTabId;

                    return (
                        <ContextMenu key={tab.id}>
                            <ContextMenuTrigger className="h-full">
                                <div
                                    onClick={() => dispatch(setActiveTab(tab.id))}
                                    className={cn(
                                        'group relative flex h-full min-w-[120px] max-w-[200px] cursor-pointer select-none items-center border-r border-border px-3 text-sm font-medium transition-colors',
                                        !isActive &&
                                            'bg-transparent text-text-muted hover:bg-bg hover:text-text border-t-2 border-t-transparent',
                                        isActive && 'bg-bg text-text border-t-2 border-t-blue-500',
                                    )}
                                >
                                    <span className="mr-2 flex-1 truncate">{tab.title}</span>

                                    <span
                                        className="rounded-sm p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-light hover:text-text text-text-muted"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(closeTab(tab.id));
                                        }}
                                    >
                                        <X className="size-3.5" />
                                    </span>
                                </div>
                            </ContextMenuTrigger>

                            {/* Right Click Menu */}
                            <ContextMenuContent className="w-48">
                                <ContextMenuItem onClick={() => dispatch(closeTab(tab.id))}>Close</ContextMenuItem>
                                <ContextMenuItem onClick={() => dispatch(closeOthers(tab.id))}>
                                    Close Others
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => dispatch(closeAll())}>Close All</ContextMenuItem>
                                <ContextMenuSeparator />
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
                                                {isActive && l.languageId === currentLangId && (
                                                    <ContextMenuShortcut>
                                                        <Check className="size-3.5" />
                                                    </ContextMenuShortcut>
                                                )}
                                            </ContextMenuItem>
                                        ))}
                                    </ContextMenuSubContent>
                                </ContextMenuSub>
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => dispatch(requestSave(tab.id))}>Save</ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    );
                })}
            </div>
        </div>
    );
}
