import { Card, CardContent } from '@/components/ui/card.tsx';
import QLPEditor from '@/views/text-editor-view/QLPEditor.tsx';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { TabBar } from '@/views/text-editor-view/TabBar.tsx';

export function TextEditorView() {
    const activeTabId = useAppSelector((state) => state.tabs.activeTabId);

    return (
        <Card className="h-full flex flex-col p-0 border-none rounded-none">
            <TabBar />

            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden relative">
                {activeTabId ? (
                    <QLPEditor activeFileId={activeTabId} />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">No file open</div>
                )}
            </CardContent>
        </Card>
    );
}
