import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { setActiveGroup } from '@/store/tabs/tabsSlice.ts';
import { EditorTabBar } from '@/views/text-editor-view/components/tabs/EditorTabBar.tsx';
import { CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/components/core/QLPEditor.tsx';
import { FormalEditor } from '@/views/text-editor-view/components/formal-editor/FormalEditor.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';

export function EditorSlot({ groupId }: Readonly<{ groupId: string }>) {
    const dispatch = useAppDispatch();

    // A formal tab renders the Dirac notation instead of the Monaco editor. Non-formal (code) keep the existing editor.
    const isFormalActive = useAppSelector((state) => {
        const group = state.tabs.groups.find((g) => g.id === groupId);
        const activeTab = group?.openTabs.find((t) => t.id === group.activeTabId);
        return activeTab?.kind === 'formal';
    });

    // TODO: resolve the circuit the tab was opened from. Atm formal tab only shows the single project circuit (wait for #146)
    const { circuit } = useProject();

    return (
        <div className={'h-full flex flex-col'} onClickCapture={() => dispatch(setActiveGroup(groupId))}>
            <EditorTabBar groupId={groupId} />
            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                {isFormalActive ? <FormalEditor circuit={circuit} /> : <QLPEditor groupId={groupId} />}
            </CardContent>
        </div>
    );
}
