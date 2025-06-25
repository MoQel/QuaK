import {Card, CardContent} from "@/components/ui/card.tsx";
import QLPEditor from "@/views/text-editor-view/QLPEditor.tsx";

export function TextEditorView() {
    return (
        <Card className="h-full flex flex-col pb-3">
            <CardContent className="flex flex-col h-full">
                <QLPEditor/>
            </CardContent>
        </Card>
    )
}