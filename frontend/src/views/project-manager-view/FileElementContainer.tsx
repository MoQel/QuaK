import {FileElement} from "@/views/project-manager-view/FileElement.ts";
import {Directory} from "@/views/project-manager-view/Directory.tsx";
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "@/components/ui/collapsible.tsx"
import {JSX, useEffect, useState} from "react";
import {CreateDialog} from "@/views/project-manager-view/CreateDialog.tsx";
import {File} from "@/views/project-manager-view/File.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {Empty, ListingElement, ParentRefresh} from "@/views/project-manager-view/ProjectManagerView.tsx";
import "./ProjectManagerView.css"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger
} from "@/components/ui/context-menu.tsx";
import {Dialog, DialogContent} from "@/components/ui/dialog.tsx";

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

export function FileElementContainer({name, id, getContent, edit, icon}: {name: string, id: string, getContent: (id: string) => Promise<JSX.Element[]>, edit: (id: string, trigger: (content: Promise<JSX.Element>) => void) => JSX.Element, icon: (open: boolean) => JSX.Element}) {
    const [content, setContent] = useState([<Skeleton className="h-4" />])
    const [dialogContent, setDialogContent] = useState(<Skeleton className="h-5 mt-5" />)
    const [reloaded, r] = useState(false);
    const reload = () => r(!reloaded)
    const [open, setOpen] = useState(false)
    const [collapsible, toggleCollapsible] = useState(false)

    useEffect(() => {
        getContent(id).then(setContent)
    }, [id, reloaded, getContent])

    const dialogTrigger = (content: Promise<JSX.Element>) => {
        setOpen(true)
        content.then(setDialogContent)
    }

    return (
        <ParentRefresh value={reload}>
            <Collapsible open={collapsible} onOpenChange={toggleCollapsible}>
                <Dialog open={open} onOpenChange={setOpen}>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div className="flex">
                                <CollapsibleTrigger
                                    className="flex-auto entry h-8 flex"
                                    onClick={reload}
                                >
                                    <ListingElement text={name} icon={icon(collapsible)}/>
                                </CollapsibleTrigger>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <CreateDialog id={id} trigger={dialogTrigger}/>
                            {edit(id, dialogTrigger)}
                        </ContextMenuContent>
                    </ContextMenu>
                    <DialogContent>
                        {dialogContent}
                    </DialogContent>
                </Dialog>

                <CollapsibleContent>
                    <div className="pl-4">
                        {content.length === 0 ? [<Empty/>] : content}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </ParentRefresh>
    )
}
