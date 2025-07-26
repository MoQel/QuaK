import {Card, CardContent} from "@/components/ui/card.tsx";
import QLPEditor from "@/views/text-editor-view/QLPEditor.tsx";

export function TextEditorView() {
    return (
        <Card className="h-full flex flex-col p-0">
            <CardContent className="flex flex-col h-full p-0">
                <QLPEditor file={{id: "f2", mimeType: "application/json"}}/>
            </CardContent>
        </Card>
    )
}