import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import {
    GROUP_BOTTOM,
    GROUP_MAIN,
    GROUP_RIGHT,
    splitGroup,
    unsplitAllGroups,
    unsplitGroup,
} from '@/store/tabs/tabsSlice.ts';
import { Button } from '@/components/ui/button.tsx';
import { MoreVertical, SplitSquareHorizontal, SplitSquareVertical, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { EditorGroup } from '@/store/tabs/tabsTypes.ts';
import { safeCloseAll, safeCloseGroup } from '@/store/tabs/tabsThunks.ts';

export function EditorGroupMenu({ groupId, groups }: Readonly<{ groupId: string; groups: EditorGroup[] }>) {
    const dispatch = useAppDispatch();

    const showSplitRight = groupId !== GROUP_RIGHT && !groups.some((g) => g.id === GROUP_RIGHT);
    const showSplitBottom = groupId !== GROUP_BOTTOM && !groups.some((g) => g.id === GROUP_BOTTOM);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-full w-9 rounded-none border-none hover:bg-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none"
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
                {showSplitRight && (
                    <DropdownMenuItem
                        onClick={() => dispatch(splitGroup({ fromGroupId: groupId, toGroupId: GROUP_RIGHT }))}
                    >
                        <SplitSquareHorizontal className="mr-2 size-4" />
                        Split Right
                    </DropdownMenuItem>
                )}
                {showSplitBottom && (
                    <DropdownMenuItem
                        onClick={() => dispatch(splitGroup({ fromGroupId: groupId, toGroupId: GROUP_BOTTOM }))}
                    >
                        <SplitSquareVertical className="mr-2 size-4" />
                        Split Down
                    </DropdownMenuItem>
                )}
                {groupId !== GROUP_MAIN && (
                    <DropdownMenuItem onClick={() => dispatch(unsplitGroup(groupId))}>
                        <div className={'mr-2 size-4'} />
                        Unsplit
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => dispatch(unsplitAllGroups())}>
                    <div className={'mr-2 size-4'} />
                    Unsplit All
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => dispatch(safeCloseGroup(groupId))} className="focus:bg-destructive">
                    <div className={'mr-2 size-4'} />
                    Close Group
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => dispatch(safeCloseAll())} className="focus:bg-destructive">
                    <X className="mr-2 size-4" />
                    Close All
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
