import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {FileElementContainer, getElementForFileElement} from "@/views/project-manager-view/FileElementContainer.tsx";

export interface Project extends FileElementContainer {
}

async function getProjectContent(id : string) {
    const response = await fetch("/project/" + id, {
        method: "GET",
    })

    const project = await response.json() as Project
    const elements = [];
    for (const element of project.contents) {
        elements.push(getElementForFileElement(element))
    }
    return elements
}

export function Project({name, id}: {name: string, id: string}) {
    return <FileElementContainer name={name} id={id} getContent={getProjectContent} edit={ProjectEdit}/>
}

function ProjectEdit({id}: {id: string}) {
    //TODO: Implement the edit-functionality
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-2 flex-none" variant="ghost">E</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        This is a description.
                    </DialogDescription>
                </DialogHeader>
                I'm a body of id {id}.
            </DialogContent>
        </Dialog>
    )
}