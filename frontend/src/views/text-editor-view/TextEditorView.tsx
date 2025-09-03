import {Card, CardContent} from "@/components/ui/card.tsx";
import QLPEditor from "@/views/text-editor-view/QLPEditor.tsx";
import {File} from "@/views/project-manager-view/util/FileElement.tsx";

export function TextEditorView({file}: {file: File | undefined}) {
    return (
        <Card className="h-full flex flex-col p-0">
            <CardContent className="flex flex-col h-full p-0">
                <QLPEditor file={file}/>
            </CardContent>
        </Card>
    )
}