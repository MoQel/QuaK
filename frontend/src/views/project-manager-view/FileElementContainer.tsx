import {FileElement} from "@/views/project-manager-view/FileElement.ts";
import {Directory} from "@/views/project-manager-view/Directory.tsx";
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "@/components/ui/collapsible.tsx"
import {JSX, useEffect, useState} from "react";
import {CreateDialog} from "@/views/project-manager-view/CreateDialog.tsx";
import {File} from "@/views/project-manager-view/File.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {Empty} from "@/views/project-manager-view/ProjectManagerView.tsx";
import "./ProjectManagerView.css"

export interface FileElementContainer extends FileElement {
    contents: Array<FileElement>
}

export function getElementForFileElement(object: FileElement) {
    if (object.type === "file") {
        return (<File {...object}/>)
    } else if (object.type === "directory") {
        return (<Directory {...object}/>)
    }
    throw new Error("Could not parse FileElement");
}

export function FileElementContainer({name, id, getContent, edit}: {name: string, id: string, getContent: (id: string) => Promise<JSX.Element[]>, edit: ({id}: {id: string}) => JSX.Element}) {
    const [content, setContent] = useState([<Skeleton className="h-4" />])
    const [click, setClick] = useState(false);

    useEffect(() => {
        getContent(id).then(setContent)
    }, [id, click, getContent])

    return (
        <Collapsible>
            <div className="flex">
                <CollapsibleTrigger
                    className="flex-auto entry"
                    onClick={() => setClick(!click)}
                >
                    {name}
                </CollapsibleTrigger>
                <CreateDialog id={id}/>
                {edit({id})}
            </div>
            <CollapsibleContent>
                <div className="pl-4">
                    {content.length === 0 ? [<Empty/>] : content}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
