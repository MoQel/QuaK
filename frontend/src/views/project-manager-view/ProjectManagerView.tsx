import {Card, CardContent} from "@/components/ui/card.tsx";
import {Project} from "@/views/project-manager-view/Project.tsx";

export function ProjectManagerView() {
    return (
        <Card className="h-full">
            <CardContent>
                <Project name="Test" id="p1"/>
            </CardContent>
        </Card>
    )
}