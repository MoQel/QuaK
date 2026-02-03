import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx';
import { JSX, useEffect, useState } from 'react';
import { CreateDialog } from '@/views/project-manager-view/CreateDialog.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { ParentRefresh } from '@/views/project-manager-view/ProjectManagerView.tsx';
import './ProjectManagerView.css';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from '@/components/ui/context-menu.tsx';
import { Dialog, DialogContent } from '@/components/ui/dialog.tsx';
import { Delete } from '@/views/project-manager-view/Delete.tsx';
import { Empty, ListingElement } from '@/views/project-manager-view/util/TreeComponents.tsx';

/**
 * Provides an icon based on the given open-state of the container.
 */
export type Icon = (open: boolean) => JSX.Element;

/**
 * Provides the functionality to edit the FileElementContainer
 * @param id The id of the element to edit
 * @param openDialog A function that opens a dialog and displays the given elements after their promise resolves.
 * @returns {} A {@link ContextMenuItem}
 */
type Edit = (id: string, openDialog: (content: Promise<JSX.Element>) => void) => JSX.Element;

/**
 * Fetches the content of the given id and returns its parsed elements
 * @param id The id to fetch
 */
type ContentFetch = (id: string) => Promise<JSX.Element[]>;

/**
 * Provides a display of a FileElementContainer using a {@link Collapsible}
 * @param name The name of the container
 * @param id The id of the container
 * @param getContent The content-fetcher
 * @param edit The edit-provider
 * @param icon The icon-function
 * @param deletePath The HTTP-path to request deletion of the element
 * @constructor
 */
export function FileElementContainer({
    name,
    id,
    getContent,
    edit,
    icon,
    deletePath,
}: {
    name: string;
    id: string;
    getContent: ContentFetch;
    edit: Edit;
    icon: Icon;
    deletePath: string;
}) {
    const [content, setContent] = useState([<Skeleton className="h-4" />]);
    const [dialogContent, setDialogContent] = useState(<Skeleton className="h-5 mt-5" />);
    const [reloaded, r] = useState(false);
    const reload = () => r(!reloaded);
    const [open, setOpen] = useState(false);
    const [collapsible, toggleCollapsible] = useState(false);

    useEffect(() => {
        getContent(id).then(setContent);
    }, [id, reloaded, getContent]);

    const openDialog = (content: Promise<JSX.Element>) => {
        setOpen(true);
        content.then(setDialogContent);
    };

    return (
        <Collapsible open={collapsible} onOpenChange={toggleCollapsible}>
            <Dialog open={open} onOpenChange={setOpen}>
                <ContextMenu>
                    <ContextMenuTrigger>
                        <div className="flex">
                            <CollapsibleTrigger className="flex-auto h-8 flex" onClick={reload}>
                                <ListingElement text={name} icon={icon(collapsible)} />
                            </CollapsibleTrigger>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ParentRefresh value={reload}>
                            <CreateDialog id={id} openDialog={openDialog} />
                            {edit(id, openDialog)}
                        </ParentRefresh>
                        <Delete endpoint={deletePath} openDialog={openDialog} />
                    </ContextMenuContent>
                </ContextMenu>
                <ParentRefresh value={reload}>
                    <DialogContent>{dialogContent}</DialogContent>
                </ParentRefresh>
            </Dialog>

            <CollapsibleContent>
                <ParentRefresh value={reload}>
                    <div className="pl-2">
                        <div className="pl-2 mb-1 mt-1 border-l-1 border-border border-opacity-50">
                            {content.length === 0 ? [<Empty key="empty" />] : content}
                        </div>
                    </div>
                </ParentRefresh>
            </CollapsibleContent>
        </Collapsible>
    );
}
