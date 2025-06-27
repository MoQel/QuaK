import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "@/components/ui/collapsible.tsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {CreateDialog} from "@/views/project-manager-view/CreateDialog.tsx";
import {FileElement, FileElementContainer} from "@/views/project-manager-view/FileElement.ts";
import {File} from "@/views/project-manager-view/File.tsx";
import {Directory} from "@/views/project-manager-view/Directory.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";

interface Project extends FileElementContainer {
}

async function ProjectContent(id : string) {
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

function getElementForFileElement(object: FileElement) {
    if (object.type === "file") {
        return (<File {...object}/>)
    } else if (object.type === "directory") {
        return (<Directory {...object}/>)
    }
    throw new Error("Could not parse FileElement");
}

export function Project({name, id}: {name: string, id: string}) {
    const [isHover, setIsHover] = useState(false);
    const [content, setContent] = useState([<Skeleton className="h-4 w-[250px]" />])
    const [click, setClick] = useState(false);

    useEffect(() => {
            ProjectContent(id).then(setContent)
    }, [id, click])

    return (
        <Collapsible>
            <div className="flex">
                <CollapsibleTrigger
                    className="flex-auto"
                    onMouseEnter={() => setIsHover(true)}
                    onMouseLeave={() => setIsHover(false)}
                    onClick={() => setClick(!click)}
                    style={isHover ? {textDecoration: 'underline', textAlign: "start"} : {textAlign: "start"}}
                >
                    {name}
                </CollapsibleTrigger>
                <CreateDialog id={id}/>
                <ProjectEdit id={id}/>
            </div>
            <CollapsibleContent>
                <div className="pl-4">
                    {content}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
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