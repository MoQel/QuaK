import {FileElement} from "@/views/project-manager-view/FileElement.ts";
import {Directory} from "@/views/project-manager-view/Directory.tsx";
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "@/components/ui/collapsible.tsx"
import {JSX, useEffect, useState} from "react";
import {CreateDialog} from "@/views/project-manager-view/CreateDialog.tsx";
import {File} from "@/views/project-manager-view/File.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {Empty, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
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
    const [reloaded, r] = useState(false);
    const reload = () => r(!reloaded)

    useEffect(() => {
        getContent(id).then(setContent)
    }, [id, reloaded, getContent])

    return (
        <Collapsible>
            <div className="flex">
                <CollapsibleTrigger
                    className="flex-auto entry"
                    onClick={reload}
                >
                    {name}
                </CollapsibleTrigger>
                <ParentRefresh value={reload}>
                    <CreateDialog id={id}/>
                </ParentRefresh>
                {edit({id})}
            </div>
            <CollapsibleContent>
                <div className="pl-4">
                    <ParentRefresh value={reload}>
                        {content.length === 0 ? [<Empty/>] : content}
                    </ParentRefresh>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
