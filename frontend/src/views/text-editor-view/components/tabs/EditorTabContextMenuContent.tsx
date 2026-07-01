import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/ui/context-menu.tsx';
import { GROUP_BOTTOM, GROUP_MAIN, GROUP_RIGHT } from '@/store/tabs/tabsSlice.ts';
import { languages } from '@/views/text-editor-view/languages/languages.ts';
import { Check } from 'lucide-react';
import { getKeyLabel, getOptionKeyLabel } from '@/views/text-editor-view/utils/getKeyLabel.ts';
import { Tab } from '@/store/tabs/tabsTypes.ts';

interface TabContextMenuProps {
    tab: Tab;
    groupId: string;
    isActive: boolean;
    // Callbacks for action
    onClose: () => void;
    onCloseOthers: () => void;
    onCloseAll: () => void;
    onMoveTab: (toGroupId: string) => void;
    onChangeLanguage: (langId: string) => void;
    onSave: () => void;
}

export function EditorTabContextMenuContent({
    tab,
    groupId,
    isActive,
    onClose,
    onCloseOthers,
    onCloseAll,
    onMoveTab,
    onChangeLanguage,
    onSave,
}: Readonly<TabContextMenuProps>) {
    const metaKey = getKeyLabel();
    const optionKey = getOptionKeyLabel();
    const isReadOnly = tab.kind === 'formal';

    return (
        <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={onClose}>
                <span>Close</span>
                <span className="ml-auto tracking-tighter text-muted text-xs opacity-60">{optionKey} + W</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={onCloseOthers}>Close Others</ContextMenuItem>

            <ContextMenuItem onClick={onCloseAll}>Close All</ContextMenuItem>

            <ContextMenuSeparator />

            {[
                { id: GROUP_MAIN, label: 'Move Left' },
                { id: GROUP_RIGHT, label: 'Move Right' },
                { id: GROUP_BOTTOM, label: 'Move Down' },
            ].map(
                (target) =>
                    groupId !== target.id && (
                        <ContextMenuItem key={target.id} onClick={() => onMoveTab(target.id)}>
                            {target.label}
                        </ContextMenuItem>
                    ),
            )}

            {/* Formal (read-only) tabs have no language and cannot be saved. */}
            {isActive && !isReadOnly && <ContextMenuSeparator />}
            {isActive && !isReadOnly && (
                <ContextMenuSub>
                    <ContextMenuSubTrigger>Language</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                        {languages.map((l) => (
                            <ContextMenuItem key={l.id} onClick={() => onChangeLanguage(l.id)}>
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
            {!isReadOnly && (
                <>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={onSave} className="flex items-center justify-between">
                        <span>Save</span>
                        <span className="ml-auto tracking-tighter text-muted text-xs opacity-60">{metaKey} + S</span>
                    </ContextMenuItem>
                </>
            )}
        </ContextMenuContent>
    );
}
