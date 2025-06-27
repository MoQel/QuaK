import {FileElementContainer, getElementForFileElement} from "@/views/project-manager-view/FileElementContainer.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";

export function Directory({name, id}: {name: string, id: string}) {
    return <FileElementContainer name={name} id={id} getContent={getDirectoryContent} edit={DirectoryEdit}/>
}

function DirectoryEdit({id}: {id: string}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-2 flex-none" variant="ghost">E</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Directory</DialogTitle>
                    <DialogDescription>
                        This is a description.
                    </DialogDescription>
                </DialogHeader>
                I'm a body of id {id}.
            </DialogContent>
        </Dialog>
    )
}

interface Directory extends FileElementContainer {
}


async function getDirectoryContent(id : string) {
    const response = await fetch("/file/" + id, {
        method: "GET",
    })

    const dir = await response.json() as Directory
    const elements = [];
    for (const element of dir.contents) {
        elements.push(getElementForFileElement(element))
    }
    return elements
}
