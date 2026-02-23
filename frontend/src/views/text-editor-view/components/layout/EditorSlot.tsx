import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { setActiveGroup } from '@/store/tabs/tabsSlice.ts';
import { EditorTabBar } from '@/views/text-editor-view/components/tabs/EditorTabBar.tsx';
import { CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/components/core/QLPEditor.tsx';

export function EditorSlot({ groupId }: Readonly<{ groupId: string }>) {
    const dispatch = useAppDispatch();

    return (
        <div className={'h-full flex flex-col border-r'} onClickCapture={() => dispatch(setActiveGroup(groupId))}>
            <EditorTabBar groupId={groupId} />
            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                <QLPEditor groupId={groupId} />
            </CardContent>
        </div>
    );
}
