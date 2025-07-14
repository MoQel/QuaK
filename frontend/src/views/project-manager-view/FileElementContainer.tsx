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
import {Delete} from "@/views/project-manager-view/Delete.tsx";

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

export function FileElementContainer({name, id, getContent, edit, icon, deletePath}: {name: string, id: string, getContent: (id: string) => Promise<JSX.Element[]>, edit: (id: string, trigger: (content: Promise<JSX.Element>) => void) => JSX.Element, icon: (open: boolean) => JSX.Element, deletePath: string}) {
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
        <Collapsible open={collapsible} onOpenChange={toggleCollapsible}>
            <Dialog open={open} onOpenChange={setOpen}>
                <ContextMenu>
                    <ContextMenuTrigger>
                        <div className="flex">
                            <CollapsibleTrigger
                                className="flex-auto h-8 flex"
                                onClick={reload}
                            >
                                <ListingElement text={name} icon={icon(collapsible)}/>
                            </CollapsibleTrigger>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ParentRefresh value={reload}>
                            <CreateDialog id={id} trigger={dialogTrigger}/>
                            {edit(id, dialogTrigger)}
                        </ParentRefresh>
                        <Delete path={deletePath} trigger={dialogTrigger}/>
                    </ContextMenuContent>
                </ContextMenu>
                <ParentRefresh value={reload}>
                    <DialogContent>
                        {dialogContent}
                    </DialogContent>
                </ParentRefresh>
            </Dialog>

            <CollapsibleContent>
                <ParentRefresh value={reload}>
                    <div className="pl-2"><div className="pl-2 mb-1 mt-1 border-l-1 border-gray-500 border-opacity-50">
                        {content.length === 0 ? [<Empty/>] : content}
                    </div></div>
                </ParentRefresh>
            </CollapsibleContent>
        </Collapsible>
    )
}
