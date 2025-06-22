import {Card, CardContent} from "@/components/ui/card.tsx";
import QLPEditor from "@/views/text-editor-view/QLPEditor.tsx";

export function TextEditorView() {
    return (
        <Card className="h-full">
            <CardContent>
                <QLPEditor/>
            </CardContent>
        </Card>
    )
}