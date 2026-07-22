import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { setActiveGroup } from '@/store/tabs/tabsSlice.ts';
import { EditorTabBar } from '@/views/text-editor-view/components/tabs/EditorTabBar.tsx';
import { CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/components/core/QLPEditor.tsx';
import { FormalEditor } from '@/views/text-editor-view/components/formal-editor/FormalEditor.tsx';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

export function EditorSlot({ groupId }: Readonly<{ groupId: string }>) {
    const dispatch = useAppDispatch();

    // When the active tab is in Dirac view, overlay the read-only notation. The Monaco editor stays
    // mounted underneath (just hidden) so unsaved edits and editor state survive the view switch.
    const isFormalActive = useAppSelector((state) => {
        const group = state.tabs.groups.find((g) => g.id === groupId);
        const activeTab = group?.openTabs.find((t) => t.id === group.activeTabId);
        return activeTab?.viewMode === 'formal';
    });

    // The Dirac view renders the per-file circuit of the active file, so it reflects circuit edits.
    const { activeCircuit } = useCircuitTabs();

    return (
        <div className={'h-full flex flex-col'} onClickCapture={() => dispatch(setActiveGroup(groupId))}>
            <EditorTabBar groupId={groupId} />
            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                <div className="h-full w-full" style={{ display: isFormalActive ? 'none' : 'block' }}>
                    <QLPEditor groupId={groupId} />
                </div>
                {isFormalActive && (
                    <div className="absolute inset-0">
                        <FormalEditor circuit={activeCircuit} />
                    </div>
                )}
            </CardContent>
        </div>
    );
}
